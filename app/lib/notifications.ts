import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { UserProfile } from "./types";

/**
 * Job updates over WhatsApp and email.
 *
 * The number is saved through a Cloud Function rather than written straight to
 * Firestore: it has to come back normalised to E.164 or the WhatsApp Cloud API
 * will not accept it, and the welcome message goes out in the same round trip.
 */

export interface NotificationPrefs {
  whatsappNumber: string;
  whatsappOptIn: boolean;
  emailOptIn: boolean;
}

const saveCall = httpsCallable<
  NotificationPrefs,
  { success: boolean; whatsappNumber: string; welcomed: boolean }
>(functions, "saveNotificationPrefs");

const dismissCall = httpsCallable<Record<string, never>, { success: boolean }>(
  functions,
  "dismissNotificationPrompt"
);

export async function saveNotificationPrefs(prefs: NotificationPrefs) {
  const res = await saveCall(prefs);
  return res.data;
}

/** "Not now" — recorded so the prompt stops appearing on every visit. */
export async function dismissNotificationPrompt() {
  await dismissCall({});
}

/** How long a "not now" holds before we ask again. */
const REPROMPT_DAYS = 7;

/**
 * Whether to show the WhatsApp prompt to this member.
 *
 * Everyone who has never answered sees it — including the people who signed up
 * before the channel existed, which is the whole point: they get asked the
 * next time they open the dashboard. Anyone who answered, either way, is left
 * alone until the re-prompt window passes.
 */
export function shouldPromptForWhatsApp(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.whatsappOptIn && profile.whatsappNumber) return false;

  const answeredMs = profile.notificationsPromptedAt?.toMillis?.() ?? 0;
  if (!answeredMs) return true;
  return Date.now() - answeredMs > REPROMPT_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Light client-side check, purely so the form can say something useful before
 * it submits. The server normalises and has the final word.
 */
export function looksLikePhoneNumber(raw: string): boolean {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Display form for a stored E.164 number: "+220 712 3456". */
export function formatPhoneNumber(e164: string): string {
  const match = /^\+(\d{1,3})(\d+)$/.exec(String(e164 || "").trim());
  if (!match) return e164 || "";
  const [, country, rest] = match;
  return `+${country} ${rest.replace(/(\d{3})(?=\d)/g, "$1 ").trim()}`;
}
