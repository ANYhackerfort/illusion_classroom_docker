// src/indexDB/botStorage.ts
// Minimal, typed IndexedDB wrapper for Bot records with an attached video File.
import type { Bot } from "./bot";

export interface StoredBotRecord {
  id: string;
  data: Bot; // full bot object
  storedVideo: File; // raw File for the bot's video
}

const DB_NAME = "botDB";
const STORE_NAME = "bots";

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

/** Create or overwrite a bot record (id is the key). */
export const saveBot = async (data: Bot, storedVideo: File): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put({ id: data.id, data, storedVideo } satisfies StoredBotRecord);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/** Fetch ALL records (INCLUDING the video File). */
export const getAllBots = async (): Promise<StoredBotRecord[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const req = store.getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve((req.result ?? []) as StoredBotRecord[]);
    req.onerror = () => reject(req.error);
  });
};

/** Fetch ALL records but WITHOUT the video File (metadata only). */
export const getAllBotsMeta = async (): Promise<
  Array<{ id: string; data: Bot }>
> => {
  const all = await getAllBots();
  return all.map(({ id, data }) => ({ id, data }));
};

/** Fetch a single record by id (INCLUDING the video File). */
export const getBotById = async (
  id: string,
): Promise<StoredBotRecord | null> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const req = store.get(id);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve((req.result as StoredBotRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
};

/** Fetch a single record by id WITHOUT the video File (metadata only). */
export const getBotMetaById = async (
  id: string,
): Promise<{ id: string; data: Bot } | null> => {
  const rec = await getBotById(id);
  return rec ? { id: rec.id, data: rec.data } : null;
};

/** Optional helpers */
export const deleteBot = async (id: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/** Edit a bot's memory, answer_select, and randomize if values are provided and different. */
export const editBotById = async (
  botId: string,
  updates: Partial<{
    memory: string;
    answer_select: any;
    randomize: number;
    name: string;
  }>,
): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const req = store.get(botId);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const bot = req.result as StoredBotRecord | undefined;
      if (!bot) {
        reject(new Error(`Bot with id ${botId} not found`));
        return;
      }

      let updated = false;

      if (updates.memory && updates.memory !== bot.data.memory) {
        bot.data.memory = updates.memory;
        updated = true;
      }
      if (
        updates.answer_select &&
        JSON.stringify(updates.answer_select) !==
          JSON.stringify(bot.data.answer_select)
      ) {
        bot.data.answer_select = updates.answer_select;
        updated = true;
      }
      if (
        typeof updates.randomize === "number" &&
        updates.randomize !== bot.data.randomize
      ) {
        bot.data.randomize = updates.randomize;
        updated = true;
      }

      if (updates.name && updates.name !== bot.data.name) {
        bot.data.name = updates.name;
        updated = true;
      }

      if (updated) {
        store.put(bot);
      }
      tx.oncomplete = () => {
        console.log("Updated bot payload:", {
          id: botId,
          memory: bot.data.memory,
          answer_select: bot.data.answer_select,
          randomize: bot.data.randomize,
        });
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };

    req.onerror = () => reject(req.error);
  });
};
