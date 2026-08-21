import { Timestamp } from "firebase/firestore";

// ─── User Profile ──────────────────────────────────────────
export type UserRole = "client" | "va" | "student" | "job_seeker";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  title: string;
  bio: string;
  skills: string[];
  hourlyRate: number;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  certificates: UploadedFile[];
  portfolioImages: UploadedFile[];
  introVideoUrl: string;
  website: string;
  linkedin: string;
  location: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  onboardingComplete: boolean;

  education: Education[];
  portfolioProjects: PortfolioProject[];
  rating: number;
  reviewCount: number;

  // Dashboard extras (all optional — populated as the user engages)
  savedJobs?: string[];
  profileViews?: number;
  courseProgress?: Record<string, number>;
  isAdmin?: boolean;
  /**
   * Super admins are admins who can also grant and revoke admin rights. The
   * flag is stamped onto the profile by a Cloud Function from the server-side
   * allowlist, so it can never be self-granted.
   */
  isSuperAdmin?: boolean;

  // ─── Notification channels ───────────────────────────────────
  // Job alerts go out over WhatsApp and email. Both are opt-in and only ever
  // carry work updates — never marketing (see NOTIFICATIONS.md).
  /** E.164, e.g. "+2207123456". Stored normalised so the API accepts it. */
  whatsappNumber?: string;
  whatsappOptIn?: boolean;
  whatsappOptInAt?: Timestamp;
  /** Email alerts are on by default for anyone who completes the prompt. */
  emailOptIn?: boolean;
  /** Set once the WhatsApp prompt has been answered, so it stops appearing. */
  notificationsPromptedAt?: Timestamp;
  /** Last time we sent this member a job digest, to keep the cadence sane. */
  lastJobAlertAt?: Timestamp;

  // ─── CV ────────────────────────────────────────────────
  cvUrl?: string;
  cvFileName?: string;
  cvUploadedAt?: Timestamp;
  /** When the AI parser last read the CV into the fields above. */
  cvParsedAt?: Timestamp;
  yearsOfExperience?: number;
  phone?: string;

  // ─── VA accreditation review ─────────────────────────────
  // Freelancers (role "va") must upload their VA training/accreditation
  // documents at signup and wait for an admin to approve them before the
  // dashboard opens up. Absent field == never submitted.
  vaVerificationStatus?: VaVerificationStatus;
  vaCertificates?: UploadedFile[];
  vaVerificationSubmittedAt?: Timestamp;
  vaVerificationReviewedAt?: Timestamp;
  vaVerificationReviewedBy?: string;
  /** Admin's note — the reason shown to the VA when rejected. */
  vaVerificationNote?: string;
}

export type VaVerificationStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

export interface UploadedFile {
  name: string;
  url: string;
  uploadedAt: Timestamp;
  description?: string;
  skills?: string[];
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

export interface PortfolioProject {
  name: string;
  title: string;
  description: string;
  links: string[];
  mediaUrls: string[];
}

// ─── Project ───────────────────────────────────────────────
export type ProjectStatus = "open" | "in-progress" | "closed";
export type BudgetType = "fixed" | "hourly";

export interface FirestoreProject {
  id: string;
  title: string;
  description: string;
  budget: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: BudgetType;
  category: string;
  tags: string[];
  duration: string;
  location: string;
  status: ProjectStatus;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  applicants: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  hiredVaId?: string;
  escrowAmount?: number;
  escrowStatus?: "held" | "released";
  finalPayout?: number;
  platformFee?: number;
  vaPayout?: number;
  refundAmount?: number;
  completedAt?: Timestamp;
}

// ─── Proposal ──────────────────────────────────────────────
export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface Proposal {
  id: string;
  projectId: string;
  projectTitle: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  coverLetter: string;
  proposedRate: string;
  status: ProposalStatus;
  createdAt: Timestamp;
}

// ─── Job Board ─────────────────────────────────────────────
export type JobEmploymentType = "full-time" | "part-time" | "contract" | "internship" | "opportunity" | "pr-opportunity";
export type JobStatus = "open" | "closed";

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: JobEmploymentType;
  salary: string;
  category: string;
  skills: string[];
  postedBy: string;
  postedByName: string;
  postedByAvatar: string;
  status: JobStatus;
  applicants: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // ─── Imported listings ───────────────────────────────────
  // Jobs pulled in from a public board keep a link back to the original
  // advert: that is where the candidate actually applies, and several boards
  // require the attribution.
  /** Board the listing came from, e.g. "Gamjobs". */
  sourceName?: string;
  /**
   * True when applying happens on the source board rather than on CONNEKT.
   * The destination URL itself lives in `jobLinks/{jobId}`, which only paid
   * members can read — see firestore.rules. These two fields are the legacy
   * home of that link and are cleared by scripts/migrate-job-links.js.
   */
  external?: boolean;
  /** @deprecated moved to jobLinks/{jobId}. */
  sourceUrl?: string;
  /** @deprecated moved to jobLinks/{jobId}. */
  applyUrl?: string;
  /** Advertised closing date, when the source states one. */
  deadline?: Timestamp;

