import { endpoints } from "../http/endpoints";
import { activePortal, readSession } from "../auth/authSession";
import type { NotificationItemDto } from "./notificationService";

// Fetch-based SSE client for notifications (Option A).
//
// Native `EventSource` cannot send an `Authorization` header, and this app authenticates with a
// Bearer JWT held in localStorage (see src/services/http/api-client.ts). So instead of EventSource
// we open the stream with `fetch`, attach the Bearer header, and parse the `text/event-stream` body
// ourselves. This keeps the token in a header (never in the URL/query string, never logged) and
// reuses the exact same auth the REST API already uses.
//
// Delivery is best-effort. The notification row in the DB is the source of truth, so on (re)connect
// the caller re-syncs the list/counts from REST — anything missed while disconnected is recovered.

const STREAM_EVENT = "notification.created";

// Backoff for reconnect attempts (ms). Index 0 is the immediate first try; later drops reuse the
// last (longest) delay. Mirrors the bounded backoff the old SignalR client used.
const RECONNECT_DELAYS_MS = [0, 2000, 5000, 10000, 20000];

export type NotificationStreamHandlers = {
  /** A new notification arrived over the stream. */
  onNotification: (notification: NotificationItemDto) => void;
  /** Fired after a successful (re)connect — use it to re-sync list/counts from REST. */
  onReconnect?: () => void;
};

function resolveStreamUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  // endpoints are root-relative ("/notifications/stream"); join onto the configured API base.
  return `${baseUrl.replace(/\/$/, "")}${endpoints.notifications.stream}`;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/** Parse one raw SSE block (lines up to a blank line) and dispatch a notification.created event. */
function handleEventBlock(block: string, handlers: NotificationStreamHandlers): void {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line === "" || line.startsWith(":")) {
      // Blank line or comment (": ping" heartbeat) — ignore.
      continue;
    }
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).replace(/^ /, ""));
    }
  }

  if (eventName !== STREAM_EVENT || dataLines.length === 0) {
    return;
  }

  try {
    const notification = JSON.parse(dataLines.join("\n")) as NotificationItemDto;
    if (notification && typeof notification.id === "string") {
      handlers.onNotification(notification);
    }
  } catch {
    // Malformed payload — drop it rather than crash the stream.
  }
}

async function readStream(
  body: ReadableStream<Uint8Array>,
  handlers: NotificationStreamHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line. Process every complete event in the buffer.
    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex >= 0) {
      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      handleEventBlock(block, handlers);
      separatorIndex = buffer.indexOf("\n\n");
    }
  }
}

/**
 * Opens the notification SSE stream and keeps it alive with bounded-backoff reconnects.
 * Returns a disposer that aborts the stream and stops reconnecting (call on logout/unmount).
 */
export function openNotificationStream(handlers: NotificationStreamHandlers): () => void {
  const controller = new AbortController();
  let closed = false;
  let attempt = 0;

  const run = async () => {
    while (!closed) {
      const token = readSession(activePortal())?.accessToken;
      if (!token) {
        // Not authenticated yet — wait briefly and re-check rather than failing hard.
        await wait(2000, controller.signal);
        continue;
      }

      try {
        const response = await fetch(resolveStreamUrl(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Notification stream failed: ${response.status}`);
        }

        // Connected. If this was a reconnect, let the caller re-sync from REST so nothing pushed
        // while we were offline is missed.
        if (attempt > 0) {
          handlers.onReconnect?.();
        }
        attempt = 0;

        await readStream(response.body, handlers);
        // Stream ended cleanly (server closed) — fall through to reconnect.
      } catch {
        if (closed || controller.signal.aborted) {
          return;
        }
        // Swallow: realtime is best-effort. The REST load already populated the panel.
      }

      const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
      attempt += 1;
      await wait(delay, controller.signal);
    }
  };

  void run();

  return () => {
    closed = true;
    controller.abort();
  };
}
