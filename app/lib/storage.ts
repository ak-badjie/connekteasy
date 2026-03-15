import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload a file to Firebase Storage and return the download URL.
 */
async function uploadFile(
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/**
 * Upload a profile photo.
 */
export async function uploadProfilePhoto(
  uid: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const ext = file.name.split(".").pop();
  return uploadFile(
    `users/${uid}/profile-photo.${ext}`,
    file,
    onProgress
  );
}

/**
 * Upload a cover photo.
 */
export async function uploadCoverPhoto(
  uid: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const ext = file.name.split(".").pop();
  return uploadFile(
    `users/${uid}/cover-photo.${ext}`,
    file,
    onProgress
  );
}

/**
 * Upload a certificate file.
 */
export async function uploadCertificate(
  uid: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return uploadFile(
    `users/${uid}/certificates/${Date.now()}-${file.name}`,
    file,
    onProgress
  );
}

/**
 * Upload a portfolio image.
 */
export async function uploadPortfolioImage(
  uid: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return uploadFile(
    `users/${uid}/portfolio/${Date.now()}-${file.name}`,
    file,
    onProgress
  );
}

/**
 * Upload an intro video.
 */
export async function uploadIntroVideo(
  uid: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const ext = file.name.split(".").pop();
  return uploadFile(
    `users/${uid}/intro-video.${ext}`,
    file,
    onProgress
  );
}

/**
 * Upload a project attachment (image or document).
 */
export async function uploadProjectAttachment(
  projectId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return uploadFile(
    `projects/${projectId}/attachments/${Date.now()}-${file.name}`,
    file,
    onProgress
  );
}
