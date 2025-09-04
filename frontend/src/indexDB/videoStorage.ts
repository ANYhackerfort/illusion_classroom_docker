// src/utils/videoStorage.ts
import type { VideoSegmentData } from "../types/QuestionCard";

export interface VideoMetadata {
  id: string;
  videoName: string;
  videoTags: string[];
  videoLength: number;
  questionCards: VideoSegmentData[]; // ✅ updated from `any[]` to `VideoSegmentData[]`
  savedAt: string;
}

export interface StoredVideo {
  id: string;
  metadata: VideoMetadata;
  file: File;
}

const DB_NAME = "videoEditorDB";
const STORE_NAME = "videos";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveVideoToIndexedDB = async (
  metadata: VideoMetadata,
  file: File,
): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.put({ id: metadata.id, metadata, file });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      window.dispatchEvent(new Event("video-db-updated")); // ✅ Trigger update event
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const getVideoById = async (id: string): Promise<StoredVideo | null> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(id);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
};

export const getAllVideos = async (): Promise<StoredVideo[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as StoredVideo[]);
    request.onerror = () => reject(request.error);
  });
};
