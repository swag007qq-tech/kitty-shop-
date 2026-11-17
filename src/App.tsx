import React, {useCallback, useEffect, useState} from 'react';
import {AnimatePresence} from 'motion/react';
import {onAuthStateChanged, signOut} from 'firebase/auth';
import {CartItem, CurrencyCode, GameCategory, Product} from './types';
import {IntroLoader} from './components/IntroLoader';
import {Navbar} from './components/Navbar';
import {GameSelector} from './components/GameSelector';
import {CatalogView} from './components/CatalogView';
import {CartDrawer} from './components/CartDrawer';
import {AdminLoginModal} from './components/AdminLoginModal';
import {AdminDrawer} from './components/AdminDrawer';
import {MusicPlayerButton} from './components/MusicPlayerButton';
import {auth} from './firebase';
import {
  checkIsAdminUser,
  INITIAL_PRODUCTS,
  subscribeToCatalog,
} from './utils/catalogCloud';

const CART_STORAGE_KEY = 'kitty_shop_cart_v1';
const ADMIN_SESSION_KEY = 'kitty_shop_admin_auth_v1';
const CURRENCY_STORAGE_KEY = 'kitty_shop_currency_v1';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeGame, setActiveGame] = useState<GameCategory | null>(null);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
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

  const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isCloudAdmin, setIsCloudAdmin] = useState(false);
  const isAdmin = isPasswordVerified && isCloudAdmin;

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);
  const [adminInitialGame, setAdminInitialGame] = useState<GameCategory>('adopt-me');

  // Track Firebase Auth admin state across reloads
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.emailVerified) {
        setIsCloudAdmin(false);
        return;
      }
      const allowed = await checkIsAdminUser(user.uid, user.email);
      setIsCloudAdmin(allowed);
    });
    return () => unsubscribeAuth();
  }, []);

  // Always subscribe to the shared cloud Firestore catalog across all devices
  useEffect(() => {
    const unsubscribeCatalog = subscribeToCatalog(
      (liveProducts) => {
        setProducts(liveProducts);
        setIsLoadingProducts(false);
      },
      () => {
        setIsLoadingProducts(false);
      },
    );
    return () => unsubscribeCatalog();
  }, []);

  // Persist user's personal shopping cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage error
    }
  }, [cart]);

  // Keep cart synced with live cloud stock & deleted products
  useEffect(() => {
    if (isLoadingProducts) return;
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

  const handleAdminLoginSuccess = () => {
    setIsPasswordVerified(true);
    setIsCloudAdmin(true);
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    } catch {
      // Ignore storage error
    }
    setIsAdminLoginOpen(false);
    setAdminInitialGame(activeGame || 'adopt-me');
    setIsAdminDrawerOpen(true);
  };

  const handleAdminLogout = async () => {
    setIsPasswordVerified(false);
    setIsCloudAdmin(false);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore storage error
    }
    try {
      await signOut(auth);
    } catch {
      // Ignore signout error
    }
    setIsAdminDrawerOpen(false);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#FFF8F3] overflow-x-hidden">
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

      <main className="flex-1 w-full">
        {activeGame === null ? (
          <GameSelector onSelectGame={setActiveGame} />
        ) : (
          <CatalogView
            game={activeGame}
            products={products}
            cart={cart}
            currency={currency}
            isAdmin={isAdmin}
            isLoadingProducts={isLoadingProducts}
            onSelectGame={setActiveGame}
            onChangeCurrency={setCurrency}
            onAddToCart={handleAddToCart}
            onOpenAdminForGame={handleOpenAdminForGame}
          />
        )}
      </main>

      <footer className="border-t border-white/10 py-6 px-4 sm:px-6 lg:px-8 bg-[#261710]/75 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#DECAC0]">
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
        initialGame={adminInitialGame}
        currency={currency}
        products={products}
        onLogout={handleAdminLogout}
      />

      <MusicPlayerButton />
    </div>
  );
}
