import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db, rtdb } from "./firebase";
import { ref, onValue, push, set, get, serverTimestamp as rtdbServerTimestamp, query as rtdbQuery, orderByChild } from "firebase/database";
import type {
  UserProfile,
  FirestoreProject,
  Proposal,
  Conversation,
  Message,
  Job,
  JobApplication,
  JobApplicationStatus,
  Review,
  PlatformEvent,
  Course,
  Resource,
  Interview,
  InterviewStatus,
  Assessment,
} from "./types";

// ─── Users ─────────────────────────────────────────────────

export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Projects ──────────────────────────────────────────────

export async function createProject(
  data: Omit<FirestoreProject, "id" | "createdAt" | "updatedAt" | "applicants">
): Promise<string> {
  const ref = await addDoc(collection(db, "projects"), {
    ...data,
    applicants: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getProjects(): Promise<FirestoreProject[]> {
  const q = query(
    collection(db, "projects"),
    where("status", "==", "open"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProject));
}

export async function getProjectsByOwner(
  ownerId: string
): Promise<FirestoreProject[]> {
  const q = query(
    collection(db, "projects"),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProject));
}

export async function getProject(
  projectId: string
): Promise<FirestoreProject | null> {
  const snap = await getDoc(doc(db, "projects", projectId));
  return snap.exists()
    ? ({ id: snap.id, ...snap.data() } as FirestoreProject)
    : null;
}

export async function updateProject(
  projectId: string,
  data: Partial<FirestoreProject>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...updateData } = data as FirestoreProject;
  await updateDoc(doc(db, "projects", projectId), {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "projects", projectId));
}

// ─── Freelancer Discovery ──────────────────────────────────

export async function getFreelancers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "va"),
    where("onboardingComplete", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

// ─── Proposals ─────────────────────────────────────────────

export async function createProposal(
  data: Omit<Proposal, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "proposals"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Increment applicant count on the project
  await updateDoc(doc(db, "projects", data.projectId), {
    applicants: increment(1),
  });
  return ref.id;
}

export async function getProposalsByProject(
  projectId: string
): Promise<Proposal[]> {
  const q = query(
    collection(db, "proposals"),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal));
}

export async function getProposalsByUser(
  freelancerId: string
): Promise<Proposal[]> {
  const q = query(
    collection(db, "proposals"),
    where("freelancerId", "==", freelancerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal));
}

export async function updateProposalStatus(
  proposalId: string,
  status: "accepted" | "rejected",
  projectId?: string,
  freelancerId?: string
): Promise<void> {
  await updateDoc(doc(db, "proposals", proposalId), { status });
  if (status === "accepted" && projectId && freelancerId) {
    await updateDoc(doc(db, "projects", projectId), {
      status: "in-progress",
      hiredVaId: freelancerId,
    });
  }
}

// ─── Jobs ──────────────────────────────────────────────────

