import apiClient from "../../services/http/api-client";

function normalizeProtectedFileUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/api/")) {
    return url.replace(/^\/api/, "");
  }

  return url;
}

export async function fetchProtectedFileBlob(url: string) {
  return apiClient.get<Blob>(normalizeProtectedFileUrl(url), {
    responseType: "blob",
  }) as unknown as Promise<Blob>;
}

export async function openProtectedFileInNewTab(url: string) {
  const previewWindow = window.open("", "_blank", "noopener,noreferrer");

  try {
    const blob = await fetchProtectedFileBlob(url);
    const blobUrl = URL.createObjectURL(blob);

    if (previewWindow) {
      previewWindow.location.href = blobUrl;
    } else {
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    }

    return blobUrl;
  } catch (error) {
    if (previewWindow) {
      previewWindow.close();
    }

    throw error;
  }
}

export async function downloadProtectedFile(url: string, fileName: string) {
  const blob = await fetchProtectedFileBlob(url);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
