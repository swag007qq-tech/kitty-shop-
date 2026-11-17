import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {createServer as createViteServer} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Vamp2026';

const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');

type GameCategory = 'adopt-me' | 'mm2';
type AdoptMeRarity = 'F' | 'R' | 'N' | 'M';
type CurrencyCode = 'UAH' | 'STARS' | 'ROBUX';
type ProductPrices = Partial<Record<CurrencyCode, number>>;

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

interface ProductRecord {
  id: string;
  game: GameCategory;
  title: string;
  subtitle?: string;
  rarities?: AdoptMeRarity[];
  prices: ProductPrices;
  stock: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 'am-shadow-dragon',
    game: 'adopt-me',
    title: 'Shadow Dragon',
    rarities: ['F', 'R'],
    prices: {UAH: 2150, STARS: 2750, ROBUX: 4000},
    stock: 2,
    imageUrl: '',
    createdAt: '2026-11-17T00:00:00.000Z',
    updatedAt: '2026-11-17T00:00:00.000Z',
  },
  {
    id: 'am-strawberry-bat',
    game: 'adopt-me',
    title: 'Strawberry Shortcake Bat Dragon',
    rarities: ['R'],
    prices: {UAH: 550, STARS: 700, ROBUX: 1050},
    stock: 5,
    imageUrl: '',
    createdAt: '2026-11-17T00:01:00.000Z',
    updatedAt: '2026-11-17T00:01:00.000Z',
  },
  {
    id: 'am-frost-unicorn',
    game: 'adopt-me',
    title: 'Frost Unicorn',
    rarities: ['N', 'F', 'R'],
    prices: {UAH: 380, STARS: 490, ROBUX: 720},
    stock: 7,
    imageUrl: '',
    createdAt: '2026-11-17T00:02:00.000Z',
    updatedAt: '2026-11-17T00:02:00.000Z',
  },
  {
    id: 'mm2-crystal-blade',
    game: 'mm2',
    title: 'Crystal Prism Dagger',
    prices: {UAH: 640, STARS: 820, ROBUX: 1200},
    stock: 4,
    imageUrl: '',
    createdAt: '2026-11-17T00:03:00.000Z',
    updatedAt: '2026-11-17T00:03:00.000Z',
  },
  {
    id: 'mm2-icebreaker',
    game: 'mm2',
    title: 'Icebreaker Axe',
    prices: {UAH: 750, STARS: 960, ROBUX: 1400},
    stock: 3,
    imageUrl: '',
    createdAt: '2026-11-17T00:04:00.000Z',
    updatedAt: '2026-11-17T00:04:00.000Z',
  },
  {
    id: 'mm2-pearl-revolver',
    game: 'mm2',
    title: 'Rose Pearl Revolver',
    prices: {UAH: 510, STARS: 650, ROBUX: 950},
    stock: 6,
    imageUrl: '',
    createdAt: '2026-11-17T00:05:00.000Z',
    updatedAt: '2026-11-17T00:05:00.000Z',
  },
];

function normalizeRecord(raw: Record<string, unknown>): ProductRecord {
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

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, {recursive: true});
  }
  if (!fs.existsSync(CATALOG_FILE)) {
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(INITIAL_PRODUCTS, null, 2), 'utf-8');
  }
}

function readCatalog(): ProductRecord[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_PRODUCTS;
    return parsed.map((item) => normalizeRecord(item as Record<string, unknown>));
  } catch {
    return INITIAL_PRODUCTS;
  }
}

