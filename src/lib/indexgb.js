import { openDB } from 'idb';

// 1. Define the database with all necessary stores
const dbPromise = openDB('app-db', 1, {
  upgrade(db) {
    // Store for user session
    if (!db.objectStoreNames.contains('user-store')) {
      db.createObjectStore('user-store');
    }
    // Store for auth token
    if (!db.objectStoreNames.contains('auth-store')) {
      db.createObjectStore('auth-store');
    }
    // Store for offline actions (like creating customers)
    if (!db.objectStoreNames.contains('offline-queue')) {
      db.createObjectStore('offline-queue', { autoIncrement: true, keyPath: 'id' });
    }
    // Store for measurements, keyed by customer ID
    if (!db.objectStoreNames.contains('measurements')) {
      db.createObjectStore('measurements');
    }
  },
});

// We don't need an explicit initDB export, idb handles it.

// Generic functions to set/get data from a specific store
export async function setStoreData(storeName, key, data) {
  const db = await dbPromise;
  return db.put(storeName, data, key);
}

export async function getStoreData(storeName, key) {
  const db = await dbPromise;
  return db.get(storeName, key);
}
// 2. Functions to save data
export async function saveToken(token) {
  const db = await dbPromise;
  return db.put('auth-store', token, 'jwt-token');
}

export async function saveUser(user) {
  const db = await dbPromise;
  return db.put('user-store', user, 'current-user');
}

// 3. Functions to get data
export async function getToken() {
  const db = await dbPromise;
  return db.get('auth-store', 'jwt-token');
}

export async function getUser() {
  const db = await dbPromise;
  return db.get('user-store', 'current-user');
}

// 4. Function to clear data on logout
export async function clearDB() {
    const db = await dbPromise;
    await db.clear('auth-store');
    await db.clear('user-store');
}

// 5. Function to add items to the offline queue
export async function addToOfflineQueue(item) {
  const db = await dbPromise;
  return db.add('offline-queue', item);
}
