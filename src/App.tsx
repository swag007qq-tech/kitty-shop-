import React, {useCallback, useEffect, useState} from 'react';
import {AnimatePresence} from 'motion/react';
import {CartItem, CurrencyCode, GameCategory, Product} from './types';
import {IntroLoader} from './components/IntroLoader';
import {Navbar} from './components/Navbar';
import {GameSelector} from './components/GameSelector';
import {CatalogView} from './components/CatalogView';
import {CartDrawer} from './components/CartDrawer';
import {AdminLoginModal} from './components/AdminLoginModal';
import {AdminDrawer} from './components/AdminDrawer';
import {MusicPlayerButton} from './components/MusicPlayerButton';

const CART_STORAGE_KEY = 'kitty_shop_cart_v1';
const PRODUCTS_CACHE_KEY = 'kitty_shop_products_cache_v1';
const ADMIN_SESSION_KEY = 'kitty_shop_admin_pw_v1';
const CURRENCY_STORAGE_KEY = 'kitty_shop_currency_v1';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeGame, setActiveGame] = useState<GameCategory | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore cache error
    }
    return [];
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved === 'UAH' || saved === 'STARS' || saved === 'ROBUX') {
        return saved;
      }
    } catch {
      // Ignore storage error
    }
    return 'UAH';
  });

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      // Ignore storage error
    }
  }, [currency]);

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
    } catch {
      return '';
    }
  });
  const isAdmin = Boolean(adminPassword);

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);
  const [adminInitialGame, setAdminInitialGame] = useState<GameCategory>('adopt-me');

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products', {cache: 'no-store'});
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.products)) {
        setProducts(data.products);
        try {
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data.products));
        } catch {
          // Ignore quota error
        }
      }
    } catch {
      // Keep cached products if offline
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage error
    }
  }, [cart]);

  // Keep cart synced with live stock & deleted products
  useEffect(() => {
    if (products.length === 0 && isLoadingProducts) return;
    setCart((prev) => {
      const next: CartItem[] = [];
      let changed = false;

      for (const entry of prev) {
        const product = products.find((p) => p.id === entry.productId);
        if (!product || product.stock <= 0) {
          changed = true;
          continue;
        }
        const clampedQty = Math.min(entry.quantity, product.stock);
        if (clampedQty !== entry.quantity) {
          changed = true;
        }
        if (clampedQty > 0) {
          next.push({productId: entry.productId, quantity: clampedQty});
        }
      }

      return changed ? next : prev;
    });
  }, [products, isLoadingProducts]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.productId === product.id
            ? {...item, quantity: item.quantity + 1}
            : item,
        );
      }
      return [...prev, {productId: product.id, quantity: 1}];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const maxStock = product ? product.stock : item.quantity;
          const nextQty = Math.min(maxStock, item.quantity + delta);
          return {...item, quantity: nextQty};
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleOpenAdmin = () => {
    if (isAdmin) {
      setAdminInitialGame(activeGame || 'adopt-me');
      setIsAdminDrawerOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleOpenAdminForGame = (game: GameCategory) => {
    setAdminInitialGame(game);
    setIsAdminDrawerOpen(true);
  };

  const handleAdminLoginSuccess = (password: string) => {
    setAdminPassword(password);
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, password);
    } catch {
      // Ignore storage error
    }
    setIsAdminLoginOpen(false);
    setAdminInitialGame(activeGame || 'adopt-me');
    setIsAdminDrawerOpen(true);
  };

  const handleAdminLogout = () => {
    setAdminPassword('');
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore storage error
    }
    setIsAdminDrawerOpen(false);
  };

  const handleCatalogUpdated = (nextProducts: Product[]) => {
    setProducts(nextProducts);
    try {
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(nextProducts));
    } catch {
      // Ignore quota error
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#FFF8F3]">
      <AnimatePresence>
        {showIntro && <IntroLoader onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <Navbar
        activeGame={activeGame}
        onSelectGame={setActiveGame}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isAdmin={isAdmin}
        onOpenAdmin={handleOpenAdmin}
      />

      <main className="flex-1">
        {activeGame === null ? (
          <GameSelector onSelectGame={setActiveGame} />
        ) : (
          <CatalogView
            game={activeGame}
            products={products}
            cart={cart}
            currency={currency}
            isAdmin={isAdmin}
            onSelectGame={setActiveGame}
            onChangeCurrency={setCurrency}
            onAddToCart={handleAddToCart}
            onOpenAdminForGame={handleOpenAdminForGame}
          />
        )}
      </main>

      <footer className="border-t border-white/10 py-6 px-4 sm:px-6 bg-[#261710]/75 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#DECAC0]">
          <span className="font-serif text-sm font-semibold tracking-[0.1em] text-[#FFF8F3]">
            KITTY SHOP
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveGame('adopt-me')}
              className="hover:text-[#FFF8F3] transition-colors"
            >
              Adopt Me
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveGame('mm2')}
              className="hover:text-[#FFF8F3] transition-colors"
            >
              MM2
            </button>
          </div>
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        products={products}
        currency={currency}
        onChangeCurrency={setCurrency}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      <AdminDrawer
        isOpen={isAdminDrawerOpen}
        onClose={() => setIsAdminDrawerOpen(false)}
        adminPassword={adminPassword}
        initialGame={adminInitialGame}
        currency={currency}
        products={products}
        onCatalogUpdated={handleCatalogUpdated}
        onLogout={handleAdminLogout}
      />

      <MusicPlayerButton />
    </div>
  );
}
