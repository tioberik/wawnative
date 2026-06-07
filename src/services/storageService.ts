import { storage } from "@/lib/firebase";
import type { Attachment } from "@/types/order";
import * as ImageManipulator from "expo-image-manipulator";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

// Parametri optimizacije ("spremanje u oblaku")
const FULL_MAX_WIDTH = 1600; // puna slika — ograniči širinu
const FULL_QUALITY = 0.7; // kompresija pune slike
const THUMB_MAX_WIDTH = 320; // sličica za galeriju
const THUMB_QUALITY = 0.5; // kompresija sličice

/** Kompresuje i smanjuje sliku na zadanu širinu (JPEG). Vraća lokalni uri. */
async function compress(uri: string, maxWidth: number, quality: number): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

/** Pretvori lokalni file uri u Blob za upload. */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/** Upload jednog fajla u Storage uz praćenje napretka. Vraća download URL. */
function uploadFile(
  path: string,
  blob: Blob,
  onProgress?: (fraction: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, blob, {
      contentType: "image/jpeg",
    });
    task.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
        }
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/**
 * Uploaduje sliku kao prilog narudžbe:
 * 1. kompresuje punu sliku i thumbnail (optimizacija),
 * 2. uploaduje oba u Storage pod orders/{uid}/{orderId}/,
 * 3. vraća Attachment objekt za spremanje u Firestore.
 */
export async function uploadAttachment(
  uid: string,
  orderId: string,
  localUri: string,
  onProgress?: (fraction: number) => void
): Promise<Attachment> {
  const ts = Date.now();
  const basePath = `orders/${uid}/${orderId}/${ts}`;
  const fullPath = `${basePath}_full.jpg`;
  const thumbPath = `${basePath}_thumb.jpg`;

  // 1. Kompresija
  const fullUri = await compress(localUri, FULL_MAX_WIDTH, FULL_QUALITY);
  const thumbUri = await compress(localUri, THUMB_MAX_WIDTH, THUMB_QUALITY);

  const fullBlob = await uriToBlob(fullUri);
  const thumbBlob = await uriToBlob(thumbUri);

  // 2. Upload — thumbnail prvo (mali, brzo), pa puna slika sa progress-om
  const thumbUrl = await uploadFile(thumbPath, thumbBlob);
  const url = await uploadFile(fullPath, fullBlob, onProgress);

  // 3. Attachment objekt
  return {
    id: `${ts}`,
    url,
    thumbUrl,
    path: fullPath,
    thumbPath,
    name: `Fotografija ${new Date(ts).toLocaleString("hr-HR")}`,
    uploadedAt: ts,
  };
}

/** Briše datoteke priloga (punu sliku i thumbnail) iz Storage-a. */
export async function deleteAttachmentFiles(attachment: Attachment): Promise<void> {
  // Ne prekidaj ako jedan od fajlova već ne postoji.
  await Promise.allSettled([
    deleteObject(ref(storage, attachment.path)),
    deleteObject(ref(storage, attachment.thumbPath)),
  ]);
}