export async function createJob(
  data: Omit<Job, "id" | "createdAt" | "updatedAt" | "applicants">
): Promise<string> {
  const ref = await addDoc(collection(db, "jobs"), {
    ...data,
    applicants: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getJobs(): Promise<Job[]> {
  const q = query(
    collection(db, "jobs"),
    where("status", "==", "open"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
}

export async function getJob(jobId: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, "jobs", jobId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null;
}

export async function getJobsByEmployer(employerId: string): Promise<Job[]> {
  const q = query(
    collection(db, "jobs"),
    where("postedBy", "==", employerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
}

export async function closeJob(jobId: string): Promise<void> {
  await updateDoc(doc(db, "jobs", jobId), {
    status: "closed",
    updatedAt: serverTimestamp(),
  });
}

export async function createJobApplication(
  data: Omit<JobApplication, "id" | "createdAt" | "status">
): Promise<string> {
  const ref = await addDoc(collection(db, "jobApplications"), {
    ...data,
    status: "pending" as JobApplicationStatus,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "jobs", data.jobId), {
    applicants: increment(1),
  });
  return ref.id;
}

export async function getApplicationsByJob(jobId: string): Promise<JobApplication[]> {
  const q = query(
    collection(db, "jobApplications"),
    where("jobId", "==", jobId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
}

export async function getApplicationsByUser(applicantId: string): Promise<JobApplication[]> {
  const q = query(
    collection(db, "jobApplications"),
    where("applicantId", "==", applicantId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
}

export async function updateJobApplicationStatus(
  applicationId: string,
  status: JobApplicationStatus
): Promise<void> {
  await updateDoc(doc(db, "jobApplications", applicationId), { status });
}

export async function hasAppliedToJob(
  jobId: string,
  applicantId: string
): Promise<boolean> {
  const q = query(
    collection(db, "jobApplications"),
    where("jobId", "==", jobId),
    where("applicantId", "==", applicantId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// ─── Messaging ─────────────────────────────────────────────

export async function getOrCreateConversation(
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string,
  otherUserId: string,
  otherUserName: string,
  otherUserAvatar: string
): Promise<string> {
  // Check if conversation exists between these two users
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", currentUserId)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => {
    const data = d.data();
    return data.participants.includes(otherUserId);
  });

  if (existing) return existing.id;

  // Create new conversation
  const ref = await addDoc(collection(db, "conversations"), {
    participants: [currentUserId, otherUserId],
    participantNames: {
      [currentUserId]: currentUserName,
      [otherUserId]: otherUserName,
    },
    participantAvatars: {
      [currentUserId]: currentUserAvatar,
      [otherUserId]: otherUserAvatar,
    },
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getConversations(
  userId: string
): Promise<Conversation[]> {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const messagesRef = rtdbQuery(ref(rtdb, `messages/${conversationId}`), orderByChild("createdAt"));
  
  const unsubscribeRtdb = onValue(messagesRef, (snapshot) => {
    const msgs: Message[] = [];
    snapshot.forEach((childSnap) => {
      msgs.push({ id: childSnap.key as string, ...childSnap.val() });
    });
    callback(msgs);
  });

  return () => unsubscribeRtdb();
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string
): Promise<void> {
  const newMessageRef = push(ref(rtdb, `messages/${conversationId}`));
  await set(newMessageRef, {
    conversationId,
    senderId,
    senderName,
    content,
    createdAt: rtdbServerTimestamp(),
  });

  // Keep updating the conversation's last message in Firestore so the inbox list updates
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: content,
    lastMessageAt: serverTimestamp(),
  });
}

// ─── Hired projects (freelancer view) ──────────────────────

export async function getProjectsByHiredVa(uid: string): Promise<FirestoreProject[]> {
  const q = query(collection(db, "projects"), where("hiredVaId", "==", uid));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProject));
  return rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

// ─── Saved jobs (seekers) ──────────────────────────────────

export async function toggleSavedJob(uid: string, jobId: string, save: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    savedJobs: save ? arrayUnion(jobId) : arrayRemove(jobId),
    updatedAt: serverTimestamp(),
  });
}

// ─── Reviews ───────────────────────────────────────────────

export async function getReviewsFor(uid: string): Promise<Review[]> {
  const q = query(collection(db, "reviews"), where("revieweeId", "==", uid));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  return rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

// ─── Platform events ───────────────────────────────────────

export async function getUpcomingEvents(max = 5): Promise<PlatformEvent[]> {
  try {
    const q = query(
      collection(db, "events"),
      where("date", ">=", Timestamp.now()),
      orderBy("date", "asc"),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlatformEvent));
  } catch {
    return [];
  }
}

// ─── Learning courses ──────────────────────────────────────

export async function getCourses(max = 6): Promise<Course[]> {
  try {
    const snap = await getDocs(query(collection(db, "courses"), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
  } catch {
    return [];
  }
}

// ─── Profile views ─────────────────────────────────────────

export async function incrementProfileView(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), { profileViews: increment(1) });
  } catch {
    /* non-critical */
  }
}

// ─── Wallet earnings (RTDB) ────────────────────────────────
// Sums money the user has *received* (escrow releases + refunds + deposits are
// excluded from "earnings"; we count escrow_release as earned income).

export interface EarningsSummary {
  total: number;
  monthly: { label: string; amount: number }[];
}

export async function getEarningsSummary(uid: string): Promise<EarningsSummary> {
  const snap = await get(ref(rtdb, `wallets/${uid}/transactions`));
  const months: { label: string; amount: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleString("en-GB", { month: "short" }), amount: 0 });
  }
  let total = 0;
  if (snap.exists()) {
    const data = snap.val() as Record<string, { type?: string; amount?: number; timestamp?: number; status?: string }>;
    Object.values(data).forEach((tx) => {
      if (tx.type === "escrow_release" && typeof tx.amount === "number") {
        total += tx.amount;
        const t = new Date(tx.timestamp || Date.now());
        const monthsAgo = (now.getFullYear() - t.getFullYear()) * 12 + (now.getMonth() - t.getMonth());
        if (monthsAgo >= 0 && monthsAgo <= 5) {
          months[5 - monthsAgo].amount += tx.amount;
        }
      }
    });
  }
  return { total, monthly: months };
}

// ─── Admin: Events ─────────────────────────────────────────

export async function createEvent(data: Omit<PlatformEvent, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "events"), data);
  return ref.id;
}

export async function getAllEvents(): Promise<PlatformEvent[]> {
  const snap = await getDocs(collection(db, "events"));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlatformEvent));
  return rows.sort((a, b) => (a.date?.toMillis?.() ?? 0) - (b.date?.toMillis?.() ?? 0));
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, "events", id));
}

// ─── Admin: Courses ────────────────────────────────────────

export async function createCourse(data: Omit<Course, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "courses"), data);
  return ref.id;
}

