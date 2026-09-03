import type { QueuedOp } from "../types";

/* Minimal IndexedDB wrapper for the offline action queue */
const DB_NAME = "botclass-offline";
const STORE = "ops";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, {
          keyPath: "key",
          autoIncrement: true,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueOp(op: Omit<QueuedOp, "key">): Promise<void> {
  const dbi = await openDb();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(op);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function allOps(): Promise<QueuedOp[]> {
  const dbi = await openDb();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll() as IDBRequest<QueuedOp[]>;
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeOp(key: number): Promise<void> {
  const dbi = await openDb();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function opCount(): Promise<number> {
  const ops = await allOps().catch(() => [] as QueuedOp[]);
  return ops.length;
}