  // ─── Daily sync bookkeeping ──────────────────────────────
  /** Last run of syncJobs that still found this listing on its source. */
  lastSeenAt?: Timestamp;
  /** First run of syncJobs that imported it. */
  importedAt?: Timestamp;
  /** Why an imported listing was closed: "expired" | "delisted" | "filled". */
  closedReason?: string;
}

/**
 * Where an imported listing is actually applied to. Split out of the public
 * `jobs` document so the link is only readable with an active membership —
 * "subscribe to apply" has to hold even against someone reading Firestore
 * directly, not just against the UI.
 */
export interface JobLink {
  jobId: string;
  sourceName: string;
  sourceUrl: string;
  applyUrl: string;
  updatedAt: Timestamp;
}

export type JobApplicationStatus = "pending" | "reviewed" | "shortlisted" | "rejected";

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantAvatar: string;
  phone: string;
  coverLetter: string;
  status: JobApplicationStatus;
  createdAt: Timestamp;
}

// ─── Memberships ───────────────────────────────────────────
export type SubscriptionStatus = "active" | "expired" | "cancelled";

/** Derived from the payment type: `<plan>_subscription`. */
export type MembershipPlan = "internship" | "job" | "employer";

export interface InternshipSubscription {
  uid: string;
  plan: MembershipPlan;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  startedAt: Timestamp;
  currentPeriodEnd: Timestamp;
  lastPaymentRef: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Reviews ───────────────────────────────────────────────
export interface Review {
  id: string;
  revieweeId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  projectId?: string;
  createdAt: Timestamp;
}

// ─── Platform Events ───────────────────────────────────────
export interface PlatformEvent {
  id: string;
  title: string;
  type: string;
  date: Timestamp;
  description?: string;
}

// ─── Learning Courses ──────────────────────────────────────
export interface Course {
  id: string;
  title: string;
  category: string;
  level?: string;
  durationLabel?: string;
}

// ─── Interviews (employer ↔ candidate) ─────────────────────
export type InterviewStatus = "scheduled" | "completed" | "cancelled";

export interface Interview {
  id: string;
  employerId: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar: string;
  jobTitle: string;
  mode: string; // e.g. "Video call", "Phone", "In person"
  scheduledAt: Timestamp;
  status: InterviewStatus;
  notes?: string;
  createdAt: Timestamp;
}

// ─── Assessments ───────────────────────────────────────────
export interface Assessment {
  id: string;
  employerId: string;
  title: string;
  type: string; // e.g. "Skills test", "Coding", "Personality"
  jobTitle?: string;
  durationLabel?: string;
  createdAt: Timestamp;
}

// ─── Career Resources ──────────────────────────────────────
export interface Resource {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  createdAt?: Timestamp;
}

// ─── Messaging ─────────────────────────────────────────────
export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage: string;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: any; // Using any to support both RTDB (number) and Firestore Timestamp
}
