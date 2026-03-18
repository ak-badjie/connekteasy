import { Timestamp } from "firebase/firestore";

// ─── User Profile ──────────────────────────────────────────
export type UserRole = "client" | "va";

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
}

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
