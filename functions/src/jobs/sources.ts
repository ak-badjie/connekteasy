/**
 * Where the job board's imported listings come from.
 *
 * A TypeScript port of functions/scripts/fetch-gambia-jobs.js, so the daily
 * Cloud Function and the one-off CLI seed run the same collection logic. Every
 * source returns `ScrapedJob` records already normalised into the shape of the
 * app's `jobs` collection (app/lib/types.ts → Job).
 *
 * Sources, ordered by how relevant they are to someone sitting in Banjul:
 *   tier 1 — vacancies advertised inside The Gambia
 *              Gamjobs, Public Service Commission, UNcareer, UNjobs,
 *              TheGambiaJobs
 *   tier 2 — remote roles open to Africa / EMEA (so, to Gambians)
 *              Jobicy, some of Himalayas
 *   tier 3 — worldwide-remote roles
 *              Himalayas, We Work Remotely, Remote OK
 *
 * Every record keeps sourceUrl/applyUrl so applicants can always get back to
 * the original advert — several of these boards require that attribution, and
 * it is the only honest way to publish someone else's vacancy.
 */
import { SKILL_VOCAB } from './skills';

export type Tier = 1 | 2 | 3;

export interface ScrapedJob {
    title: string;
    company: string;
    description: string;
    location: string;
    employmentType: string;
    salary: string;
    category: string;
    skills: string[];
    sourceName: string;
    sourceUrl: string;
    applyUrl: string;
    postedAt: number | null;
    closingAt: number | null;
    tier: Tier;
}

const UA =
    'connekt-jobboard/1.0 (+https://connekt.gm; aggregating open vacancies for Gambian job seekers)';
// A couple of boards refuse the descriptive agent; they get a browser one.
const BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

const DAY = 24 * 60 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface GetOptions {
    json?: boolean;
    retries?: number;
    browser?: boolean;
}

async function get(url: string, options: GetOptions & { json: true }): Promise<any>;
async function get(url: string, options?: GetOptions): Promise<string | null>;
async function get(url: string, { json = false, retries = 2, browser = false }: GetOptions = {}) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': browser ? BROWSER_UA : UA,
                    Accept: json
                        ? 'application/json'
                        : 'text/html,application/xhtml+xml,application/xml',
                    'Accept-Language': 'en',
                },
                signal: AbortSignal.timeout(45000),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return json ? await res.json() : await res.text();
        } catch (err: any) {
            if (attempt === retries) {
                console.warn(`  ! ${url} → ${err?.message || err}`);
                return null;
            }
            await sleep(1200 * (attempt + 1));
        }
    }
    return null;
}

/** Does `url` still resolve? Used to spot listings that were taken down. */
export async function stillLive(url: string): Promise<boolean | null> {
    for (const method of ['HEAD', 'GET'] as const) {
        try {
            const res = await fetch(url, {
                method,
                headers: { 'User-Agent': BROWSER_UA },
                redirect: 'follow',
                signal: AbortSignal.timeout(20000),
            });
            // 404/410 is a delisted advert. 405 means HEAD is unsupported, so
            // retry with GET. Anything else (403, 429, 5xx) is the board being
            // difficult, not evidence the job is gone.
            if (res.status === 404 || res.status === 410) return false;
            if (res.status === 405) continue;
            if (res.ok) return true;
            return null;
        } catch {
            return null;
        }
    }
    return null;
}

async function mapLimit<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R | null>
): Promise<R[]> {
    const out: (R | null)[] = [];
    let i = 0;
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (i < items.length) {
                const idx = i++;
                out[idx] = await fn(items[idx], idx);
            }
        })
    );
    return out.filter((v): v is R => !!v);
}

// ─── Text helpers ──────────────────────────────────────────
const ENTITIES: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–',
    mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
    hellip: '…', eacute: 'é', agrave: 'à', middot: '·', bull: '•', times: '×', deg: '°',
};

function decode(s = ''): string {
    // Boards re-encode their own feeds, so "&amp;#038;" is common: decode until
    // the string stops changing rather than making a single pass.
    let out = s;
    for (let i = 0; i < 3; i++) {
        const next = out
            .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
            .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
            .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[String(name).toLowerCase()] ?? m);
        if (next === out) break;
        out = next;
    }
    return out;
}

/**
 * A remote role only counts if a person sitting in The Gambia may hold it.
 * "Remote — EMEA" or "Anywhere" qualify; "Remote — Germany" does not, however
 * remote it is.
 */
const OPEN_TO_GAMBIANS = /\b(worldwide|anywhere|global|emea|africa|gambia)\b/i;

