import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db, rtdb } from "./firebase";
import { ref, onValue, push, set, serverTimestamp as rtdbServerTimestamp, query as rtdbQuery, orderByChild } from "firebase/database";
import type {
  UserProfile,
  FirestoreProject,
  Proposal,
  Conversation,
  Message,
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
