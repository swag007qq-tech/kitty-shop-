import React from 'react';
import {motion} from 'motion/react';

export const SleepingCat: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute -top-[42px] left-7 sm:left-9 z-20"
    >
      {/* Subtle floating sleeping "z" marks */}
      <motion.span
        initial={{opacity: 0, y: 4, x: 0}}
        animate={{opacity: [0, 0.85, 0], y: [-2, -14, -22], x: [0, 3, 6]}}
        transition={{duration: 2.8, repeat: Infinity, ease: 'easeInOut'}}
        className="absolute -top-2 right-1 font-serif italic text-xs font-semibold text-[#FFF8F3]/85"
      >
        z
      </motion.span>
      <motion.span
        initial={{opacity: 0, y: 4, x: 0}}
        animate={{opacity: [0, 0.65, 0], y: [-4, -18, -26], x: [2, 6, 10]}}
        transition={{
          duration: 2.8,
          delay: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-4 -right-2 font-serif italic text-[10px] font-semibold text-[#FFF8F3]/75"
      >
        z
      </motion.span>

      {/* Cozy breathing curled black cat */}
      <motion.svg
        width="76"
        height="48"
        viewBox="0 0 76 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{scaleY: [1, 1.045, 1]}}
        transition={{duration: 3.2, repeat: Infinity, ease: 'easeInOut'}}
        style={{transformOrigin: 'bottom center'}}
        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.42)]"
      >
        {/* Curled tail resting along the button top edge */}
        <path
          d="M54 41.5C64 41.5 69.5 38.5 69.5 34.5C69.5 30.8 65.2 29.2 61.5 31.2"
          stroke="#131112"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <path
          d="M54 41.5C64 41.5 69.5 38.5 69.5 34.5C69.5 30.8 65.2 29.2 61.5 31.2"
          stroke="rgba(255,248,243,0.45)"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Curled sleeping body */}
        <path
          d="M17 42C14.5 32.5 21 21 36.5 21C51 21 59.5 29.5 58.5 41.5C58.3 43.2 57 44 55 44H20C18.2 44 17.4 43.3 17 42Z"
          fill="#131112"
          stroke="rgba(255,248,243,0.55)"
          strokeWidth="1.2"
        />

        {/* Ears */}
        <path
          d="M14.5 21.5L13.5 9.5L23.5 16.5"
          fill="#131112"
          stroke="rgba(255,248,243,0.55)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M27.5 16.5L35 9L35.5 20.5"
          fill="#131112"
          stroke="rgba(255,248,243,0.55)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Inner ears */}
        <path d="M16 18.8L15.6 12.8L20.8 16.5Z" fill="#6F4C54" />
        <path d="M29.4 16.5L33.2 12.6L33.5 18.4Z" fill="#6F4C54" />

        {/* Head resting on paws */}
        <ellipse
          cx="25"
          cy="28"
          rx="13.5"
          ry="11.2"
          fill="#131112"
          stroke="rgba(255,248,243,0.55)"
          strokeWidth="1.2"
        />

        {/* Closed sleeping eyes */}
        <path
          d="M17.5 27.5C18.5 29 20.8 29 21.8 27.5"
          stroke="#F4E2DB"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M27.5 27.5C28.5 29 30.8 29 31.8 27.5"
          stroke="#F4E2DB"
          strokeWidth="1.35"
          strokeLinecap="round"
        />

        {/* Tiny pink nose */}
        <ellipse cx="24.6" cy="30.8" rx="1.35" ry="0.95" fill="#E99EB1" />

        {/* Cute whiskers */}
        <path
          d="M9 28.5L14.2 29.2M9.5 31.8L14.5 31.3M35.2 29.2L40.4 28.5M34.9 31.3L39.9 31.8"
          stroke="rgba(255,248,243,0.45)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />

        {/* Tucked front paws resting on the button top border */}
        <ellipse
          cx="18.5"
          cy="41.5"
          rx="5.2"
          ry="3.1"
          fill="#171516"
          stroke="rgba(255,248,243,0.55)"
          strokeWidth="1.1"
        />
        <ellipse
          cx="30.5"
          cy="41.5"
          rx="5.2"
          ry="3.1"
          fill="#171516"
          stroke="rgba(255,248,243,0.55)"
          strokeWidth="1.1"
        />
      </motion.svg>
    </div>
  );
};
