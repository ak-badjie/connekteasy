import * as admin from 'firebase-admin';

/**
 * Outbound notifications: WhatsApp (Meta Cloud API) and email (Resend).
 *
 * Both are best-effort — a job sync must never fail because a message did not
 * go out — and both no-op cleanly when their credentials are missing, so the
 * rest of the platform works before the accounts are set up.
 *
 * Required environment (functions/.env):
 *   WHATSAPP_ACCESS_TOKEN     Meta system-user token with whatsapp_business_messaging
 *   WHATSAPP_PHONE_NUMBER_ID  the sending number's id from the WhatsApp Manager
 *   WHATSAPP_TEMPLATE_NAME    approved template, defaults to connekt_job_update
 *   WHATSAPP_TEMPLATE_LANG    template language code, defaults to en
 *   RESEND_API_KEY            re_… key from resend.com
 *   RESEND_FROM               verified sender, e.g. "CONNEKT <alerts@connekt.gm>"
 */

const GRAPH_VERSION = 'v21.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'connekt_job_update';
const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'en';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'CONNEKT <alerts@connekt.gm>';

export const APP_URL = (process.env.APP_BASE_URL || 'https://www.connekt.africa').replace(/\/$/, '');

export const whatsappConfigured = () => !!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
export const emailConfigured = () => !!RESEND_API_KEY;

/**
 * Normalise a number the way a Gambian would type it into E.164.
 * "7123456", "07123456", "220 7123456" and "+220 712 3456" all land on
 * "+2207123456". Returns null when there is nothing usable.
 */
export function toE164(raw: string, defaultCountry = '220'): string | null {
    let digits = String(raw || '').replace(/[^\d+]/g, '');
    if (!digits) return null;

    if (digits.startsWith('+')) {
        digits = digits.slice(1).replace(/\D/g, '');
    } else {
        digits = digits.replace(/\D/g, '');
        if (digits.startsWith('00')) digits = digits.slice(2);
        else if (digits.startsWith('0')) digits = defaultCountry + digits.slice(1);
        else if (!digits.startsWith(defaultCountry) && digits.length <= 9) {
            digits = defaultCountry + digits;
        }
    }

    // The shortest real E.164 number is 8 digits including the country code.
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
}

export interface SendResult {
    ok: boolean;
    skipped?: string;
    error?: string;
    id?: string;
}

/**
 * Send one WhatsApp message.
 *
 * Meta only allows free-form text inside the 24-hour service window opened by
 * the user's own message. Business-initiated alerts must use an approved
 * template, so that is what we send when `bodyParams` is supplied; it fills the
 * template's {{1}}, {{2}}… placeholders. Without them we send plain text, which
 * is what a reply inside the window (and local testing) uses.
 */
