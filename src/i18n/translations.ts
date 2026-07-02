import { en } from "./en";
import { vi } from "./vi";

export type Lang = "vi" | "en";

export const translations: Record<Lang, typeof en> = { en, vi };