function writeCatalog(products: ProductRecord[]): void {
  ensureStorage();
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

function isAdminAuthorized(req: express.Request): boolean {
  const headerPassword = req.header('x-admin-password');
  return headerPassword === ADMIN_PASSWORD;
}

async function startServer(): Promise<void> {
  ensureStorage();

  const app = express();
  app.use(express.json({limit: '15mb'}));

  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/products', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const products = readCatalog();
    res.json({products});
  });

  app.post('/api/admin/login', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password === ADMIN_PASSWORD) {
      res.json({ok: true});
      return;
    }
    res.status(401).json({ok: false, error: 'Неверный пароль'});
  });

  app.post('/api/upload', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({error: 'Требуется авторизация администратора'});
      return;
    }

    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({error: 'Некорректный формат изображения'});
      return;
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const fileName = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, buffer);
    res.json({url: `/uploads/${fileName}`});
  });

  app.post('/api/products', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({error: 'Требуется авторизация администратора'});
      return;
    }

    const game: GameCategory = req.body?.game === 'mm2' ? 'mm2' : 'adopt-me';
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const subtitle = typeof req.body?.subtitle === 'string' ? req.body.subtitle.trim() : '';
    const rarities = game === 'adopt-me' ? sanitizeRarities(req.body?.rarities) : [];
    const prices = sanitizePrices(req.body?.prices);
    const stock = Math.max(0, Math.floor(Number(req.body?.stock)));
    const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';

    if (!title || Number.isNaN(stock)) {
      res.status(400).json({error: 'Проверьте название и количество в наличии'});
      return;
    }

    if (Object.keys(prices).length === 0) {
      res.status(400).json({error: 'Укажите цену хотя бы в одной валюте'});
      return;
    }

    if (game === 'adopt-me' && rarities.length === 0) {
      res.status(400).json({error: 'Укажите редкость товара (M, N, F, R)'});
      return;
    }

    const now = new Date().toISOString();
    const product: ProductRecord = {
      id: `${game}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      game,
      title,
      subtitle: game === 'mm2' ? subtitle || undefined : undefined,
      rarities: game === 'adopt-me' ? rarities : undefined,
      prices,
      stock,
      imageUrl,
      createdAt: now,
      updatedAt: now,
    };

    const products = readCatalog();
    products.unshift(product);
    writeCatalog(products);

    res.status(201).json({product});
  });

  app.put('/api/products/:id', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({error: 'Требуется авторизация администратора'});
      return;
    }

    const {id} = req.params;
    const products = readCatalog();
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      res.status(404).json({error: 'Товар не найден'});
      return;
    }

    const existing = products[index];
    const nextGame: GameCategory =
      req.body?.game === 'adopt-me' || req.body?.game === 'mm2' ? req.body.game : existing.game;
    const nextTitle =
      typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : existing.title;
    const nextSubtitle =
      nextGame === 'mm2'
        ? typeof req.body?.subtitle === 'string'
          ? req.body.subtitle.trim() || undefined
          : existing.subtitle
        : undefined;
    const nextRarities =
      nextGame === 'adopt-me'
        ? req.body?.rarities !== undefined
          ? sanitizeRarities(req.body.rarities)
          : existing.rarities || []
        : undefined;
    const nextPrices =
      req.body?.prices !== undefined
        ? sanitizePrices(req.body?.prices)
        : existing.prices;
    const nextStock =
      req.body?.stock !== undefined && !Number.isNaN(Number(req.body.stock))
        ? Math.max(0, Math.floor(Number(req.body.stock)))
        : existing.stock;
    const nextImageUrl =
      typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : existing.imageUrl;

    if (Object.keys(nextPrices).length === 0) {
      res.status(400).json({error: 'Укажите цену хотя бы в одной валюте'});
      return;
    }

    if (
      nextGame === 'adopt-me' &&
      req.body?.rarities !== undefined &&
      (!nextRarities || nextRarities.length === 0)
    ) {
      res.status(400).json({error: 'Укажите редкость товара (M, N, F, R)'});
      return;
    }

    const updated: ProductRecord = {
      ...existing,
      game: nextGame,
      title: nextTitle,
      subtitle: nextSubtitle,
      rarities: nextRarities,
      prices: nextPrices,
      stock: nextStock,
      imageUrl: nextImageUrl,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;
    writeCatalog(products);

    res.json({product: updated});
  });

  app.delete('/api/products/:id', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({error: 'Требуется авторизация администратора'});
      return;
    }

    const {id} = req.params;
    const products = readCatalog();
    const filtered = products.filter((p) => p.id !== id);

    if (filtered.length === products.length) {
      res.status(404).json({error: 'Товар не найден'});
      return;
    }

    writeCatalog(filtered);
    res.json({ok: true});
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KITTY SHOP server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
