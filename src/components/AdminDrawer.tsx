import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Upload,
  LogOut,
  Minus,
  Check,
  Download,
  RotateCcw,
  Cloud,
} from 'lucide-react';
import {signInWithPopup, signOut} from 'firebase/auth';
import {
  AdoptMeRarity,
  CurrencyCode,
  GameCategory,
  Product,
  ProductPrices,
} from '../types';
import {ProductImage} from './ProductImage';
import {
  CURRENCY_LIST,
  formatAmount,
  getAvailablePriceEntries,
  getProductPrice,
} from '../utils/currency';
import {ADOPT_ME_RARITIES, getRarityMeta, sortRarities} from '../utils/rarities';
import {auth, BOOTSTRAPPED_ADMIN_EMAIL, googleProvider} from '../firebase';
import {
  checkIsAdminUser,
  createProductInCloud,
  deleteProductInCloud,
  downloadCatalogJson,
  ensureCloudCatalogSeeded,
  readImageAsDataUrl,
  updateProductInCloud,
  updateStockInCloud,
  uploadProductPhotoToCloud,
} from '../utils/catalogCloud';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialGame: GameCategory;
  currency: CurrencyCode;
  products: Product[];
  hasLocalOverrides: boolean;
  isCloudAdmin: boolean;
  onCatalogUpdated: (nextProducts: Product[]) => void;
  onResetCatalog: () => void;
  onCloudStatusChange: (isConnected: boolean) => void;
  onLogout: () => void;
}

interface FormState {
  id: string | null;
  game: GameCategory;
  title: string;
  subtitle: string;
  rarities: AdoptMeRarity[];
  prices: Record<CurrencyCode, string>;
  stock: string;
  imageUrl: string;
}

const EMPTY_PRICES = (): Record<CurrencyCode, string> => ({
  UAH: '',
  STARS: '',
  ROBUX: '',
});

