import React, {useEffect} from 'react';
import {motion} from 'motion/react';
import {KITTY_LOGO_SRC} from './KittyLogo';

interface IntroLoaderProps {
  onComplete: () => void;
}

export const IntroLoader: React.FC<IntroLoaderProps> = ({onComplete}) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{opacity: 1}}
      exit={{
        opacity: 0,
        scale: 1.03,
        transition: {duration: 0.5, ease: [0.16, 1, 0.3, 1]},
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center kitty-bg px-6 overflow-hidden"
      aria-label="Загрузка KITTY SHOP"
    >
      {/* Warm cream soft halo so the chocolate kitty logo stands out cleanly */}
      <motion.div
        aria-hidden="true"
        initial={{opacity: 0, scale: 0.7}}
        animate={{opacity: [0, 0.92, 0.8], scale: [0.75, 1.06, 1]}}
        transition={{duration: 1.8, ease: [0.16, 1, 0.3, 1]}}
        className="absolute w-72 h-72 sm:w-[400px] sm:h-[400px] rounded-full bg-[#FFF4EB]/85 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{opacity: 0, scale: 0.72, y: 18}}
          animate={{opacity: 1, scale: 1, y: 0}}
          transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
        >
          <motion.div
            animate={{y: [0, -8, 0]}}
            transition={{
              delay: 0.75,
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <img
              src={KITTY_LOGO_SRC}
              alt="KITTY SHOP"
              referrerPolicy="no-referrer"
              className="w-[70vw] max-w-[340px] sm:max-w-[420px] h-auto object-contain select-none drop-shadow-[0_14px_30px_rgba(24,14,10,0.45)]"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{opacity: 0, y: 6}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.3, duration: 0.45}}
          className="mt-8 w-52 sm:w-64 h-[2px] rounded-full bg-white/20 overflow-hidden"
        >
          <motion.div
            initial={{scaleX: 0}}
            animate={{scaleX: 1}}
            transition={{duration: 1.95, ease: [0.22, 1, 0.36, 1]}}
            style={{transformOrigin: 'left'}}
            className="w-full h-full bg-[#FFF4EB]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
