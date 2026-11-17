import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {getDownloadURL, ref, uploadBytes} from 'firebase/storage';
import initialCatalogRaw from '../../data/catalog.json';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
  storage,
} from '../firebase';
import {AdoptMeRarity, CurrencyCode, GameCategory, Product, ProductPrices} from '../types';

export const ADMIN_PASSWORD = 'Vamp2026';

const VALID_RARITIES: AdoptMeRarity[] = ['M', 'N', 'F', 'R'];
const VALID_CURRENCIES: CurrencyCode[] = ['UAH', 'STARS', 'ROBUX'];

function sanitizeRarities(input: unknown): AdoptMeRarity[] {
  if (!Array.isArray(input)) return [];
  const filtered = input.filter(
    (item): item is AdoptMeRarity =>
      typeof item === 'string' && VALID_RARITIES.includes(item as AdoptMeRarity),
  );
  return Array.from(new Set(filtered));
}

function sanitizePrices(input: unknown): ProductPrices {
  const result: ProductPrices = {};
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    for (const code of VALID_CURRENCIES) {
      const raw = obj[code];
      if (raw !== undefined && raw !== null && raw !== '') {
        const num = Number(raw);
        if (!Number.isNaN(num) && num >= 0) {
          result[code] = Math.round(num);
        }
      }
    }
  }
  return result;
}

function toIsoTimestamp(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (
    val &&
    typeof val === 'object' &&
    'toDate' in val &&
    typeof (val as {toDate: () => Date}).toDate === 'function'
  ) {
    return (val as {toDate: () => Date}).toDate().toISOString();
  }
  if (typeof val === 'string' && val) return val;
  return new Date().toISOString();
}

export function normalizeProduct(raw: Record<string, unknown>, fallbackId?: string): Product {
  const game: GameCategory = raw.game === 'mm2' ? 'mm2' : 'adopt-me';
  return {
    id: String(raw.id || fallbackId || `${game}-${Date.now()}`),
    game,
    title: String(raw.title || '').slice(0, 140),
    subtitle:
      game === 'mm2' && typeof raw.subtitle === 'string' && raw.subtitle.trim()
        ? raw.subtitle.trim().slice(0, 200)
        : undefined,
    rarities: game === 'adopt-me' ? sanitizeRarities(raw.rarities) : undefined,
    prices: sanitizePrices(raw.prices),
    stock: Math.min(100000, Math.max(0, Math.floor(Number(raw.stock) || 0))),
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl.slice(0, 2048) : '',
    createdAt: toIsoTimestamp(raw.createdAt),
    updatedAt: toIsoTimestamp(raw.updatedAt),
  };
}

function normalizeCatalog(input: unknown): Product[] {
  if (!Array.isArray(input)) return [];
  return (input as unknown[])
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => normalizeProduct(item));
}

export const INITIAL_PRODUCTS: Product[] = normalizeCatalog(initialCatalogRaw);

export function subscribeToCatalog(
  onUpdate: (products: Product[], isInitialized: boolean) => void,
  onError?: (err: Error) => void,
): () => void {
  let cloudProducts: Product[] = [];
  let hasProductsSnapshot = false;
  let hasMetaSnapshot = false;
  let isMetaInitialized = false;

  const emit = () => {
    if (!hasProductsSnapshot || !hasMetaSnapshot) return;
    if (!isMetaInitialized && cloudProducts.length === 0) {
      onUpdate(INITIAL_PRODUCTS, false);
      return;
    }
    const sorted = [...cloudProducts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    onUpdate(sorted, isMetaInitialized);
  };

  const unsubProducts = onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      hasProductsSnapshot = true;
      cloudProducts = snapshot.docs.map((d) =>
        normalizeProduct(d.data() as Record<string, unknown>, d.id),
      );
      emit();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    },
  );

  const unsubMeta = onSnapshot(
    doc(db, 'catalog_meta', 'state'),
    (snap) => {
      hasMetaSnapshot = true;
      isMetaInitialized = snap.exists() && Boolean(snap.data()?.initialized);
      emit();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'catalog_meta/state');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    },
  );

  return () => {
    unsubProducts();
    unsubMeta();
  };
}

export async function checkIsAdminUser(uid: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function ensureCloudCatalogSeeded(): Promise<void> {
  const metaRef = doc(db, 'catalog_meta', 'state');
  try {
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists() && metaSnap.data()?.initialized) {
      return;
    }

    const existingSnap = await getDocs(collection(db, 'products'));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));

    const batch = writeBatch(db);
    if (existingSnap.empty) {
      for (const item of INITIAL_PRODUCTS) {
        const safeId = item.id.replace(/[^a-zA-Z0-9_-]/g, '-');
        if (existingIds.has(safeId)) continue;
        const docData: Record<string, unknown> = {
          id: safeId,
          game: item.game,
          title: item.title,
          prices: item.prices,
          stock: item.stock,
          imageUrl: (item.imageUrl || '').slice(0, 2048),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (item.game === 'adopt-me') {
          docData.rarities = item.rarities && item.rarities.length > 0 ? item.rarities : ['R'];
        } else if (item.subtitle) {
          docData.subtitle = item.subtitle;
        }
        batch.set(doc(db, 'products', safeId), docData);
      }
    }
    batch.set(metaRef, {
      initialized: true,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'catalog_meta/state');
  }
}

export interface SaveProductInput {
  id?: string | null;
  game: GameCategory;
  title: string;
  subtitle?: string;
  rarities?: AdoptMeRarity[];
  prices: ProductPrices;
  stock: number;
  imageUrl: string;
}