const EMPTY_FORM = (game: GameCategory): FormState => ({
  id: null,
  game,
  title: '',
  subtitle: '',
  rarities: [],
  prices: EMPTY_PRICES(),
  stock: '1',
  imageUrl: '',
});

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  onClose,
  initialGame,
  products,
  hasLocalOverrides,
  isCloudAdmin,
  onCatalogUpdated,
  onResetCatalog,
  onCloudStatusChange,
  onLogout,
}) => {
  const [managedGame, setManagedGame] = useState<GameCategory>(initialGame);
  const [form, setForm] = useState<FormState>(() => EMPTY_FORM(initialGame));
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingCloud, setIsConnectingCloud] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setManagedGame(initialGame);
      setForm(EMPTY_FORM(initialGame));
      setIsFormVisible(false);
      setError('');
      setStatusMessage('');
      setConfirmDeleteId(null);
    }
  }, [isOpen, initialGame]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const gameProducts = products.filter((p) => p.game === managedGame);
  const adoptMeCount = products.filter((p) => p.game === 'adopt-me').length;
  const mm2Count = products.filter((p) => p.game === 'mm2').length;

  const handleSwitchManagedGame = (nextGame: GameCategory) => {
    setManagedGame(nextGame);
    setConfirmDeleteId(null);
    setError('');
    setStatusMessage('');
    if (!form.id) {
      setForm((prev) => ({...prev, game: nextGame}));
    }
  };

  const openCreateForm = () => {
    setForm(EMPTY_FORM(managedGame));
    setError('');
    setStatusMessage('');
    setIsFormVisible(true);
  };

  const openEditForm = (product: Product) => {
    const nextPrices = EMPTY_PRICES();
    for (const c of CURRENCY_LIST) {
      const val = getProductPrice(product, c.code);
      if (val !== undefined) {
        nextPrices[c.code] = String(val);
      }
    }

    setForm({
      id: product.id,
      game: product.game,
      title: product.title,
      subtitle: product.subtitle || '',
      rarities: product.rarities ? sortRarities(product.rarities) : [],
      prices: nextPrices,
      stock: String(product.stock),
      imageUrl: product.imageUrl,
    });
    setError('');
    setStatusMessage('');
    setIsFormVisible(true);
  };

  const toggleRarity = (code: AdoptMeRarity) => {
    setForm((prev) => {
      const exists = prev.rarities.includes(code);
      const next = exists
        ? prev.rarities.filter((r) => r !== code)
        : sortRarities([...prev.rarities, code]);
      return {...prev, rarities: next};
    });
  };

  const handlePriceInputChange = (code: CurrencyCode, value: string) => {
    setForm((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [code]: value,
      },
    }));
  };

  const handleConnectCloudSync = async () => {
    setIsConnectingCloud(true);
    setError('');
    setStatusMessage('');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const allowed = await checkIsAdminUser(cred.user.uid, cred.user.email);
      if (!allowed || !cred.user.emailVerified) {
        await signOut(auth);
        setError(
          `Этот Google-аккаунт не имеет прав администратора (${BOOTSTRAPPED_ADMIN_EMAIL}).`,
        );
        return;
      }
      await ensureCloudCatalogSeeded(products);
      onCloudStatusChange(true);
      setStatusMessage('Облачная синхронизация Firebase подключена!');
    } catch {
      setError('Не удалось подключить облачную синхронизацию Firebase.');
    } finally {
      setIsConnectingCloud(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Выберите файл изображения (PNG, JPG, WEBP)');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const url = isCloudAdmin
        ? await uploadProductPhotoToCloud(file)
        : await readImageAsDataUrl(file);
      setForm((prev) => ({...prev, imageUrl: url}));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обработки изображения');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    const stockNum = Number(form.stock);

    if (!form.title.trim()) {
      setError('Укажите название товара');
      return;
    }
    if (form.game === 'adopt-me' && form.rarities.length === 0) {
      setError('Выберите редкость товара (один или несколько значков: M, N, F, R)');
      return;
    }

    const parsedPrices: ProductPrices = {};
    for (const c of CURRENCY_LIST) {
      const raw = form.prices[c.code].trim();
      if (raw !== '') {
        const num = Number(raw);
        if (Number.isNaN(num) || num < 0) {
          setError(`Некорректная цена в валюте «${c.label}»`);
          return;
        }
        parsedPrices[c.code] = Math.round(num);
      }
    }

    if (Object.keys(parsedPrices).length === 0) {
      setError('Укажите стоимость хотя бы в одной валюте');
      return;
    }

    if (form.stock.trim() === '' || Number.isNaN(stockNum) || stockNum < 0) {
      setError('Укажите корректное количество в наличии');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const isEdit = Boolean(form.id);
      const existing = isEdit ? products.find((p) => p.id === form.id) : undefined;
      const productId =
        existing?.id ||
        `${form.game}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const savedProduct: Product = {
        id: productId,
        game: form.game,
        title: form.title.trim(),
        subtitle: form.game === 'mm2' ? form.subtitle.trim() || undefined : undefined,
        rarities: form.game === 'adopt-me' ? sortRarities(form.rarities) : undefined,
        prices: parsedPrices,
        stock: Math.floor(stockNum),
        imageUrl: form.imageUrl.trim(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      const nextList = isEdit
        ? products.map((p) => (p.id === savedProduct.id ? savedProduct : p))
        : [savedProduct, ...products];

      try {
        onCatalogUpdated(nextList);
      } catch {
        setError(
          'Не удалось сохранить в localStorage (превышен лимит памяти браузера — используйте ссылку на фото).',
        );
        setIsSaving(false);
        return;
      }

      if (isCloudAdmin) {
        const cloudPayload = {
          id: productId,
          game: form.game,
          title: savedProduct.title,
          subtitle: savedProduct.subtitle,
          rarities: savedProduct.rarities,
          prices: parsedPrices,
          stock: savedProduct.stock,
          imageUrl: savedProduct.imageUrl,
        };
        if (isEdit) {
          await updateProductInCloud(productId, cloudPayload);
        } else {
          await createProductInCloud(cloudPayload);
        }
      }

      setManagedGame(savedProduct.game);
      setIsFormVisible(false);
      setForm(EMPTY_FORM(savedProduct.game));
      setStatusMessage(
        isCloudAdmin
          ? isEdit
            ? 'Товар обновлён в облачной базе и localStorage'
            : 'Товар добавлен в облачную базу и localStorage'
          : isEdit
            ? 'Товар обновлён и сохранён в localStorage'
            : 'Товар добавлен и сохранён в localStorage',
      );
    } catch {
      setError('Товар сохранён локально, но не удалось синхронизировать с облаком');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStock = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stock + delta);
    const nextList = products.map((p) =>
      p.id === product.id
        ? {...p, stock: nextStock, updatedAt: new Date().toISOString()}
        : p,
    );
    try {
      onCatalogUpdated(nextList);
      if (isCloudAdmin) {
        await updateStockInCloud(product.id, nextStock);
      }
      setStatusMessage('Наличие обновлено');
    } catch {
      setError('Не удалось обновить наличие');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const nextList = products.filter((p) => p.id !== productId);
    try {
      onCatalogUpdated(nextList);
      if (isCloudAdmin) {
        await deleteProductInCloud(productId);
      }
      setConfirmDeleteId(null);
      setStatusMessage('Товар удалён');
      if (form.id === productId) {
        setIsFormVisible(false);
        setForm(EMPTY_FORM(managedGame));
      }
    } catch {
      setError('Не удалось удалить товар');
    }
  };

  const handleDownloadCatalog = () => {
    downloadCatalogJson(products);
    setError('');
    setStatusMessage(
      'Файл catalog.json скачан. Замените им data/catalog.json и обновите деплой на Vercel, чтобы изменения увидели все пользователи.',
    );
  };

  const handleResetToBundled = () => {
    onResetCatalog();
    setIsFormVisible(false);
    setForm(EMPTY_FORM(managedGame));
    setConfirmDeleteId(null);
    setError('');
    setStatusMessage('Локальные изменения сброшены к версии из data/catalog.json');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Панель администратора"
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px]"
          />

          <motion.aside
            initial={{x: '100%'}}
            animate={{x: 0}}
            exit={{x: '100%'}}
            transition={{duration: 0.3, ease: [0.16, 1, 0.3, 1]}}
            className="relative z-10 w-full max-w-2xl bg-white h-full flex flex-col border-l border-black/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-black/[0.06] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#181617]">
                  Панель администратора
                </h2>
                <p className="text-xs text-[#7D7478] mt-0.5 leading-relaxed">
                  Изменения сохраняются в localStorage. Нажмите{' '}
                  <span className="font-semibold text-[#181617]">«Скачать catalog.json»</span>, чтобы заменить{' '}
                  <span className="font-mono text-[#181617]">data/catalog.json</span> для всех пользователей.
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#6E676B] hover:text-[#181617] border border-black/[0.08] rounded-lg hover:bg-[#FAF8F9] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть панель администратора"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6E676B] hover:text-[#181617] hover:bg-[#FAF8F9] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Export & Cloud Sync Bar */}
            <div className="px-4 sm:px-6 py-3 bg-[#FAF0F4]/70 border-b border-[#ECCAD6]/75 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleDownloadCatalog}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#181617] hover:bg-[#2E2A2C] rounded-xl transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать catalog.json</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {!isCloudAdmin ? (
                  <button
                    type="button"
                    disabled={isConnectingCloud}
                    onClick={handleConnectCloudSync}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4B4448] bg-white border border-black/[0.1] rounded-xl hover:bg-[#FAF8F9] disabled:opacity-60 transition-colors whitespace-nowrap"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{isConnectingCloud ? 'Подключение...' : 'Облако Firebase'}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#2E6F40] bg-[#ECF8EF] border border-[#BEE3C7] rounded-xl whitespace-nowrap">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Облако подключено</span>
                  </span>
                )}

                {hasLocalOverrides && (
                  <button
                    type="button"
                    onClick={handleResetToBundled}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7D2443] bg-white border border-[#ECCAD6] rounded-xl hover:bg-[#FAF0F4] transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Сбросить</span>
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Tabs + Add Button */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF8F9] border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center p-1 bg-white border border-black/[0.06] rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSwitchManagedGame('adopt-me')}
                  className={`px-3.5 sm:px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    managedGame === 'adopt-me'
                      ? 'bg-[#181617] text-white'
                      : 'text-[#6E676B] hover:text-[#181617]'
                  }`}
                >
                  Adopt Me ({adoptMeCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchManagedGame('mm2')}
                  className={`px-3.5 sm:px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    managedGame === 'mm2'
                      ? 'bg-[#181617] text-white'
                      : 'text-[#6E676B] hover:text-[#181617]'
                  }`}
                >
                  MM2 ({mm2Count})
                </button>
              </div>

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-medium text-white bg-[#C85A7C] hover:bg-[#B44A6B] rounded-xl transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить товар в {managedGame === 'adopt-me' ? 'Adopt Me' : 'MM2'}</span>
              </button>
            </div>

            {/* Main Scroll Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
              {statusMessage && (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-medium text-[#181617] bg-[#FAF0F4] border border-[#ECCAD6] rounded-xl">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#9E3557] shrink-0" />
                    <span>{statusMessage}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusMessage('')}
                    className="text-[#7D7478] hover:text-[#181617] shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {error && (
                <div className="px-4 py-2.5 text-xs font-medium text-[#9E3557] bg-[#FAF0F4] border border-[#ECCAD6] rounded-xl">
                  {error}
                </div>
              )}

              {/* Create / Edit Form */}
              {isFormVisible && (
                <form
                  onSubmit={handleSaveProduct}
                  className="bg-[#FAF8F9] border border-black/[0.08] rounded-2xl p-4 sm:p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-semibold text-[#181617]">
                      {form.id ? 'Редактирование товара' : 'Новый товар'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormVisible(false);
                        setForm(EMPTY_FORM(managedGame));
                      }}
                      className="text-xs text-[#6E676B] hover:text-[#181617]"
                    >
                      Свернуть
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4B4448] mb-1.5">
                        Каталог игры
                      </label>
                      <select
                        value={form.game}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            game: e.target.value as GameCategory,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/[0.09] rounded-xl text-[#181617] focus:outline-none focus:border-[#C85A7C]"
                      >
                        <option value="adopt-me">Adopt Me</option>
                        <option value="mm2">MM2</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4B4448] mb-1.5">
                        Название товара
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({...prev, title: e.target.value}))}
                        placeholder="Например: Корова"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/[0.09] rounded-xl text-[#181617] focus:outline-none focus:border-[#C85A7C]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4B4448] mb-1.5">
                        В наличии (шт.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.stock}
                        onChange={(e) => setForm((prev) => ({...prev, stock: e.target.value}))}
                        placeholder="5"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/[0.09] rounded-xl text-[#181617] tabular-nums focus:outline-none focus:border-[#C85A7C]"
                      />
                    </div>
                  </div>

                  {/* Multi-Currency Prices Grid */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="block text-xs font-medium text-[#4B4448]">
                        Стоимость по валютам
                      </label>
                      <span className="text-[11px] text-[#7D7478]">
                        Пустые поля означают, что в этой валюте товар не продаётся
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {CURRENCY_LIST.map((curr) => (
                        <div key={curr.code}>
                          <label className="block text-[11px] text-[#6E676B] mb-1">
                            {curr.label}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={form.prices[curr.code]}
                              onChange={(e) =>
                                handlePriceInputChange(curr.code, e.target.value)
                              }
                              placeholder="Нет"
                              className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-black/[0.09] rounded-xl text-[#181617] placeholder:text-[#B3AAAE] tabular-nums focus:outline-none focus:border-[#C85A7C]"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#7D7478] pointer-events-none">
                              {curr.shortLabel}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adopt Me Rarity Picker vs MM2 optional subtitle */}
                  {form.game === 'adopt-me' ? (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label className="block text-xs font-medium text-[#4B4448]">
                          Редкость товара (можно выбрать несколько)
                        </label>
                        {form.rarities.length > 0 && (
                          <span className="text-[11px] font-medium text-[#9E3557]">
                            Выбрано: {form.rarities.join('')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {ADOPT_ME_RARITIES.map((badge) => {
                          const isSelected = form.rarities.includes(badge.code);
                          return (
                            <button
                              key={badge.code}
                              type="button"
                              onClick={() => toggleRarity(badge.code)}
                              aria-pressed={isSelected}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150 ${
                                isSelected
                                  ? 'bg-white border-[#181617] ring-1 ring-[#181617] shadow-xs'
                                  : 'bg-white/70 border-black/[0.09] hover:bg-white hover:border-black/25'
                              }`}
                            >
                              <img
                                src={badge.iconSrc}
                                alt={badge.label}
                                className="w-7 h-7 object-contain shrink-0"
                              />
                              <span className="text-xs font-medium text-[#181617] truncate">
                                {badge.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-[#4B4448] mb-1.5">
                        Короткое описание (необязательно)
                      </label>
                      <input
                        type="text"
                        value={form.subtitle}
                        onChange={(e) => setForm((prev) => ({...prev, subtitle: e.target.value}))}
                        placeholder="Например: Godly · Сет"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/[0.09] rounded-xl text-[#181617] focus:outline-none focus:border-[#C85A7C]"
                      />
                    </div>
                  )}

                  {/* Photo Upload + URL */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-medium text-[#4B4448]">
                      Фотография товара (необязательно)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      {form.imageUrl && (
                        <div className="w-28 h-21 rounded-xl overflow-hidden bg-white border border-black/[0.08] shrink-0">
                          <ProductImage
                            src={form.imageUrl}
                            alt={form.title || 'Превью товара'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 w-full space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                            id="admin-photo-upload"
                          />
                          <label
                            htmlFor="admin-photo-upload"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#181617] bg-white border border-black/[0.1] rounded-lg hover:bg-[#F3F0F2] cursor-pointer transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploading ? 'Обработка...' : 'Загрузить фото'}</span>
                          </label>
                          {form.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setForm((prev) => ({...prev, imageUrl: ''}))}
                              className="text-xs text-[#7D7478] hover:text-[#9E3557]"
                            >
                              Убрать фото
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={form.imageUrl}
                          onChange={(e) =>
                            setForm((prev) => ({...prev, imageUrl: e.target.value}))
                          }
                          placeholder="Или вставьте ссылку на изображение"
                          className="w-full px-3 py-2 text-xs bg-white border border-black/[0.09] rounded-lg text-[#181617] placeholder:text-[#9D9498] focus:outline-none focus:border-[#C85A7C]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormVisible(false);
                        setForm(EMPTY_FORM(managedGame));
                      }}
                      className="px-4 py-2.5 sm:py-2 text-xs font-medium text-[#4B4448] bg-white border border-black/[0.09] rounded-xl hover:bg-[#F3F0F2] transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || isUploading}
                      className="px-5 py-2.5 sm:py-2 text-xs font-medium text-white bg-[#181617] rounded-xl hover:bg-[#2E2A2C] disabled:opacity-60 transition-colors"
                    >
                      {isSaving
                        ? 'Сохранение...'
                        : form.id
                          ? 'Сохранить изменения'
                          : 'Добавить товар'}
                    </button>
                  </div>
                </form>
              )}

              {/* Product List for Active Managed Game */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#181617]">
                    Товары каталога {managedGame === 'adopt-me' ? 'Adopt Me' : 'MM2'}
                  </h3>
                  <span className="text-xs text-[#7D7478] tabular-nums">
                    Всего: {gameProducts.length}
                  </span>
                </div>

                {gameProducts.length === 0 ? (
                  <div className="py-12 px-5 text-center bg-[#FAF8F9] border border-black/[0.06] rounded-2xl">
                    <p className="text-sm text-[#6E676B]">
                      В каталоге {managedGame === 'adopt-me' ? 'Adopt Me' : 'MM2'} пока нет товаров.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateForm}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#181617] rounded-lg hover:bg-[#2E2A2C] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Добавить первый товар</span>
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-black/[0.06] border border-black/[0.07] rounded-2xl bg-white overflow-hidden">
                    {gameProducts.map((item) => {
                      const itemRarities =
                        item.game === 'adopt-me' && item.rarities?.length
                          ? sortRarities(item.rarities)
                          : [];
                      const priceEntries = getAvailablePriceEntries(item);

                      return (
                        <li key={item.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {item.imageUrl && (
                              <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#FAF8F9] border border-black/[0.05] shrink-0">
                                <ProductImage
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-[#181617] truncate">
                                  {item.title}
                                </h4>
                                {itemRarities.length > 0 && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    {itemRarities.map((code) => {
                                      const meta = getRarityMeta(code);
                                      return (
                                        <img
                                          key={code}
                                          src={meta.iconSrc}
                                          alt={meta.label}
                                          title={meta.label}
                                          className="w-4 h-4 object-contain"
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-[#7D7478] tabular-nums mt-0.5 truncate">
                                {priceEntries
                                  .map((e) => formatAmount(e.amount, e.code))
                                  .join(' · ')}
                                {item.game === 'mm2' && item.subtitle ? ` · ${item.subtitle}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            {/* Quick stock adjuster */}
                            <div className="inline-flex items-center border border-black/[0.08] rounded-lg bg-[#FAF8F9]">
                              <button
                                type="button"
                                disabled={item.stock <= 0}
                                onClick={() => handleQuickStock(item, -1)}
                                aria-label="Уменьшить остаток"
                                className="w-7 h-7 flex items-center justify-center text-[#4B4448] hover:text-[#181617] disabled:opacity-35"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-medium tabular-nums text-[#181617]">
                                {item.stock} шт.
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickStock(item, 1)}
                                aria-label="Увеличить остаток"
                                className="w-7 h-7 flex items-center justify-center text-[#4B4448] hover:text-[#181617]"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditForm(item)}
                                aria-label={`Редактировать ${item.title}`}
                                className="p-2 text-[#6E676B] hover:text-[#181617] hover:bg-[#FAF8F9] rounded-lg transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {confirmDeleteId === item.id ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(item.id)}
                                    className="px-2.5 py-1 text-[11px] font-medium text-white bg-[#9E3557] rounded-md hover:bg-[#842947]"
                                  >
                                    Удалить
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 text-[11px] text-[#6E676B] hover:text-[#181617]"
                                  >
                                    Отмена
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  aria-label={`Удалить ${item.title}`}
                                  className="p-2 text-[#6E676B] hover:text-[#9E3557] hover:bg-[#FAF0F4] rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