export function openToGambians(scope = ''): boolean {
    // "South Africa" is a country a Gambian cannot work in remotely; the word
    // "Africa" inside it must not be read as the continent. (West/North Africa
    // do include The Gambia, so only this one is stripped.)
    return OPEN_TO_GAMBIANS.test(scope.toLowerCase().replace(/south\s+africa/g, ''));
}

function stripTags(html = ''): string {
    return decode(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
    );
}

const NOISE = [
    /^(share|apply now|apply|apply for (this )?job|related jobs?|similar jobs?|recommended for you|advertise|donate|close|previous|next|home|back)$/i,
    /𝗗𝗶𝘀𝗰𝗼𝘃𝗲𝗿|𝐂𝐡𝐚𝐧𝐠𝐞|Recruitment Guide|uncareer\.net|Donate \d+ USD/i,
    /^(facebook|twitter|linkedin|whatsapp|telegram|email|print)$/i,
];

function lines(text = ''): string[] {
    return text
        .split('\n')
        .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
        .filter(Boolean)
        .filter((l) => l.length > 1 && !NOISE.some((re) => re.test(l)));
}

function tidy(text = '', maxChars = 4000): string {
    const seen = new Set<string>();
    const unique = lines(text).filter((l) => {
        const k = l.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
    let out = unique.join('\n\n');
    if (out.length > maxChars) out = `${out.slice(0, maxChars).trimEnd()}…`;
    return out.trim();
}

const titleCase = (s = '') => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

// ─── Schema mapping ────────────────────────────────────────
// Titles decide the category; the advert body is only a tie-breaker.
const CATEGORY_RULES: [RegExp, string][] = [
    [/virtual assistant|executive assistant|personal assistant/i, 'Virtual Assistance'],
    [/translat|interpret(er|ing)/i, 'Translation'],
    [/transcri/i, 'Transcription'],
    [/customer (support|service|success|experience)|call cent|help ?desk|front desk|receptionist/i, 'Customer Service'],
    [/data entry|data capture|data clerk/i, 'Data Entry'],
    [/social media|community manager|community engagement/i, 'Social Media'],
    [/book ?keep|payroll|cashier/i, 'Bookkeeping'],
    [/account(ant|ing)|financ(e|ial)|audit|treasur|budget|grants? manage|economist/i, 'Accounting & Finance'],
    [/front[- ]?end|back[- ]?end|full[- ]?stack|web develop|wordpress|react|node\.js/i, 'Web Development'],
    [/engineer|developer|software|devops|data scien|machine learning|\bict\b|\bit\b (officer|support|manager)|system(s)? admin|network|cyber|security engineer|technolog/i, 'Software Development'],
    [/graphic|\bux\b|\bui\b|designer|creative director/i, 'Graphic Design'],
    [/video|motion graphic|videograph|film/i, 'Video Editing'],
    [/photograph/i, 'Photography'],
    [/\bseo\b|lead gen/i, 'SEO & Lead Generation'],
    [/market(ing)?|brand|growth|sales|business development|partnership/i, 'Digital Marketing'],
    [/content writ|copywrit|editor|journalis|communications?\b|public relations|media officer/i, 'Content Writing'],
    [/research|monitoring|evaluation|\bm&e\b|analyst|statistic|survey|epidemiolog/i, 'Research'],
    [/human resources?|\bhr\b|recruit|talent acquisition|people (and|&) culture/i, 'HR & Recruiting'],
    [/legal|lawyer|counsel\b|complian|paralegal|attorney/i, 'Legal Support'],
    [/teach|tutor|train(er|ing)|education|lectur|school|curriculum|facilitator|counsell?or/i, 'Tutoring & Education'],
    [/e-?commerce|shopify|merchandis|retail|store manager/i, 'E-commerce Management'],
    [/email (management|marketing)|inbox/i, 'Email Management'],
    [/project|programme|program (manager|officer|assistant|associate)|coordinat|logistic|supply chain|procure|operations?\b/i, 'Project Management'],
    [/admin|office|clerk|secretar|assistant|records/i, 'Admin Support'],
];

function mapCategory(title = '', ...fallback: (string | undefined)[]): string {
    for (const [re, name] of CATEGORY_RULES) if (re.test(title)) return name;
    const hay = fallback.filter(Boolean).join(' ');
    for (const [re, name] of CATEGORY_RULES) if (re.test(hay)) return name;
    return 'Admin Support';
}

function mapEmploymentType(raw = '', title = ''): string {
    const s = `${raw} ${title}`.toLowerCase();
    if (/public relations|\bpr\b (officer|specialist|manager)/.test(s)) return 'pr-opportunity';
    if (/intern(ship)?\b|trainee|graduate (programme|program|scheme)/.test(s)) return 'internship';
    if (/volunteer|\bunv\b|fellowship|scholarship|call for (applications|proposals)/.test(s))
        return 'opportunity';
    if (/part[- ]time/.test(s)) return 'part-time';
    if (/consultan|contract|temporary|short[- ]term|freelance|fixed[- ]term|daily worker/.test(s))
        return 'contract';
    return 'full-time';
}

const GENERIC_WORDS = new Set(
    ('and or the for of in at to a an with senior junior officer assistant manager specialist lead head chief ' +
        'national international based full time part remote job jobs vacancy vacancies new become qualified ' +
        'advertised readvertised re advertised position role grade level project programme program ' +
        'consultant consultancy support services service required wanted urgent apply application').split(' ')
);

function deriveSkills(title = '', description = '', tags: unknown[] = []): string[] {
    const found: string[] = [];
    const hay = `${title}\n${description.slice(0, 1500)}`;
    for (const skill of SKILL_VOCAB) {
        if (found.length >= 6) break;
        const re = new RegExp(
            `(^|[^a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`,
            'i'
        );
        if (re.test(hay)) found.push(skill);
    }

    const cleanTags = (tags.flat() as unknown[])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => titleCase(t.replace(/[-_]/g, ' ').trim()))
        .filter((t) => t.length > 2 && t.length < 28 && !GENERIC_WORDS.has(t.toLowerCase()));

    const fromTitle = title
        .replace(/[^a-zA-Z0-9&+# ]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !GENERIC_WORDS.has(w.toLowerCase()))
        .map((w) => titleCase(w));

    return [...new Set([...found, ...cleanTags, ...fromTitle])].slice(0, 6);
}

/** Tenders, bids and RFQs are not jobs — the board should not carry them. */
function isNotAJob(title = ''): boolean {
    return /request for (quotation|proposal|expression)|\brfq\b|\brfp\b|\breoi\b|\beoi\b|\bitb\b|invitation to (bid|tender)|invitation for bid|expressions? of interest|tender notice|supply,? (and )?delivery|procurement notice|supply of|prequalification|call for (bids|tenders)/i.test(
        title
    );
}

function salaryText({
    min,
    max,
    currency = 'USD',
    period = 'year',
}: { min?: number; max?: number; currency?: string; period?: string } = {}): string {
    const fmt = (n: number) => Number(n).toLocaleString('en-US');
    if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)} / ${period}`;
    if (min) return `From ${currency} ${fmt(min)} / ${period}`;
    if (max) return `Up to ${currency} ${fmt(max)} / ${period}`;
    return 'Unspecified';
}

// ─── Redaction ─────────────────────────────────────────────
// Boards routinely end an advert with "To apply: https://…" or an application
// address. Left in place that hands the apply route to anyone reading the
// public listing, which is exactly what the membership is supposed to buy —
// so the contact details come out of the body, and the real link is served
// from jobLinks/{id} only to members. See firestore.rules.
const URL_RE = /\bhttps?:\/\/[^\s<>"')\]]+/gi;
const BARE_DOMAIN_RE = /\bwww\.[a-z0-9-]+(?:\.[a-z]{2,})+[^\s<>"')\]]*/gi;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/** A line that only ever introduced a link we have just removed. */
const DANGLING_LABEL =
    /^(to apply|how to apply|apply(ing)? (here|at|online|via|through|now)?|application link|apply link|link|url|website|web ?site|email|e-?mail|send (your )?(cv|application|resume)( to)?|more (info|information|details)( at| here)?|source|visit)\s*[:\-–—]?\s*$/i;

export function redactContactDetails(text = ''): string {
    const stripped = text
        .replace(URL_RE, ' ')
        .replace(BARE_DOMAIN_RE, ' ')
        .replace(EMAIL_RE, ' ');

    return stripped
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim())
        // Drop the orphaned "To apply:" heading and any punctuation left behind.
        .filter((line) => line && !DANGLING_LABEL.test(line) && !/^[\s:\-–—.,;()[\]]+$/.test(line))
        .join('\n')
        .trim();
}

interface RawJob {
    title?: string;
    company?: string;
    description?: string;
    location?: string;
    rawType?: string;
    rawCategory?: string;
    salary?: string;
    tags?: unknown[];
    sourceName: string;
    sourceUrl?: string;
    applyUrl?: string;
    postedAt?: number | null;
    closingAt?: number | null;
    tier: Tier;
}

function record(job: RawJob): ScrapedJob | null {
    const title = (job.title || '').replace(/\s+/g, ' ').trim().slice(0, 180);
    if (!title || isNotAJob(title)) return null;
    const description = redactContactDetails(tidy(job.description || '', 4000));
    if (description.length < 60) return null;
    const sourceUrl = (job.sourceUrl || '').trim();
    if (!sourceUrl) return null;

    return {
        title,
        company: (job.company || '').replace(/\s+/g, ' ').trim() || job.sourceName || 'Confidential',
        description,
        location: job.location || 'The Gambia',
        employmentType: mapEmploymentType(job.rawType, title),
        salary: job.salary || 'Unspecified',
        category: mapCategory(title, job.rawCategory, description.slice(0, 500)),
        skills: deriveSkills(title, description, [job.tags || []]),
        sourceName: job.sourceName,
        sourceUrl,
        applyUrl: (job.applyUrl || sourceUrl).trim(),
        postedAt: job.postedAt ?? null,
        closingAt: job.closingAt ?? null,
        tier: job.tier,
    };
}

const parseDate = (s?: string | null): number | null => {
    if (!s) return null;
    const t = Date.parse(`${String(s).replace(/(\d+)(st|nd|rd|th)/i, '$1')} UTC`);
    return Number.isNaN(t) ? null : t;
};

// ═══════════════════════════════════════════════════════════
// 1. Gamjobs.com — vacancies advertised inside The Gambia
// ═══════════════════════════════════════════════════════════
const GAMJOBS_META = [
    /^\d[\d,]* views?$/i,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^-\s*\d{2}\/\d{2}\/\d{4}$/,
    /^(full|part) time$/i,
    /^(contract|temporary|internship|freelance|volunteer|permanent)$/i,
    /^the gambia$/i,
    /^[A-Z][A-Za-z&' ]+( - [A-Z][A-Za-z&' ]+)+$/,
];

async function fromGamjobs(now: number): Promise<ScrapedJob[]> {
    const sitemap = await get('https://gamjobs.com/wp-sitemap-posts-noo_job-1.xml');
    if (!sitemap) return [];
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    console.log(`  ${urls.length} listings in sitemap`);

    return mapLimit(urls, 4, async (url) => {
        const html = await get(url);
        if (!html) return null;
        await sleep(150);

        const title = decode((html.match(/<h1 class="page-title"[^>]*>\s*([^<]+)/) || [])[1] || '').trim();
        const company = decode(
            (html.match(/class="job-company"[\s\S]{0,300}?<span[^>]*>([^<]+)<\/span>/) || [])[1] || ''
        ).trim();
        const locBlock = (html.match(/class="job-location"([\s\S]{0,400}?)<\/span>/) || [])[1] || '';
        const locParts = [...locBlock.matchAll(/<em>([^<]+)<\/em>/g)].map((m) => decode(m[1]).trim());
        const rawType = decode(
            (html.match(/class="job-type"[\s\S]{0,300}?<span>([^<]+)<\/span>/) || [])[1] || ''
        ).trim();
        const rawCategory = decode(
            (html.match(/class="job-category"[\s\S]{0,400}?<a[^>]*>\s*([^<]+)</) || [])[1] || ''
        ).trim();

        const dmy = (s?: string): number | null => {
            if (!s) return null;
            const [d, m, y] = s.split('/').map(Number);
            return d && m && y ? Date.UTC(y, m - 1, d, 23, 59) : null;
        };
        const postedAt = dmy((html.match(/class="job-date__posted"[^>]*>\s*([\d/]+)/) || [])[1]);
        const closingAt = dmy((html.match(/class="job-date__closing"[^>]*>\s*-?\s*([\d/]+)/) || [])[1]);
        // Only keep vacancies that are still accepting applications.
        if (closingAt && closingAt < now) return null;

        const bodyStart = html.indexOf('class="job-details');
        let bodyEnd = html.length;
        for (const marker of ['Related Jobs', 'Apply for job', 'id="comments"', '<footer']) {
            const i = html.indexOf(marker, bodyStart + 1);
            if (i > 0 && i < bodyEnd) bodyEnd = i;
        }
        // Drop the heading + meta strip that opens the panel, keeping the advert.
        const raw = lines(stripTags(html.slice(html.indexOf('>', bodyStart) + 1, bodyEnd)));
        let cut = 0;
        raw.slice(0, 14).forEach((line, idx) => {
            if (line === title || line.startsWith(title) || GAMJOBS_META.some((re) => re.test(line))) {
                cut = idx + 1;
            }
        });

        return record({
            title,
            company,
            description: raw.slice(cut).join('\n'),
            location: locParts.length ? locParts.join(', ') : 'The Gambia',
            rawType,
            rawCategory,
            sourceName: 'Gamjobs',
            sourceUrl: url,
            postedAt,
            closingAt,
            tier: 1,
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 2. Public Service Commission — Gambian civil service vacancies
// ═══════════════════════════════════════════════════════════
async function fromPsc(now: number): Promise<ScrapedJob[]> {
    const html = await get('https://pscgov.gm/vacancies-1/');
    if (!html) return [];
    const out: ScrapedJob[] = [];
    const blocks = [
        ...html.matchAll(
            /class="ekit-accordion-title">([^<]+)<\/span>([\s\S]*?)(?=class="ekit-accordion-title">|<footer)/g
        ),
    ];
    for (const [, rawTitle, body] of blocks) {
        const title = decode(rawTitle).replace(/\s+/g, ' ').trim();
        const text = tidy(stripTags(body), 4000);
        const closing = (text.match(/no later than\s+([0-9]{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})/i) || [])[1];
        const closingAt = parseDate(closing);
        if (closingAt && closingAt + DAY < now) continue;
        const salary = (text.match(/D[\d,]{4,}/) || [])[0];

        const rec = record({
            title: title.replace(/\s*\(Ministry[^)]*\)\s*/i, ' ').replace(/\s+/g, ' ').trim(),
            company: (title.match(/\(([^)]*Ministry[^)]*)\)/i) || [])[1] || 'Government of The Gambia',
            description: text,
            location: 'Banjul, The Gambia',
            rawType: title,
            sourceName: 'Public Service Commission',
            sourceUrl: 'https://pscgov.gm/vacancies-1/',
            applyUrl: 'https://portal.pscgov.gm/',
            salary: salary ? `${salary} (Government Integrated Pay Scale)` : 'Unspecified',
            closingAt,
            tier: 1,
        });
        if (rec) out.push(rec);
    }
    console.log(`  ${out.length} civil service vacancies`);
    return out;
}

// ═══════════════════════════════════════════════════════════
// 3a. UNcareer.net — UN & NGO vacancies with a Gambian duty station
// ═══════════════════════════════════════════════════════════
async function fromUncareer(now: number, maxPages = 8): Promise<ScrapedJob[]> {
    const links = new Map<string, string>();
    for (let page = 1; page <= maxPages; page++) {
        const url =
            page === 1
                ? 'https://uncareer.net/country/Gambia'
                : `https://uncareer.net/country/Gambia?page=${page}`;
        const html = await get(url);
        if (!html) continue;
        for (const m of html.matchAll(/<a href="(\/vacancy\/[^"]+)"[^>]*>([^<]{6,200})<\/a>/g)) {
            links.set(`https://uncareer.net${m[1]}`, decode(m[2]).trim());
        }
        await sleep(400);
    }
    console.log(`  ${links.size} Gambia vacancies listed`);

    return mapLimit([...links.entries()], 4, async ([url, listTitle]) => {
        const html = await get(url);
        if (!html) return null;
        await sleep(150);

        const applyIdx = html.indexOf('Apply for this job');
        const text = stripTags(html.slice(0, applyIdx > 0 ? applyIdx : html.length));
        const flat = lines(text);

        const org = decode((html.match(/organization\/([^"]+)"/) || [])[1] || '')
            .replace(/\+/g, ' ')
            .trim();
        const deadlineLine = flat.find((l) => /^Deadline:/i.test(l)) || '';
        const nextAfterDeadline = flat[flat.indexOf(deadlineLine) + 1] || '';
        const closingAt =
            parseDate(deadlineLine.replace(/^Deadline:\s*/i, '')) || parseDate(nextAfterDeadline);
        if (closingAt && closingAt + DAY < now) return null;

        const addedLine = flat.find((l) => /^Added( Date)?:/i.test(l)) || '';
        const postedAt =
            parseDate(addedLine.replace(/^Added( Date)?:\s*/i, '')) ||
            parseDate(flat[flat.indexOf(addedLine) + 1] || '');
        if (!closingAt && postedAt && now - postedAt > 60 * DAY) return null;

        const start = text.search(
            /Mission and objectives|General Information|Task Description|Background|Job Description/i
        );
        const body = start > 0 ? text.slice(start) : flat.slice(6).join('\n');

        return record({
            title: listTitle.replace(/,\s*BANJUL\s*$/i, '').trim(),
            company: org || 'United Nations',
            description: body,
            location: /banjul/i.test(listTitle) ? 'Banjul, The Gambia' : 'The Gambia',
            rawType: listTitle,
            sourceName: 'UNcareer',
            sourceUrl: url,
            postedAt,
            closingAt,
            tier: 1,
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 3b. UNjobs.org — second UN feed for the Gambia duty station
// ═══════════════════════════════════════════════════════════
async function fromUnjobs(now: number): Promise<ScrapedJob[]> {
    const html = await get('https://unjobs.org/duty_stations/gambia', { browser: true });
    if (!html) return [];
    const links = new Map<string, string>();
    for (const m of html.matchAll(
        /<a[^>]*href="(https:\/\/unjobs\.org\/vacancies\/[^"]+)"[^>]*>([\s\S]{6,200}?)<\/a>/g
    )) {
        links.set(m[1], decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim());
    }
    console.log(`  ${links.size} Gambia vacancies listed`);

    return mapLimit([...links.entries()], 3, async ([url, title]) => {
        const page = await get(url, { browser: true });
        if (!page) return null;
        await sleep(250);
        const text = stripTags(page);
        const flat = lines(text);
        const org = (
            flat.find((l) => /^(UN|United Nations|WFP|UNICEF|UNDP|WHO|FAO|IOM|UNFPA|UNHCR)/.test(l)) || ''
        ).slice(0, 80);
        const closingAt = parseDate(
            (text.match(
                /Closing date:?\s*([0-9]{1,2}\s+\w+\s+\d{4}|\w+\s+[0-9]{1,2},?\s+\d{4})/i
            ) || [])[1]
        );
        if (closingAt && closingAt + DAY < now) return null;

        const start = text.search(
            /Background|Job Description|Duties|Responsibilities|Organizational Setting/i
        );
        return record({
            title,
            company: org || 'United Nations',
            description: start > 0 ? text.slice(start) : flat.slice(4).join('\n'),
            location: 'The Gambia',
            rawType: title,
            sourceName: 'UNjobs',
            sourceUrl: url,
            closingAt,
            tier: 1,
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 3c. TheGambiaJobs.com — local board, publishes JobPosting structured data
// ═══════════════════════════════════════════════════════════
async function fromTheGambiaJobs(now: number): Promise<ScrapedJob[]> {
    const index = await get('https://www.thegambiajobs.com/jobs', { browser: true });
    if (!index) return [];
    const slugs = [
        ...new Set([...index.matchAll(/href="\/jobs\/([a-z0-9][a-z0-9-]{8,})"/g)].map((m) => m[1])),
    ].filter((s) => !/(playwright|test-job|-demo-|sample)/i.test(s));
    console.log(`  ${slugs.length} listings`);

    return mapLimit(slugs, 3, async (slug) => {
        const url = `https://www.thegambiajobs.com/jobs/${slug}`;
        const html = await get(url, { browser: true });
        if (!html) return null;
        await sleep(200);

        let posting: any = null;
        for (const m of html.matchAll(
            /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
        )) {
            try {
                const parsed = JSON.parse(m[1]);
                const node = Array.isArray(parsed)
                    ? parsed.find((p: any) => p['@type'] === 'JobPosting')
                    : parsed;
                if (node?.['@type'] === 'JobPosting') posting = node;
            } catch {
                /* not the block we want */
            }
        }
        if (!posting) return null;

        const closingAt = posting.validThrough ? Date.parse(posting.validThrough) : null;
        if (closingAt && closingAt < now) return null;

        const address = posting.jobLocation?.address || posting.jobLocation?.[0]?.address || {};
        const locality = [address.addressLocality, address.addressRegion]
            .filter((v: string, i: number, arr: string[]) => v && arr.indexOf(v) === i)
            .join(', ');
        const sal = posting.baseSalary?.value || {};
        const salary =
            sal.minValue || sal.maxValue
                ? salaryText({
                      min: sal.minValue,
                      max: sal.maxValue,
                      currency: posting.baseSalary?.currency || 'GMD',
                      period: String(sal.unitText || 'MONTH').toLowerCase(),
                  })
                : 'Unspecified';

        return record({
            title: posting.title,
            company: posting.hiringOrganization?.name,
            description: stripTags(posting.description || ''),
            location: locality || 'The Gambia',
            rawType: String(posting.employmentType || '').replace(/_/g, ' '),
            rawCategory: posting.occupationalCategory || posting.industry,
            salary,
            sourceName: 'The Gambia Jobs',
            sourceUrl: url,
            applyUrl: posting.applicationContact?.url || url,
            postedAt: posting.datePosted ? Date.parse(posting.datePosted) : null,
            closingAt,
            tier: 1,
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 4. Jobicy — remote roles open to EMEA (the region Gambia sits in)
// ═══════════════════════════════════════════════════════════
const JOBICY_INDUSTRIES = [
    'admin-support', 'business', 'copywriting', 'design-multimedia', 'supporting',
    'data-science', 'education', 'accounting-finance', 'hr', 'marketing', 'management',
    'project-management', 'seller', 'seo', 'engineering', 'technical-support',
];

async function fromJobicy(now: number): Promise<ScrapedJob[]> {
    const out: ScrapedJob[] = [];
    // The EMEA feed plus the unrestricted feed per industry — the latter is
    // where the "Anywhere" listings live. Every job is still gated on whether a
    // Gambian may hold it.
    const queries = [
        'https://jobicy.com/api/v2/remote-jobs?count=50&geo=emea',
        ...JOBICY_INDUSTRIES.map(
            (i) => `https://jobicy.com/api/v2/remote-jobs?count=50&geo=emea&industry=${i}`
        ),
        ...JOBICY_INDUSTRIES.map((i) => `https://jobicy.com/api/v2/remote-jobs?count=50&industry=${i}`),
    ];
    for (const url of queries) {
        const data = await get(url, { json: true });
        for (const j of data?.jobs || []) {
            // Already ISO with an offset ("2026-08-06T07:15:04+00:00").
            const postedAt = j.pubDate ? Date.parse(String(j.pubDate).trim()) || null : null;
            if (postedAt && now - postedAt > 60 * DAY) continue;
            // The EMEA query also returns single-country roles (Germany, UK…).
            if (!openToGambians(j.jobGeo || '')) continue;
            const rec = record({
                title: j.jobTitle,
                company: j.companyName,
                description: stripTags(j.jobDescription || j.jobExcerpt || ''),
                location: `Remote — ${String(j.jobGeo || 'EMEA').replace(/\s+/g, ' ')}`,
                rawType: (j.jobType || []).join(' '),
                rawCategory: (j.jobIndustry || []).join(' '),
                tags: j.jobIndustry || [],
                salary: salaryText({
                    min: j.annualSalaryMin,
                    max: j.annualSalaryMax,
                    currency: j.salaryCurrency || 'USD',
                }),
                sourceName: 'Jobicy',
                sourceUrl: j.url,
                postedAt,
                tier: 2,
            });
            if (rec) out.push(rec);
        }
        await sleep(500);
    }
    console.log(`  ${out.length} EMEA-eligible remote roles`);
    return out;
}

// ═══════════════════════════════════════════════════════════
// 5. Himalayas — remote roles with worldwide / Africa eligibility
// ═══════════════════════════════════════════════════════════
async function fromHimalayas(now: number, pages = 40): Promise<ScrapedJob[]> {
    const out: ScrapedJob[] = [];
    for (let p = 0; p < pages; p++) {
        const data = await get(`https://himalayas.app/jobs/api?limit=100&offset=${p * 100}`, {
            json: true,
        });
        if (!data?.jobs?.length) break;
        for (const j of data.jobs) {
            const restrictions: string[] = j.locationRestrictions || [];
            if (restrictions.length && !restrictions.some((r) => OPEN_TO_GAMBIANS.test(r))) continue;
            if (j.expiryDate && j.expiryDate * 1000 < now) continue;
            const postedAt = j.pubDate ? j.pubDate * 1000 : null;
            if (postedAt && now - postedAt > 45 * DAY) continue;

            const rec = record({
                title: j.title,
                company: j.companyName,
                description: stripTags(j.description || j.excerpt || ''),
                location: restrictions.length
                    ? `Remote — ${restrictions.join(', ')}`
                    : 'Remote — Worldwide',
                rawType: j.employmentType,
                rawCategory: (j.parentCategories || j.categories || []).join(' '),
                tags: (j.parentCategories || []).slice(0, 4),
                salary: salaryText({
                    min: j.minSalary,
                    max: j.maxSalary,
                    currency: j.currency || 'USD',
                    period: j.salaryPeriod || 'year',
                }),
                sourceName: 'Himalayas',
                sourceUrl: j.applicationLink || j.guid,
                postedAt,
                closingAt: j.expiryDate ? j.expiryDate * 1000 : null,
                tier: restrictions.some((r) => /africa|gambia|emea/i.test(r)) ? 2 : 3,
            });
            if (rec) out.push(rec);
        }
        await sleep(400);
    }
    console.log(`  ${out.length} worldwide/Africa-eligible roles`);
    return out;
}

// ═══════════════════════════════════════════════════════════
// 6. We Work Remotely — "Anywhere in the World" listings
// ═══════════════════════════════════════════════════════════
async function fromWeWorkRemotely(now: number): Promise<ScrapedJob[]> {
    const xml = await get('https://weworkremotely.com/remote-jobs.rss');
    if (!xml) return [];
    const out: ScrapedJob[] = [];
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const item = m[1];
        const pick = (tag: string) =>
            decode(
                (item.match(
                    new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)
                ) || [])[1] || ''
            ).trim();
        const region = pick('region');
        if (region && !/anywhere in the world|worldwide|africa|emea/i.test(region)) continue;
        const rawTitle = pick('title');
        const [company, ...rest] = rawTitle.split(':');
        const title = rest.join(':').trim() || rawTitle;
        const pubDate = Date.parse(pick('pubDate')) || null;
        if (pubDate && now - pubDate > 45 * DAY) continue;

        const rec = record({
            title,
            company: rest.length ? company.trim() : '',
            description: stripTags(pick('description')),
            location: `Remote — ${region || 'Anywhere in the World'}`,
            rawType: pick('type'),
            rawCategory: pick('category'),
            sourceName: 'We Work Remotely',
            sourceUrl: pick('link'),
            postedAt: pubDate,
            tier: 3,
        });
        if (rec) out.push(rec);
    }
    console.log(`  ${out.length} worldwide listings`);
    return out;
}

// ═══════════════════════════════════════════════════════════
// 7. Remote OK — worldwide-remote listings (attribution required)
// ═══════════════════════════════════════════════════════════
async function fromRemoteOk(now: number): Promise<ScrapedJob[]> {
    const data = await get('https://remoteok.com/api', { json: true });
    if (!Array.isArray(data)) return [];
    const out: ScrapedJob[] = [];
    for (const j of data.slice(1)) {
        const loc = String(j.location || '').trim();
        if (loc && !/worldwide|anywhere|remote|africa|emea|global/i.test(loc)) continue;
        const postedAt = j.epoch ? j.epoch * 1000 : Date.parse(j.date) || null;
        if (postedAt && now - postedAt > 45 * DAY) continue;

        const rec = record({
            title: j.position,
            company: j.company,
            description: stripTags(j.description || ''),
            location: `Remote — ${loc || 'Worldwide'}`,
            rawType: (j.tags || []).join(' '),
            rawCategory: (j.tags || []).join(' '),
            tags: (j.tags || []).slice(0, 4),
            salary: salaryText({ min: j.salary_min, max: j.salary_max, currency: 'USD' }),
            sourceName: 'Remote OK',
            sourceUrl: j.url,
            applyUrl: j.apply_url || j.url,
            postedAt,
            tier: 3,
        });
        if (rec) out.push(rec);
    }
    console.log(`  ${out.length} worldwide listings`);
    return out;
}

export interface CollectResult {
    jobs: ScrapedJob[];
    bySource: Record<string, number>;
    failures: string[];
}

/**
 * Run every source and return the eligible, de-duplicated set. Sources that
 * throw are recorded and skipped: one board going down must not cost us the
 * whole day's sync.
 */
export async function collectJobs(now = Date.now()): Promise<CollectResult> {
    const sources: [string, (now: number) => Promise<ScrapedJob[]>][] = [
        ['Gamjobs', fromGamjobs],
        ['Public Service Commission', fromPsc],
        ['UNcareer', (n) => fromUncareer(n)],
        ['UNjobs', fromUnjobs],
        ['The Gambia Jobs', fromTheGambiaJobs],
        ['Jobicy', fromJobicy],
        ['Himalayas', (n) => fromHimalayas(n)],
        ['We Work Remotely', fromWeWorkRemotely],
        ['Remote OK', fromRemoteOk],
    ];

    const collected: ScrapedJob[] = [];
    const failures: string[] = [];

    for (const [name, fn] of sources) {
        console.log(`▶ ${name}`);
        try {
            const rows = await fn(now);
            console.log(`  → ${rows.length} usable records`);
            collected.push(...rows);
        } catch (err: any) {
            console.warn(`  ! ${name} failed: ${err?.message || err}`);
            failures.push(`${name}: ${err?.message || err}`);
        }
    }

    // Last gate: a listing either sits in The Gambia, or is remote work that
    // someone in The Gambia is actually eligible for. Nothing else ships.
    const eligible = collected.filter((j) => j.tier === 1 || openToGambians(j.location));

    // Dedupe on title+company, keeping the most Gambia-relevant copy.
    eligible.sort((a, b) => a.tier - b.tier || (b.postedAt || 0) - (a.postedAt || 0));
    const seen = new Set<string>();
    const jobs = eligible.filter((j) => {
        const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const bySource: Record<string, number> = {};
    jobs.forEach((j) => {
        bySource[j.sourceName] = (bySource[j.sourceName] || 0) + 1;
    });

    return { jobs, bySource, failures };
}
