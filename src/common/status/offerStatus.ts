// Canonical OfferStatus domain for the frontend.
//
// Mirrors RecruitPro.Domain.Enums.OfferStatus (Draft, Sent, Accepted, Declined). An offer is only
// candidate-actionable while it is Sent and the application is in Offer (BR-APPLICATION-009 / INV-009).

import type { StatusTone } from "./statusPresentation";

export const OfferStatus = {
  Draft: "Draft",
  Sent: "Sent",
  Accepted: "Accepted",
  Declined: "Declined",
} as const;

export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

const OFFER_STATUS_VALUES = new Set<string>(Object.values(OfferStatus));

export function isOfferStatus(value: unknown): value is OfferStatus {
  return typeof value === "string" && OFFER_STATUS_VALUES.has(value);
}

export function normalizeOfferStatus(value: unknown): OfferStatus | null {
  if (typeof value !== "string") return null;
  switch (value.trim().toLowerCase().replace(/[_\s-]+/g, "")) {
    case "draft":
      return OfferStatus.Draft;
    case "sent":
      return OfferStatus.Sent;
    case "accepted":
      return OfferStatus.Accepted;
    case "declined":
      return OfferStatus.Declined;
    default:
      return null;
  }
}

// An offer can be responded to (accept/decline) only while it is Sent.
export function isOfferActionableStatus(value: unknown): boolean {
  return normalizeOfferStatus(value) === OfferStatus.Sent;
}

type OfferStatusPresentation = {
  label: string;
  tone: StatusTone;
};

const OFFER_STATUS_PRESENTATION: Record<OfferStatus, OfferStatusPresentation> = {
  Draft: { label: "Bản nháp", tone: "neutral" },
  Sent: { label: "Đã gửi", tone: "info" },
  Accepted: { label: "Đã chấp nhận", tone: "success" },
  Declined: { label: "Đã từ chối", tone: "neutral" },
};

export function getOfferStatusPresentation(value: unknown): OfferStatusPresentation {
  const status = normalizeOfferStatus(value);
  if (status) return OFFER_STATUS_PRESENTATION[status];
  return { label: typeof value === "string" && value ? value : "Chưa tạo", tone: "neutral" };
}