export async function sendWhatsApp(
    to: string,
    text: string,
    bodyParams?: string[]
): Promise<SendResult> {
    if (!whatsappConfigured()) return { ok: false, skipped: 'whatsapp-not-configured' };
    const number = toE164(to);
    if (!number) return { ok: false, skipped: 'invalid-number' };

    const payload: Record<string, unknown> =
        bodyParams && bodyParams.length && WHATSAPP_TEMPLATE_NAME
            ? {
                  messaging_product: 'whatsapp',
                  to: number,
                  type: 'template',
                  template: {
                      name: WHATSAPP_TEMPLATE_NAME,
                      language: { code: WHATSAPP_TEMPLATE_LANG },
                      components: [
                          {
                              type: 'body',
                              // Meta rejects newlines and runs of spaces inside
                              // template parameters.
                              parameters: bodyParams.map((t) => ({
                                  type: 'text',
                                  text: String(t).replace(/\s+/g, ' ').slice(0, 900),
                              })),
                          },
                      ],
                  },
              }
            : {
                  messaging_product: 'whatsapp',
                  to: number,
                  type: 'text',
                  text: { preview_url: true, body: text.slice(0, 4000) },
              };

    try {
        const res = await fetch(
            `https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(20000),
            }
        );
        const data = (await res.json()) as any;
        if (!res.ok) {
            return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
        }
        return { ok: true, id: data?.messages?.[0]?.id };
    } catch (err: any) {
        return { ok: false, error: err?.message || 'whatsapp request failed' };
    }
}

/** Send one transactional email through Resend. */
export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
): Promise<SendResult> {
    if (!emailConfigured()) return { ok: false, skipped: 'resend-not-configured' };
    if (!to || !to.includes('@')) return { ok: false, skipped: 'invalid-email' };

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: RESEND_FROM,
                to: [to],
                subject,
                html,
                ...(text ? { text } : {}),
            }),
            signal: AbortSignal.timeout(20000),
        });
        const data = (await res.json()) as any;
        if (!res.ok) return { ok: false, error: data?.message || `HTTP ${res.status}` };
        return { ok: true, id: data?.id };
    } catch (err: any) {
        return { ok: false, error: err?.message || 'resend request failed' };
    }
}

/** Record what went out, so a member can see why they were messaged. */
export async function logNotification(entry: {
    uid: string;
    channel: 'whatsapp' | 'email';
    kind: string;
    to: string;
    subject?: string;
    result: SendResult;
}): Promise<void> {
    try {
        await admin.firestore().collection('notifications').add({
            uid: entry.uid,
            channel: entry.channel,
            kind: entry.kind,
            to: entry.to,
            subject: entry.subject || null,
            ok: entry.result.ok,
            error: entry.result.error || entry.result.skipped || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
        console.warn('logNotification failed:', err);
    }
}

// ─── Templates ─────────────────────────────────────────────

export function escapeHtml(s: string): string {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function shell(title: string, body: string): string {
    return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f7f8;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
    <div style="background:#134e4a;padding:20px 24px">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em">CONNEKT</span>
      <span style="color:#5eead4;font-size:11px;margin-left:8px">Jobs in The Gambia</span>
    </div>
    <div style="padding:24px">
      <h1 style="margin:0 0 12px;font-size:18px;color:#111827">${title}</h1>
      ${body}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:11px;line-height:1.6">
      You are getting this because you asked CONNEKT to keep you posted on your
      work updates. We never send marketing.
      <a href="${APP_URL}/dashboard/settings" style="color:#0d9488">Manage notifications</a>.
    </div>
  </div>
</div>`;
}

export interface JobBrief {
    id: string;
    title: string;
    company: string;
    location: string;
}

export function jobDigestEmail(
    name: string,
    jobs: JobBrief[]
): { subject: string; html: string; text: string } {
    const count = jobs.length;
    const subject =
        count === 1
            ? `New job on CONNEKT: ${jobs[0].title}`
            : `${count} new jobs on CONNEKT today`;

    const rows = jobs
        .map(
            (j) => `
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
        <a href="${APP_URL}/jobs/${j.id}" style="color:#0f766e;font-weight:600;text-decoration:none;font-size:14px">${escapeHtml(j.title)}</a>
        <div style="color:#6b7280;font-size:12px;margin-top:2px">${escapeHtml(j.company)} · ${escapeHtml(j.location)}</div>
      </td></tr>`
        )
        .join('');

    const greeting = count === 1 ? 'here is a new opening' : `here are ${count} new openings`;
    const html = shell(
        `Hi ${escapeHtml(name || 'there')} — ${greeting}`,
        `<table style="width:100%;border-collapse:collapse">${rows}</table>
         <a href="${APP_URL}/jobs" style="display:inline-block;margin-top:20px;background:#0d9488;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-size:14px;font-weight:600">See every opening</a>`
    );

    const text = [
        `Hi ${name || 'there'},`,
        '',
        ...jobs.map((j) => `- ${j.title} — ${j.company} (${j.location})\n  ${APP_URL}/jobs/${j.id}`),
        '',
        `All openings: ${APP_URL}/jobs`,
    ].join('\n');

    return { subject, html, text };
}

export function jobDigestWhatsApp(name: string, jobs: JobBrief[]): string {
    const head =
        jobs.length === 1
            ? `Hi ${name || 'there'} — a new opening just landed on CONNEKT:`
            : `Hi ${name || 'there'} — ${jobs.length} new openings just landed on CONNEKT:`;
    const list = jobs
        .slice(0, 5)
        .map((j) => `• ${j.title} — ${j.company}\n${APP_URL}/jobs/${j.id}`)
        .join('\n\n');
    const more = jobs.length > 5 ? `\n\n…and ${jobs.length - 5} more: ${APP_URL}/jobs` : '';
    return `${head}\n\n${list}${more}`;
}

/** Sent once, right after someone gives us their WhatsApp number. */
export function welcomeWhatsApp(name: string): string {
    return (
        `Hi ${name || 'there'}, this is CONNEKT. ` +
        `You are now set up for job updates on WhatsApp — new openings that match ` +
        `what you are looking for, and changes to jobs you have applied to. ` +
        `Reply STOP at any time to turn these off.`
    );
}
