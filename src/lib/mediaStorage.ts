/**
 * Utility for compressing images via HTML5 Canvas and storing large media in IndexedDB
 * to completely eliminate QuotaExceededError in localStorage.
 */

const DB_NAME = 'velo_media_db';
const STORE_NAME = 'media_blobs';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save large media (Blob, File, or large base64) into IndexedDB.
 */
export async function saveMediaBlob(key: string, data: Blob | string): Promise<string> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, key);
      req.onsuccess = () => resolve(key);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write error:', err);
    return typeof data === 'string' ? data : '';
  }
}

/**
 * Retrieve media from IndexedDB.
 */
export async function getMediaBlob(key: string): Promise<Blob | string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Compresses an image file or Base64 string to a sensible maximum resolution and quality.
 * Typical output size:
 * - Avatar (400x400): ~25-45 KB
 * - Banner (1200x675): ~80-160 KB
 */
export function compressImage(
  source: File | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return resolve(typeof source === 'string' ? source : '');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processImage = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scale
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(typeof source === 'string' ? source : '');
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onload = processImage;
    img.onerror = (err) => reject(err);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Retrieve media URL from IndexedDB or return direct URL/Base64.
 */
export async function getMediaUrl(keyOrUrl: string): Promise<string> {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http') || keyOrUrl.startsWith('data:') || keyOrUrl.startsWith('blob:')) {
    return keyOrUrl;
  }
  const result = await getMediaBlob(keyOrUrl);
  if (!result) return keyOrUrl;
  if (typeof result === 'string') return result;
  return URL.createObjectURL(result);
}

/**
 * Safe localStorage setter that never throws QuotaExceededError.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn(`localStorage quota exceeded for key "${key}". Trimming cached media...`);
      try {
        localStorage.removeItem('velo_pending_users');
        localStorage.setItem(key, value);
        return true;
      } catch {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            // Retain recent items and strip large base64/blobs from older items
            const trimmed = parsed.slice(0, 20).map((item: any, idx: number) => {
              if (idx > 3) {
                if (item.mediaUrl && item.mediaUrl.length > 5000) {
                  return { ...item, mediaUrl: '' };
                }
                if (item.media && Array.isArray(item.media)) {
                  return {
                    ...item,
                    media: item.media.map((m: any) =>
                      m.url && m.url.length > 5000 ? { ...m, url: '' } : m
                    ),
                  };
                }
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(trimmed));
            return true;
          }
        } catch {}
      }
    }
    return false;
  }
}