export async function createProductInCloud(input: SaveProductInput): Promise<string> {
  await ensureCloudCatalogSeeded();
  const id =
    input.id || `${input.game}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const path = `products/${id}`;
  const docData: Record<string, unknown> = {
    id,
    game: input.game,
    title: input.title.trim().slice(0, 140),
    prices: sanitizePrices(input.prices),
    stock: Math.min(100000, Math.max(0, Math.floor(input.stock))),
    imageUrl: input.imageUrl.trim().slice(0, 2048),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.game === 'adopt-me') {
    docData.rarities = sanitizeRarities(input.rarities);
  } else if (input.subtitle && input.subtitle.trim()) {
    docData.subtitle = input.subtitle.trim().slice(0, 200);
  }

  try {
    await setDoc(doc(db, 'products', id), docData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProductInCloud(
  productId: string,
  input: SaveProductInput,
): Promise<void> {
  await ensureCloudCatalogSeeded();
  const path = `products/${productId}`;
  const updateData: Record<string, unknown> = {
    game: input.game,
    title: input.title.trim().slice(0, 140),
    prices: sanitizePrices(input.prices),
    stock: Math.min(100000, Math.max(0, Math.floor(input.stock))),
    imageUrl: input.imageUrl.trim().slice(0, 2048),
    updatedAt: serverTimestamp(),
  };

  if (input.game === 'adopt-me') {
    updateData.rarities = sanitizeRarities(input.rarities);
    updateData.subtitle = deleteField();
  } else {
    updateData.rarities = deleteField();
    if (input.subtitle && input.subtitle.trim()) {
      updateData.subtitle = input.subtitle.trim().slice(0, 200);
    } else {
      updateData.subtitle = deleteField();
    }
  }

  try {
    await updateDoc(doc(db, 'products', productId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateStockInCloud(
  productId: string,
  nextStock: number,
): Promise<void> {
  await ensureCloudCatalogSeeded();
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), {
      stock: Math.min(100000, Math.max(0, Math.floor(nextStock))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductInCloud(productId: string): Promise<void> {
  await ensureCloudCatalogSeeded();
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function compressImage(
  file: File,
  maxSide: number,
  quality: number,
): Promise<{blob: Blob; dataUrl: string; mimeType: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      if (!rawDataUrl) {
        reject(new Error('Пустой файл изображения'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Некорректный формат изображения'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Не удалось обработать изображение'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', quality);
        const actualMime = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
        const finalDataUrl =
          actualMime === 'image/webp' ? dataUrl : canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Не удалось подготовить файл к загрузке'));
              return;
            }
            resolve({blob, dataUrl: finalDataUrl, mimeType: actualMime});
          },
          actualMime,
          quality,
        );
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadProductPhotoToCloud(file: File): Promise<string> {
  const imageId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const prepared = await compressImage(file, 960, 0.85);
  const ext = prepared.mimeType === 'image/webp' ? 'webp' : 'jpg';

  // Primary: Firebase Cloud Storage
  try {
    const storageRef = ref(storage, `products/${imageId}.${ext}`);
    const uploadPromise = uploadBytes(storageRef, prepared.blob, {
      contentType: prepared.mimeType,
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error('storage-timeout')), 3500),
    );
    await Promise.race([uploadPromise, timeoutPromise]);
    return await getDownloadURL(storageRef);
  } catch {
    // Fallback: Firestore cloud product_images collection
  }

  let fallbackPayload = prepared;
  if (fallbackPayload.dataUrl.length > 650000) {
    fallbackPayload = await compressImage(file, 640, 0.72);
  }
  if (fallbackPayload.dataUrl.length > 780000) {
    fallbackPayload = await compressImage(file, 480, 0.62);
  }
  if (fallbackPayload.dataUrl.length > 795000) {
    throw new Error('Изображение слишком тяжёлое. Выберите файл поменьше.');
  }

  const imagePath = `product_images/${imageId}`;
  try {
    await setDoc(doc(db, 'product_images', imageId), {
      id: imageId,
      dataUrl: fallbackPayload.dataUrl,
      mimeType: fallbackPayload.mimeType,
      createdAt: serverTimestamp(),
    });
    return `firestore-img://${imageId}`;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, imagePath);
  }
}

const imageMemoryCache = new Map<string, string>();

export async function resolveCloudImageSrc(src: string): Promise<string> {
  if (!src.startsWith('firestore-img://')) return src;
  const imageId = src.slice('firestore-img://'.length).trim();
  if (!imageId) return '';
  const cached = imageMemoryCache.get(imageId);
  if (cached) return cached;

  try {
    const snap = await getDoc(doc(db, 'product_images', imageId));
    if (snap.exists()) {
      const dataUrl = String(snap.data()?.dataUrl || '');
      if (dataUrl) {
        imageMemoryCache.set(imageId, dataUrl);
        return dataUrl;
      }
    }
  } catch (error) {
    console.error('Failed to resolve cloud image:', error);
  }
  return '';
}

export function downloadCatalogJson(products: Product[]): void {
  const cleanList = normalizeCatalog(products).map((p) => ({
    id: p.id,
    game: p.game,
    title: p.title,
    ...(p.subtitle ? {subtitle: p.subtitle} : {}),
    ...(p.rarities ? {rarities: p.rarities} : {}),
    prices: p.prices,
    stock: p.stock,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
  const json = JSON.stringify(cleanList, null, 2);
  const blob = new Blob([json], {type: 'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'catalog.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