export async function getAllCourses(): Promise<Course[]> {
  const snap = await getDocs(collection(db, "courses"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
}

export async function deleteCourse(id: string): Promise<void> {
  await deleteDoc(doc(db, "courses", id));
}

// ─── Reviews (employer → freelancer) ───────────────────────

export async function createReview(
  data: Omit<Review, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "reviews"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Maintain a running average + count on the reviewee's profile.
  try {
    const existing = await getReviewsFor(data.revieweeId);
    const all = existing.concat();
    const count = all.length;
    const avg = count > 0 ? all.reduce((s, r) => s + (r.rating || 0), 0) / count : data.rating;
    await updateDoc(doc(db, "users", data.revieweeId), {
      rating: Math.round(avg * 10) / 10,
      reviewCount: count,
    });
  } catch {
    /* non-critical */
  }
  return ref.id;
}

export async function hasReviewedProject(reviewerId: string, projectId: string): Promise<boolean> {
  const q = query(
    collection(db, "reviews"),
    where("reviewerId", "==", reviewerId),
    where("projectId", "==", projectId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// ─── Saved jobs (read list) ────────────────────────────────

export async function getSavedJobs(jobIds: string[]): Promise<Job[]> {
  const results = await Promise.all(
    jobIds.map((id) => getDoc(doc(db, "jobs", id)).catch(() => null))
  );
  return results
    .filter((s): s is NonNullable<typeof s> => !!s && s.exists())
    .map((s) => ({ id: s.id, ...s.data() } as Job));
}

// ─── Admin: Career Resources ───────────────────────────────

export async function createResource(data: Omit<Resource, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "resources"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getResources(): Promise<Resource[]> {
  const snap = await getDocs(collection(db, "resources"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Resource));
}

export async function deleteResource(id: string): Promise<void> {
  await deleteDoc(doc(db, "resources", id));
}

// ─── Admin: Users ──────────────────────────────────────────

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

export async function setUserAdmin(uid: string, value: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { isAdmin: value });
}

// ─── Interviews (employer) ─────────────────────────────────

export async function createInterview(data: Omit<Interview, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "interviews"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getInterviewsByEmployer(uid: string): Promise<Interview[]> {
  const snap = await getDocs(query(collection(db, "interviews"), where("employerId", "==", uid)));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Interview));
  return rows.sort((a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0));
}

export async function updateInterviewStatus(id: string, status: InterviewStatus): Promise<void> {
  await updateDoc(doc(db, "interviews", id), { status });
}

// ─── Assessments (employer) ────────────────────────────────

export async function createAssessment(data: Omit<Assessment, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "assessments"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getAssessmentsByEmployer(uid: string): Promise<Assessment[]> {
  const snap = await getDocs(query(collection(db, "assessments"), where("employerId", "==", uid)));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assessment));
  return rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export async function deleteAssessment(id: string): Promise<void> {
  await deleteDoc(doc(db, "assessments", id));
}
