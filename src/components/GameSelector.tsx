import React from 'react';
import {motion} from 'motion/react';
import {GameCategory} from '../types';
import {SleepingCat} from './SleepingCat';

interface GameSelectorProps {
  onSelectGame: (game: GameCategory) => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({onSelectGame}) => {
  const choices: Array<{id: GameCategory; title: string}> = [
    {id: 'adopt-me', title: 'Adopt Me'},
    {id: 'mm2', title: 'MM2'},
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 min-h-[calc(100vh-9rem)] flex flex-col justify-center">
      <motion.div
        initial={{opacity: 0, y: 12}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
        className="text-center mx-auto mb-12 sm:mb-14 lg:mb-16"
      >
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#FFF8F3] tracking-tight text-balance">
          Что вас интересует?
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-7 w-full max-w-3xl mx-auto pt-8 sm:pt-4">
        {choices.map((choice, index) => (
          <motion.button
            key={choice.id}
            type="button"
            initial={{opacity: 0, y: 14}}
            animate={{opacity: 1, y: 0}}
            transition={{
              delay: 0.08 * index,
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() => onSelectGame(choice.id)}
            className="relative overflow-visible group flex items-center justify-center bg-[#281811]/75 backdrop-blur-md border-2 border-white/85 rounded-2xl px-6 sm:px-8 py-9 sm:py-10 shadow-[-10px_0_24px_rgba(255,255,255,0.32),10px_0_24px_rgba(255,255,255,0.32),0_0_20px_rgba(255,255,255,0.28)] sm:shadow-[-14px_0_32px_rgba(255,255,255,0.35),14px_0_32px_rgba(255,255,255,0.35),0_0_24px_rgba(255,255,255,0.3)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#342017]/85 hover:border-white hover:shadow-[-20px_0_46px_rgba(255,255,255,0.6),20px_0_46px_rgba(255,255,255,0.6),0_0_36px_rgba(255,255,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {choice.id === 'adopt-me' && <SleepingCat />}
            <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#FFF8F3] tracking-wide whitespace-nowrap">
              {choice.title}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Proofs Callout Block */}
      <motion.div
        initial={{opacity: 0, y: 12}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.22, duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
        className="mt-10 sm:mt-14 w-full max-w-md mx-auto"
      >
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 bg-[#281811]/80 backdrop-blur-md border-2 border-white/80 rounded-2xl px-5 py-4 shadow-[-8px_0_22px_rgba(255,255,255,0.24),8px_0_22px_rgba(255,255,255,0.24),0_0_18px_rgba(255,255,255,0.2)] text-center">
          <span className="text-sm sm:text-base font-medium text-[#FFF8F3] tracking-wide">
            тут наши пруфы
          </span>
          <span className="text-[#DECAC0]/70" aria-hidden="true">
            —
          </span>
          <button
            type="button"
            onClick={() => {}}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-[#261710] bg-[#FFF8F3] border border-white rounded-xl shadow-[0_0_16px_rgba(255,255,255,0.45)] hover:bg-[#F9E4EC] hover:border-[#F3C5D2] active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            тык
          </button>
        </div>
      </motion.div>
    </section>
  );
};
