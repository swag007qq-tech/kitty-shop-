import initialCatalogRaw from '../../data/catalog.json';
import {AdoptMeRarity, CurrencyCode, GameCategory, Product, ProductPrices} from '../types';

export const ADMIN_PASSWORD = 'Vamp2026';

const CATALOG_OVERRIDES_KEY = 'kitty_shop_catalog_overrides_v1';
const LEGACY_CACHE_KEY = 'kitty_shop_products_cache_v1';

const VALID_RARITIES: AdoptMeRarity[] = ['M', 'N', 'F', 'R'];
const VALID_CURRENCIES: CurrencyCode[] = ['UAH', 'STARS', 'ROBUX'];

interface StoredCatalogOverrides {
  baseHash: string;
  products: Product[];
}

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

export function normalizeProduct(raw: Record<string, unknown>): Product {
  const game: GameCategory = raw.game === 'mm2' ? 'mm2' : 'adopt-me';
  return {
    id: String(raw.id || `${game}-${Date.now()}`),
    game,
    title: String(raw.title || ''),
    subtitle: typeof raw.subtitle === 'string' && raw.subtitle ? raw.subtitle : undefined,
    rarities: game === 'adopt-me' ? sanitizeRarities(raw.rarities) : undefined,
    prices: sanitizePrices(raw.prices),
    stock: Math.max(0, Math.floor(Number(raw.stock) || 0)),
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  };
}

function normalizeCatalog(input: unknown): Product[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map(normalizeProduct);
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export const INITIAL_PRODUCTS: Product[] = normalizeCatalog(initialCatalogRaw);
const INITIAL_CATALOG_HASH = hashString(JSON.stringify(INITIAL_PRODUCTS));

export function loadCatalogState(): {products: Product[]; hasLocalOverrides: boolean} {
  try {
    localStorage.removeItem(LEGACY_CACHE_KEY);
    const raw = localStorage.getItem(CATALOG_OVERRIDES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredCatalogOverrides> | Product[];
      if (
        parsed &&
        !Array.isArray(parsed) &&
        parsed.baseHash === INITIAL_CATALOG_HASH &&
        Array.isArray(parsed.products)
      ) {
        return {
          products: normalizeCatalog(parsed.products),
          hasLocalOverrides: true,
        };
      }
      // Bundled data/catalog.json changed on deploy — discard outdated local overrides
      localStorage.removeItem(CATALOG_OVERRIDES_KEY);
    }
  } catch {
    // Ignore storage read errors
  }

  return {
    products: INITIAL_PRODUCTS,
    hasLocalOverrides: false,
  };
}

export function saveCatalogOverrides(products: Product[]): void {
  const payload: StoredCatalogOverrides = {
    baseHash: INITIAL_CATALOG_HASH,
    products: normalizeCatalog(products),
  };
  localStorage.setItem(CATALOG_OVERRIDES_KEY, JSON.stringify(payload));
}

export function clearCatalogOverrides(): Product[] {
  try {
    localStorage.removeItem(CATALOG_OVERRIDES_KEY);
  } catch {
    // Ignore storage error
  }
  return INITIAL_PRODUCTS;
}

export function downloadCatalogJson(products: Product[]): void {
  const cleanList = normalizeCatalog(products);
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

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      if (!rawDataUrl) {
        reject(new Error('Пустой файл изображения'));
        return;
      }

      // Compress larger images so localStorage & catalog.json stay lightweight
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        if (scale === 1 && file.size <= 160 * 1024) {
          resolve(rawDataUrl);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/webp', 0.82);
        resolve(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
