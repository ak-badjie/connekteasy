"use client";

import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";
import app from "./firebase";
import type { Education, UserProfile } from "./types";
import { SKILLS_LIST } from "./skills";

/**
 * Read a CV and fill in the profile from it.
 *
 * Runs on Gemini 2.5 Flash through Firebase AI Logic, so the call is
 * authenticated by the Firebase app rather than by a key we would have to ship
 * to the browser. Flash is the right size here: a CV is a page or two, the
 * answer is a fixed set of fields, and members should not wait.
 *
 * The result is only ever a *suggestion*. Nothing is saved until the member has
 * seen the fields and pressed save — parsers misread names, dates and job
 * titles, and a profile is the member's own account of themselves.
 */

/** Gemini reads these directly. Word documents have to be exported first. */
export const CV_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.txt";
export const CV_MAX_MB = 8;

const SUPPORTED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
];

export interface ParsedCv {
  firstName: string;
  lastName: string;
  title: string;
  bio: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  website: string;
  yearsOfExperience: number;
  skills: string[];
  education: Education[];
}

const cvSchema = Schema.object({
  properties: {
    firstName: Schema.string({ description: "Given name only." }),
    lastName: Schema.string({ description: "Family name only." }),
    title: Schema.string({
      description:
        "Their current or most recent professional title, e.g. 'Virtual Assistant' or 'Monitoring & Evaluation Officer'. Empty string if the CV does not state one.",
    }),
    bio: Schema.string({
      description:
        "A 2-3 sentence professional summary written in the first person, drawn only from what the CV actually says.",
    }),
    location: Schema.string({ description: "City and country, e.g. 'Serrekunda, The Gambia'." }),
    phone: Schema.string({ description: "Phone number exactly as printed on the CV." }),
    email: Schema.string({ description: "Email address as printed on the CV." }),
    linkedin: Schema.string({ description: "Full LinkedIn profile URL, or empty string." }),
    website: Schema.string({ description: "Personal site or portfolio URL, or empty string." }),
    yearsOfExperience: Schema.number({
      description: "Total years of professional experience. 0 if it cannot be worked out.",
    }),
    skills: Schema.array({
      items: Schema.string(),
      description: "Up to 15 skills.",
    }),
    education: Schema.array({
      items: Schema.object({
        properties: {
          school: Schema.string(),
          degree: Schema.string({ description: "e.g. BSc, Diploma, Certificate." }),
          field: Schema.string({ description: "Field of study." }),
          startYear: Schema.string({ description: "Four-digit year, or empty string." }),
          endYear: Schema.string({ description: "Four-digit year, 'Present', or empty string." }),
        },
      }),
    }),
  },
});

const PROMPT = `You are reading a job applicant's CV or résumé for CONNEKT, a job platform in The Gambia.

Extract the applicant's details into the given JSON schema.

Rules:
- Only use what the document actually says. Never invent an employer, a
  qualification, a date or a skill. If a field is not in the document, return
  an empty string, 0, or an empty array.
- Write the bio in the first person ("I am a...") and keep it to 2-3 sentences.
- For skills, prefer these exact terms wherever the CV supports them, so they
  match the platform's own vocabulary: ${SKILLS_LIST.join(", ")}.
  If the CV clearly shows a skill that is not on that list, use the CV's own
  wording for it.
- Keep phone numbers exactly as written, including the country code.`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const result = String(reader.result || "");
      // "data:application/pdf;base64,JVBERi0..." — Gemini wants the tail only.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

export class CvParseError extends Error {}

/** Read a CV file and return the fields it contains. Nothing is saved. */
export async function parseCv(file: File): Promise<ParsedCv> {
  if (file.size > CV_MAX_MB * 1024 * 1024) {
    throw new CvParseError(`That file is larger than ${CV_MAX_MB}MB. Please upload a smaller one.`);
  }
  const mimeType = file.type || "application/pdf";
  if (!SUPPORTED_MIME.includes(mimeType)) {
    throw new CvParseError(
      "Please upload a PDF, an image of your CV, or a plain text file. Word documents can be saved as PDF first."
    );
  }

  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: cvSchema,
      temperature: 0,
    },
  });

  let text: string;
  try {
    const result = await model.generateContent([
      { inlineData: { mimeType, data: await fileToBase64(file) } },
      { text: PROMPT },
    ]);
    text = result.response.text();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    // The most common cause by far is AI Logic not being switched on for the
    // project yet, and the raw SDK error does not say so.
    if (/api|permission|denied|not enabled|403/i.test(message)) {
      throw new CvParseError(
        "The CV reader is not available right now. Please fill your profile in by hand — we will have this back shortly."
      );
    }
    throw new CvParseError("We could not read that CV. Please try another file, or fill your profile in by hand.");
  }

  let raw: Partial<ParsedCv>;
  try {
    raw = JSON.parse(text) as Partial<ParsedCv>;
  } catch {
    throw new CvParseError("We could not make sense of that CV. Please try another file.");
  }

  return normalise(raw);
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function normalise(raw: Partial<ParsedCv>): ParsedCv {
  const skills = Array.isArray(raw.skills)
    ? [...new Set(raw.skills.map(str).filter((s) => s.length > 1 && s.length < 40))].slice(0, 15)
    : [];

  const education: Education[] = Array.isArray(raw.education)
    ? raw.education
        .map((e) => ({
          school: str(e?.school),
          degree: str(e?.degree),
          field: str(e?.field),
          startYear: str(e?.startYear),
          endYear: str(e?.endYear),
        }))
        .filter((e) => e.school || e.degree)
        .slice(0, 6)
    : [];

  const years = Number(raw.yearsOfExperience);

  return {
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    title: str(raw.title).slice(0, 120),
    bio: str(raw.bio).slice(0, 1000),
    location: str(raw.location).slice(0, 120),
    phone: str(raw.phone).slice(0, 40),
    email: str(raw.email).slice(0, 160),
    linkedin: str(raw.linkedin).slice(0, 300),
    website: str(raw.website).slice(0, 300),
    yearsOfExperience: Number.isFinite(years) && years >= 0 && years < 70 ? Math.round(years) : 0,
    skills,
    education,
  };
}

/**
 * Merge a parse into a profile, keeping anything the member has already
 * written. The CV fills the blanks; it never overwrites their own words.
 */
export function mergeIntoProfile(
  parsed: ParsedCv,
  profile: Partial<UserProfile> | null | undefined
): Partial<UserProfile> {
  const keep = (existing: unknown, incoming: string) =>
    typeof existing === "string" && existing.trim() ? existing : incoming;

  const existingSkills = profile?.skills || [];
  const mergedSkills = [...new Set([...existingSkills, ...parsed.skills])].slice(0, 20);

  return {
    firstName: keep(profile?.firstName, parsed.firstName),
    lastName: keep(profile?.lastName, parsed.lastName),
    title: keep(profile?.title, parsed.title),
    bio: keep(profile?.bio, parsed.bio),
    location: keep(profile?.location, parsed.location),
    phone: keep(profile?.phone, parsed.phone),
    linkedin: keep(profile?.linkedin, parsed.linkedin),
    website: keep(profile?.website, parsed.website),
    skills: mergedSkills,
    education: profile?.education?.length ? profile.education : parsed.education,
    yearsOfExperience: profile?.yearsOfExperience || parsed.yearsOfExperience,
  };
}
