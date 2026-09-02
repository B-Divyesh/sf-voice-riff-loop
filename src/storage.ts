import type { LoopProject } from './audio';

export type StoredProject = { project: LoopProject; audio: Blob; savedAt: string };

function open(demo: boolean): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(demo ? 'demo:voice-riff-loop' : 'voice-riff-loop', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadProject(demo: boolean): Promise<StoredProject | undefined> {
  const db = await open(demo);
  return new Promise((resolve, reject) => {
    const request = db.transaction('projects', 'readonly').objectStore('projects').get('current');
    request.onsuccess = () => resolve(request.result as StoredProject | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(demo: boolean, value: StoredProject): Promise<void> {
  const db = await open(demo);
  return new Promise((resolve, reject) => {
    const request = db.transaction('projects', 'readwrite').objectStore('projects').put(value, 'current');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function resetProject(demo: boolean): Promise<void> {
  const db = await open(demo);
  return new Promise((resolve, reject) => {
    const request = db.transaction('projects', 'readwrite').objectStore('projects').clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
