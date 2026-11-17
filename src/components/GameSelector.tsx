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
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 min-h-[calc(100vh-9rem)] flex flex-col justify-center">
      <motion.div
        initial={{opacity: 0, y: 12}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
        className="text-center mx-auto mb-14 sm:mb-16"
      >
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#FFF8F3] tracking-tight text-balance">
          Что вас интересует?
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-7 w-full mx-auto pt-4">
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
            className="relative overflow-visible group flex items-center justify-center bg-[#281811]/75 backdrop-blur-md border-2 border-white/85 rounded-2xl px-8 py-10 shadow-[-14px_0_32px_rgba(255,255,255,0.35),14px_0_32px_rgba(255,255,255,0.35),0_0_24px_rgba(255,255,255,0.3)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#342017]/85 hover:border-white hover:shadow-[-20px_0_46px_rgba(255,255,255,0.6),20px_0_46px_rgba(255,255,255,0.6),0_0_36px_rgba(255,255,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {choice.id === 'adopt-me' && <SleepingCat />}
            <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#FFF8F3] tracking-wide whitespace-nowrap">
              {choice.title}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
};
