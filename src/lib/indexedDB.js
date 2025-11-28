
import { openDB } from 'idb';

const DB_NAME = 'TailorDB';
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('users')) {
      db.createObjectStore('users', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('customers')) {
      db.createObjectStore('customers', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('families')) {
      db.createObjectStore('families', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('orders')) {
      db.createObjectStore('orders', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('invoices')) {
      db.createObjectStore('invoices', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('payments')) {
      db.createObjectStore('payments', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('measurements')) {
      db.createObjectStore('measurements', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('templates')) {
      db.createObjectStore('templates', { keyPath: '_id' });
    }
  },
});

export const addData = async (storeName, data) => {
  const db = await dbPromise;
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.add({ ...data, createdAt: new Date(), updatedAt: new Date() });
  return tx.done;
};
export const putData = async (storeName, data) => {
  const db = await dbPromise;
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);

  await store.put({
    ...data,
    updatedAt: new Date()
  });

  return tx.done;
};


export const getData = async (storeName, id) => {
  const db = await dbPromise;
  return db.get(storeName, id);
};

export const getAllData = async (storeName) => {
  const db = await dbPromise;
  return db.getAll(storeName);
};

export const updateData = async (storeName, data) => {
  const db = await dbPromise;
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.put({ ...data, updatedAt: new Date() });
  return tx.done;
};

export const deleteData = async (storeName, id) => {
  const db = await dbPromise;
  const tx = db.transaction(storeName, 'readwrite');
  await tx.objectStore(storeName).delete(id);
  return tx.done;
};

export const clearDB = async () => {
  const db = await dbPromise;
  const tx = db.transaction(db.objectStoreNames, 'readwrite');
  const stores = Array.from(db.objectStoreNames).map(storeName => tx.objectStore(storeName));
  await Promise.all(stores.map(store => store.clear()));
  return tx.done;
};

export const clearAllData = async () => {
  const db = await dbPromise;
  const storeNames = ['customers', 'families', 'orders', 'payments', 'invoices', 'measurements', 'templates'];
  const tx = db.transaction(storeNames, 'readwrite');
  await Promise.all(storeNames.map(storeName => tx.objectStore(storeName).clear()));
  return tx.done;
};

export const clearAndBulkAdd = async (dataFromServer) => {
  const db = await dbPromise;
  const storeNames = ['users','customers','families','orders','invoices','payments','measurements','templates'];

  const tx = db.transaction(storeNames, 'readwrite');

  for (const storeName of storeNames) {
    const store = tx.objectStore(storeName);
    await store.clear();

    const items = dataFromServer[storeName] || [];
    for (const item of items) {
      // Make sure all backend data is marked as synced
      store.add({ ...item, synced: true });
    }
  }

  return tx.done; // Wait for transaction to finish
};


export const loadSampleData = async (userId) => {
  console.log("loadSampleData started for user:", userId);
  const db = await dbPromise;

  // Clear existing data to avoid duplicates on re-sync
  console.log("Clearing existing data...");
  await clearAllData();
  console.log("Existing data cleared.");

  // Simulate fetching data from a backend
  const familiesToSync = [
    { _id: 'family-1', name: 'The Smiths', synced: true, userId },
    { _id: 'family-2', name: 'The Jones', synced: true, userId },
  ];
  const customersToSync = [
    { _id: 'cust-1', name: 'John Smith', phone: '123-456-7890', familyId: 'family-1', address: '123 Main St', synced: true, userId },
    { _id: 'cust-2', name: 'Jane Smith', phone: '123-456-7891', familyId: 'family-1', address: '123 Main St', synced: true, userId },
    { _id: 'cust-3', name: 'Peter Jones', phone: '987-654-3210', familyId: 'family-2', address: '456 Oak Ave', synced: true, userId },
  ];
  const ordersToSync = [
    { _id: 'order-1', customerId: 'cust-1', items: [{ description: 'Shirt', quantity: 2, rate: 500 }], totalAmount: 1000, status: 'delivered', synced: true, userId },
    { _id: 'order-2', customerId: 'cust-3', items: [{ description: 'Pants', quantity: 1, rate: 1200 }], totalAmount: 1200, status: 'pending', synced: true, userId },
  ];
  const measurementsToSync = [
    { _id: 'meas-1', customerId: 'cust-1', templateId: 'temp-1', values: { chest: '40', waist: '34' }, synced: true, userId },
  ];
  const templatesToSync = [
    { _id: 'temp-1', name: 'Standard Shirt', measurements: [{ field: 'chest', label_en: 'Chest', unit: 'inches' }, { field: 'waist', label_en: 'Waist', unit: 'inches' }], synced: true, userId },
  ];

  console.log("Adding data to IndexedDB...");
  // Add data to IndexedDB
  try {
    await Promise.all([
      ...familiesToSync.map(f => addData('families', f)),
      ...customersToSync.map(c => addData('customers', c)),
      ...ordersToSync.map(o => addData('orders', o)),
      ...measurementsToSync.map(m => addData('measurements', m)),
      ...templatesToSync.map(t => addData('templates', t)),
    ]);
    console.log("IndexedDB populated with sample data.");
  } catch (error) {
    console.error("Error populating IndexedDB:", error);
  }
};

/**
 * Attempt to synchronize all locally unsynced records to a backend.
 * This function is intentionally generic: it collects unsynced records from all
 * known stores and, if a syncFn is provided and the client is online, calls it
 * with the unsynced payload. The syncFn should perform network requests and
 * return an object indicating which records were successfully synced.
 *
 * If syncFn is not provided or client is offline, this returns the collected
 * unsynced records so the caller can decide what to do.
 *
 * Example syncFn signature:
 *   async function syncFn(unsynced) { return { success: true, syncedIds: { orders: ['local-123'] } } }
 */
export const syncAllToBackend = async (syncFn) => {
  const db = await dbPromise;
  const storeNames = ['customers','families','orders','payments','invoices','measurements','templates'];
  
  // Variable ka naam 'payload' kar diya kyunki ab isme SARA data hoga, sirf unsynced nahi
  const payload = {}; 

  // 1️⃣ Collect ALL records (Not just unsynced)
  for (const storeName of storeNames) {
    try {
      const all = await db.getAll(storeName);
      // 👇 CHANGE: Filter hata diya, ab sara data jayega
      payload[storeName] = all || []; 
    } catch (err) {
      payload[storeName] = [];
    }
  }

  // 2️⃣ Check connectivity
  if (!syncFn || typeof syncFn !== 'function' || !navigator.onLine) {
    return { success: false, reason: !navigator.onLine ? 'offline' : 'no-sync-fn', unsynced: payload };
  }

  // 3️⃣ Call sync function with ALL data
  const result = await syncFn(payload);

  if (result && result.success) {
    // ✅ Mark ALL records as synced locally
    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const records = payload[storeName];
      
      for (const rec of records) {
        // Agar pehle se synced marked hai to bar bar write karne ki zaroorat nahi (performance bachane ke liye)
        if (rec.synced === true) continue; 

        try {
          // Sirf unko update karo jo synced nahi thay
          store.put({ ...rec, synced: true, updatedAt: new Date() });
        } catch (err) {
          console.error('Failed marking synced for', storeName, rec._id || rec.localId, err);
        }
      }
      await tx.done;
    }

    return { success: true, result };
  }

  return { success: false, reason: 'sync-failed', result };
};
