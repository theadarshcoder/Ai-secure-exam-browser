/**
 * 💾 storageService.js
 * Robust IndexedDB wrapper for high-capacity offline persistence.
 * Replaces the 5MB-limited localStorage for exam progress synchronization.
 */

const DB_NAME = 'VisionOfflineStorage';
const DB_VERSION = 1;
const STORE_NAME = 'offline_progress';

class StorageService {
  constructor() {
    this.db = null;
  }

  async initDB() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('❌ IndexedDB Init Error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 📥 Save progress to IndexedDB
   * @param {string} examId - Unique identifier for the assessment
   * @param {object} data - Shuffled questions, answers, and metadata
   */
  async saveProgress(examId, data) {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const entry = {
        id: examId,
        data: btoa(encodeURIComponent(JSON.stringify(data))), // Keep encoding for compatibility check
        timestamp: Date.now()
      };

      return new Promise((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('❌ Failed to save to IndexedDB:', err);
      return false;
    }
  }

  /**
   * 📤 Retrieve progress from IndexedDB
   * @param {string} examId 
   */
  async getProgress(examId) {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get(examId);
        request.onsuccess = () => {
          if (!request.result) return resolve(null);
          try {
            const decoded = JSON.parse(decodeURIComponent(atob(request.result.data)));
            resolve(decoded);
          } catch (e) {
            console.error('Failed to parse decoded IndexedDB data:', e);
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('❌ Failed to read from IndexedDB:', err);
      return null;
    }
  }

  /**
   * 🗑️ Clear progress for an assessment
   * @param {string} examId 
   */
  async deleteProgress(examId) {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.delete(examId);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('❌ Failed to delete from IndexedDB:', err);
      return false;
    }
  }

  /**
   * 🧹 Clear all offline data (use with caution)
   */
  async clearAll() {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
    } catch (err) {
      console.error('❌ Failed to clear IndexedDB:', err);
    }
  }
}

const storageService = new StorageService();
export default storageService;
