import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {X, Eye, EyeOff, Lock} from 'lucide-react';
import {signInWithPopup, signOut} from 'firebase/auth';
import {auth, BOOTSTRAPPED_ADMIN_EMAIL, googleProvider} from '../firebase';
import {
  ADMIN_PASSWORD,
  checkIsAdminUser,
  ensureCloudCatalogSeeded,
} from '../utils/catalogCloud';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Введите пароль администратора');
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      setError('Неверный пароль. Попробуйте снова.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let currentUser = auth.currentUser;
      const isAlreadyBootstrapped =
        Boolean(currentUser?.emailVerified) &&
        currentUser?.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

      // Call signInWithPopup directly inside the user click gesture to avoid mobile popup blockers
      if (!currentUser || !currentUser.emailVerified || !isAlreadyBootstrapped) {
        const cred = await signInWithPopup(auth, googleProvider);
        currentUser = cred.user;
      }

      const isAllowed = await checkIsAdminUser(currentUser.uid, currentUser.email);
      if (!isAllowed || !currentUser.emailVerified) {
        await signOut(auth);
        setError(
          `Этот Google-аккаунт не является администратором. Войдите через ${BOOTSTRAPPED_ADMIN_EMAIL}.`,
        );
        return;
      }

      await ensureCloudCatalogSeeded();
      onSuccess();
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as {code?: unknown}).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError(
          'Окно входа Google было закрыто. Подтвердите аккаунт владельца, чтобы изменения сохранялись на сервере.',
        );
      } else if (code === 'auth/popup-blocked') {
        setError(
          'Браузер заблокировал всплывающее окно Google. Разрешите всплывающие окна в настройках сайта.',
        );
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          `Домен ${window.location.hostname} не добавлен в Firebase Auth (Authorized domains). Добавьте его в настройках Firebase Console.`,
        );
      } else {
        setError('Не удалось подключиться к облачной базе. Проверьте интернет и повторите попытку.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Вход администратора"
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
            onClick={onClose}
            className="fixed inset-0 bg-black/35 backdrop-blur-[1px]"
          />

          <motion.div
            initial={{opacity: 0, scale: 0.96, y: 8}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.96, y: 8}}
            transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1]}}
            className="relative z-10 w-full max-w-sm bg-white border border-black/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#FAF0F4] text-[#9E3557] flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-[#181617]">
                  Вход для администратора
                </h2>
                <p className="mt-1 text-xs text-[#6E676B] leading-relaxed">
                  Введите пароль и подтвердите аккаунт владельца — все изменения сразу синхронизируются на всех устройствах.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть окно входа"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7D7478] hover:text-[#181617] hover:bg-[#FAF8F9] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-password-input"
                  className="block text-xs font-medium text-[#4B4448] mb-1.5"
                >
                  Пароль
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Введите пароль"
                    autoComplete="current-password"
                    className="w-full pr-10 pl-3.5 py-2.5 text-sm bg-[#FAF8F9] border border-black/[0.09] rounded-xl text-[#181617] placeholder:text-[#9D9498] focus:outline-none focus:bg-white focus:border-[#C85A7C] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7D7478] hover:text-[#181617] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs font-medium text-[#9E3557]" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 text-xs font-medium text-[#4B4448] bg-white border border-black/[0.09] rounded-xl hover:bg-[#FAF8F9] transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 text-xs font-medium text-white bg-[#181617] rounded-xl hover:bg-[#2E2A2C] disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? 'Подключение...' : 'Войти'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
