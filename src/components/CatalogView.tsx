import React, {useMemo, useState} from 'react';
import {motion} from 'motion/react';
import {Search, ArrowLeft, SlidersHorizontal, X} from 'lucide-react';
import {CartItem, CurrencyCode, GameCategory, Product} from '../types';
import {ProductCard} from './ProductCard';
import {CURRENCIES, CURRENCY_LIST, getProductPrice} from '../utils/currency';

interface CatalogViewProps {
  game: GameCategory;
  products: Product[];
  cart: CartItem[];
  currency: CurrencyCode;
  isAdmin: boolean;
  onSelectGame: (game: GameCategory | null) => void;
  onChangeCurrency: (currency: CurrencyCode) => void;
  onAddToCart: (product: Product) => void;
  onOpenAdminForGame: (game: GameCategory) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  game,
  products,
  cart,
  currency,
  isAdmin,
  onSelectGame,
  onChangeCurrency,
  onAddToCart,
  onOpenAdminForGame,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock'>('all');

  const gameTitle = game === 'adopt-me' ? 'Adopt Me' : 'MM2';
  const activeCurrency = CURRENCIES[currency];

  const gameProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const parsedBudget = maxBudget.trim() !== '' ? Number(maxBudget) : null;
    const hasValidBudget =
      parsedBudget !== null && !Number.isNaN(parsedBudget) && parsedBudget >= 0;

    return products.filter((item) => {
      if (item.game !== game) return false;
      if (stockFilter === 'in-stock' && item.stock <= 0) return false;
      if (hasValidBudget) {
        const priceInCurrency = getProductPrice(item, currency);
        if (priceInCurrency === undefined || priceInCurrency > parsedBudget) {
          return false;
        }
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
      );
    });
  }, [products, game, searchQuery, maxBudget, stockFilter, currency]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    maxBudget.trim() !== '' ||
    stockFilter === 'in-stock';

  return (
    <motion.section
      key={game}
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
      className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12"
    >
      {/* Top Breadcrumb + Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-7 border-b border-white/12">
        <div>
          <button
            type="button"
            onClick={() => onSelectGame(null)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DECAC0] hover:text-[#FFF8F3] transition-colors mb-2.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>К выбору игры</span>
          </button>

          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#FFF8F3] tracking-tight">
            {gameTitle}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Game Switcher */}
          <div
            className="inline-flex items-center p-1 bg-[#261710]/85 rounded-xl border border-white/12"
            role="tablist"
            aria-label="Переключение каталога"
          >
            <button
              type="button"
              role="tab"
              aria-selected={game === 'adopt-me'}
              onClick={() => onSelectGame('adopt-me')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 ${
                game === 'adopt-me'
                  ? 'bg-[#FFF8F3] text-[#261710] shadow-xs'
                  : 'text-[#DECAC0] hover:text-[#FFF8F3]'
              }`}
            >
              Adopt Me
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={game === 'mm2'}
              onClick={() => onSelectGame('mm2')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 ${
                game === 'mm2'
                  ? 'bg-[#FFF8F3] text-[#261710] shadow-xs'
                  : 'text-[#DECAC0] hover:text-[#FFF8F3]'
              }`}
            >
              MM2
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onOpenAdminForGame(game)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#7D2443] bg-[#F9E4EC] border border-[#F3C5D2] rounded-xl hover:bg-[#F4D5E1] transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Управлять {gameTitle}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search, Budget, Stock & Currency Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-[#8C7B72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Поиск в ${gameTitle}...`}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FFFDFB] border border-white/20 rounded-xl text-[#181617] placeholder:text-[#998982] focus:outline-none focus:border-[#F3C5D2] transition-colors"
            />
          </div>

          {/* Budget Filter */}
          <div className="relative flex items-center bg-[#FFFDFB] border border-white/20 rounded-xl px-3 py-2 focus-within:border-[#F3C5D2] transition-colors sm:w-52">
            <span className="text-xs font-medium text-[#7D7478] whitespace-nowrap mr-2">
              Бюджет до:
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="Любой"
              aria-label={`Максимальный бюджет в валюте ${activeCurrency.label}`}
              className="w-full text-sm bg-transparent text-[#181617] placeholder:text-[#A3989D] tabular-nums focus:outline-none"
            />
            <span className="text-xs font-medium text-[#5D5357] ml-1.5 whitespace-nowrap">
              {activeCurrency.shortLabel}
            </span>
            {maxBudget && (
              <button
                type="button"
                onClick={() => setMaxBudget('')}
                aria-label="Сбросить бюджет"
                className="ml-1.5 text-[#8C8387] hover:text-[#181617]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Selector */}
          <div
            className="inline-flex items-center p-1 bg-[#261710]/85 rounded-xl border border-white/12"
            role="group"
            aria-label="Выбор валюты"
          >
            {CURRENCY_LIST.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => onChangeCurrency(item.code)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  currency === item.code
                    ? 'bg-[#FFF8F3] text-[#261710] shadow-xs'
                    : 'text-[#DECAC0] hover:text-[#FFF8F3]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Stock Toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#261710]/85 rounded-xl border border-white/12">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                stockFilter === 'all'
                  ? 'bg-[#FFF8F3] text-[#261710] shadow-xs'
                  : 'text-[#DECAC0] hover:text-[#FFF8F3]'
              }`}
            >
              Все
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('in-stock')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                stockFilter === 'in-stock'
                  ? 'bg-[#FFF8F3] text-[#261710] shadow-xs'
                  : 'text-[#DECAC0] hover:text-[#FFF8F3]'
              }`}
            >
              В наличии
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {gameProducts.length === 0 ? (
        <div className="py-16 px-6 text-center bg-[#FFFDFB] border border-white/20 rounded-2xl shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)]">
          <p className="font-serif text-2xl font-semibold text-[#181617]">
            Товары не найдены
          </p>
          <p className="mt-2 text-sm text-[#6E676B]">
            {hasActiveFilters
              ? 'Попробуйте изменить поиск, увеличить бюджет или сбросить фильтр.'
              : `В каталоге ${gameTitle} пока нет добавленных позиций.`}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setMaxBudget('');
                setStockFilter('all');
              }}
              className="mt-5 px-4 py-2 text-xs font-medium text-[#181617] bg-white border border-black/[0.1] rounded-lg hover:bg-[#F3F0F2] transition-colors"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {gameProducts.map((product) => {
            const cartEntry = cart.find((c) => c.productId === product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                cartQuantity={cartEntry ? cartEntry.quantity : 0}
                onAddToCart={onAddToCart}
              />
            );
          })}
        </div>
      )}
    </motion.section>
  );
};
