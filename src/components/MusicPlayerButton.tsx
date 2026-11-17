import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Volume2, X} from 'lucide-react';
import {MUSIC_TRACKS, MusicTrack, musicEngine} from '../utils/musicEngine';

const TRACK_DURATION_SEC = 180; // 3:00 loop display

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

export const MusicPlayerButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTrackList, setShowTrackList] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoop, setIsLoop] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTrack: MusicTrack = MUSIC_TRACKS[activeIndex] || MUSIC_TRACKS[0];
  const isLiked = likedIds.includes(activeTrack.id);

  useEffect(() => {
    musicEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    return () => {
      musicEngine.stop();
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setElapsedSec((prev) => {
        if (prev + 1 >= TRACK_DURATION_SEC) {
          if (isLoop) return 0;
          const nextIdx = isShuffle
            ? Math.floor(Math.random() * MUSIC_TRACKS.length)
            : (activeIndex + 1) % MUSIC_TRACKS.length;
          setActiveIndex(nextIdx);
          musicEngine.play(MUSIC_TRACKS[nextIdx]);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, isLoop, isShuffle, activeIndex]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const playIndex = (index: number) => {
    const safeIdx = ((index % MUSIC_TRACKS.length) + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    setActiveIndex(safeIdx);
    setElapsedSec(0);
    setIsPlaying(true);
    musicEngine.play(MUSIC_TRACKS[safeIdx]);
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      musicEngine.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      musicEngine.play(activeTrack);
    }
  };

  const handlePrev = () => {
    if (isShuffle) {
      const rand = Math.floor(Math.random() * MUSIC_TRACKS.length);
      playIndex(rand);
      return;
    }
    playIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (isShuffle) {
      let rand = Math.floor(Math.random() * MUSIC_TRACKS.length);
      if (rand === activeIndex && MUSIC_TRACKS.length > 1) {
        rand = (rand + 1) % MUSIC_TRACKS.length;
      }
      playIndex(rand);
      return;
    }
    playIndex(activeIndex + 1);
  };

  const handleToggleLike = () => {
    setLikedIds((prev) =>
      prev.includes(activeTrack.id)
        ? prev.filter((id) => id !== activeTrack.id)
        : [...prev, activeTrack.id],
    );
  };

  const progressPct = Math.min(100, (elapsedSec / TRACK_DURATION_SEC) * 100);

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-30">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{opacity: 0, y: 14, scale: 0.94}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 10, scale: 0.94}}
            transition={{duration: 0.24, ease: [0.16, 1, 0.3, 1]}}
            className="absolute bottom-15 right-0 w-[320px] sm:w-[348px] bg-white border-[2.5px] border-[#181617] rounded-3xl shadow-[0_0_32px_rgba(255,255,255,0.45),6px_6px_0px_#181617] overflow-hidden text-[#181617]"
          >
            {/* Top Sketch Header: Heart — MUSIC — ••• */}
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleToggleLike}
                aria-label={isLiked ? 'Убрать из любимых' : 'Нравится трек'}
                className="p-1.5 -ml-1.5 rounded-xl hover:bg-black/[0.04] transition-transform active:scale-90"
              >
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <path
                    d="M14 23.2C14 23.2 4.5 16.9 4.5 10.4C4.5 7.3 6.9 5.2 9.7 5.2C11.6 5.2 13.2 6.2 14 7.7C14.8 6.2 16.4 5.2 18.3 5.2C21.1 5.2 23.5 7.3 23.5 10.4C23.5 16.9 14 23.2 14 23.2Z"
                    fill={isLiked ? '#E14D76' : 'none'}
                    stroke="#181617"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="text-center">
                <p className="font-mono text-base font-bold tracking-[0.28em] text-[#181617] pl-[0.28em]">
                  MUSIC
                </p>
                <p className="text-[11px] font-medium text-[#6B6367] truncate max-w-[175px]">
                  {activeTrack.title}
                </p>
              </div>

              <div className="flex items-center gap-0.5 -mr-1.5">
                <button
                  type="button"
                  onClick={() => setShowTrackList((prev) => !prev)}
                  aria-label="Список мелодий"
                  title="Показать / скрыть список из 7 треков"
                  className={`p-1.5 rounded-xl transition-colors ${
                    showTrackList ? 'bg-black/[0.07]' : 'hover:bg-black/[0.04]'
                  }`}
                >
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                    <circle cx="7" cy="14" r="2.2" fill="#181617" />
                    <circle cx="14" cy="13.6" r="2.2" fill="#181617" />
                    <circle cx="21" cy="14.2" r="2.2" fill="#181617" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Свернуть плеер"
                  className="p-1.5 rounded-xl text-[#6E676B] hover:text-[#181617] hover:bg-black/[0.04]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hand-drawn Progress Line + Timecodes */}
            <div className="px-5 pt-2 pb-1">
              <div className="relative h-5 flex items-center">
                <svg
                  viewBox="0 0 280 10"
                  preserveAspectRatio="none"
                  className="w-full h-2.5 overflow-visible"
                  aria-hidden="true"
                >
                  <path
                    d="M2 5.2 Q 70 4.2, 140 5.1 T 278 4.9"
                    stroke="#181617"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                {/* Scrubber dot */}
                <span
                  style={{left: `calc(${progressPct}% - 5px)`}}
                  className="absolute w-3 h-3 rounded-full bg-[#181617] transition-[left] duration-500 ease-linear"
                />
              </div>

              <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-[#181617] tabular-nums mt-0.5">
                <span>{formatTime(elapsedSec)}</span>
                <span>{formatTime(TRACK_DURATION_SEC)}</span>
              </div>
            </div>

            {/* Cartoon Transport Controls: Shuffle, Prev, Big Circle Play/Pause, Next, Repeat */}
            <div className="px-5 pt-2 pb-4 flex items-center justify-between">
              {/* Shuffle */}
              <button
                type="button"
                onClick={() => setIsShuffle((prev) => !prev)}
                aria-label="Случайный порядок"
                aria-pressed={isShuffle}
                className={`p-2 rounded-xl transition-all active:scale-90 ${
                  isShuffle
                    ? 'bg-[#181617] text-white'
                    : 'text-[#181617] hover:bg-black/[0.05]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7.5C7.5 7.5 9.5 16.5 15.5 16.5H19M19 16.5L16.8 14.3M19 16.5L16.8 18.7"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 16.5C7.5 16.5 9.5 7.5 15.5 7.5H19M19 7.5L16.8 5.3M19 7.5L16.8 9.7"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Previous */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Предыдущий трек"
                className="p-2 rounded-xl text-[#181617] hover:bg-black/[0.05] transition-transform active:scale-90"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6.2 6.5V17.5"
                    stroke="#181617"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17.8 6.8L9.6 12L17.8 17.2V6.8Z"
                    fill="#181617"
                    stroke="#181617"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Big Circular Play / Pause */}
              <button
                type="button"
                onClick={handleTogglePlayPause}
                aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <svg width="54" height="54" viewBox="0 0 56 56" fill="none">
                  <path
                    d="M28 4.5C41.5 4.2 51.8 14.2 51.5 28C51.2 41.8 41.2 51.8 27.6 51.5C14.1 51.2 4.2 41.3 4.5 27.8C4.8 14.3 14.5 4.8 28 4.5Z"
                    stroke="#181617"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="white"
                  />
                  {isPlaying ? (
                    <>
                      <rect x="20.5" y="18.5" width="5" height="19" rx="2.4" fill="#181617" />
                      <rect x="30.5" y="18.5" width="5" height="19" rx="2.4" fill="#181617" />
                    </>
                  ) : (
                    <path
                      d="M23 18.2L37.8 28L23 37.8V18.2Z"
                      fill="#181617"
                      stroke="#181617"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Следующий трек"
                className="p-2 rounded-xl text-[#181617] hover:bg-black/[0.05] transition-transform active:scale-90"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17.8 6.5V17.5"
                    stroke="#181617"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.2 6.8L14.4 12L6.2 17.2V6.8Z"
                    fill="#181617"
                    stroke="#181617"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Repeat / Loop */}
              <button
                type="button"
                onClick={() => setIsLoop((prev) => !prev)}
                aria-label="Повтор мелодии"
                aria-pressed={isLoop}
                className={`p-2 rounded-xl transition-all active:scale-90 ${
                  isLoop
                    ? 'bg-[#181617] text-white'
                    : 'text-[#181617] hover:bg-black/[0.05]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.5 11.5C5.5 8.5 7.8 6.5 11 6.5H17.5M17.5 6.5L15.3 4.3M17.5 6.5L15.3 8.7"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 12.5C18.5 15.5 16.2 17.5 13 17.5H6.5M6.5 17.5L8.7 15.3M6.5 17.5L8.7 19.7"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Expandable 7-Track Selector */}
            {showTrackList && (
              <div className="border-t-2 border-[#181617]/15 bg-[#FAF8F9]">
                <ul className="divide-y divide-black/[0.06] max-h-52 overflow-y-auto">
                  {MUSIC_TRACKS.map((track, idx) => {
                    const isCurrent = idx === activeIndex;
                    const isActivePlaying = isCurrent && isPlaying;
                    return (
                      <li key={track.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isActivePlaying) {
                              handleTogglePlayPause();
                            } else {
                              playIndex(idx);
                            }
                          }}
                          className={`w-full px-4 py-2 flex items-center justify-between gap-3 text-left transition-colors ${
                            isCurrent
                              ? 'bg-[#181617] text-white'
                              : 'hover:bg-black/[0.04] text-[#181617]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`font-mono text-[11px] tabular-nums shrink-0 ${
                                isCurrent ? 'text-white/70' : 'text-[#8C8387]'
                              }`}
                            >
                              0{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {track.title}
                              </p>
                              <p
                                className={`text-[10px] truncate ${
                                  isCurrent ? 'text-white/75' : 'text-[#7D7478]'
                                }`}
                              >
                                {track.mood}
                              </p>
                            </div>
                          </div>

                          {isActivePlaying && (
                            <span className="flex items-end gap-[2px] h-3 shrink-0" aria-hidden="true">
                              <motion.span
                                animate={{height: ['3px', '12px', '5px']}}
                                transition={{duration: 0.65, repeat: Infinity}}
                                className="w-[2px] bg-white rounded-full"
                              />
                              <motion.span
                                animate={{height: ['11px', '4px', '12px']}}
                                transition={{duration: 0.55, repeat: Infinity}}
                                className="w-[2px] bg-white rounded-full"
                              />
                              <motion.span
                                animate={{height: ['5px', '10px', '3px']}}
                                transition={{duration: 0.75, repeat: Infinity}}
                                className="w-[2px] bg-white rounded-full"
                              />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Compact Volume Bar */}
            <div className="px-4 py-2.5 border-t border-black/[0.08] bg-white flex items-center gap-2.5">
              <Volume2 className="w-3.5 h-3.5 text-[#181617] shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Громкость"
                className="flex-1 accent-[#181617] cursor-pointer h-1.5"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cute Cartoon Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Открыть музыкальный плеер"
        className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white text-[#181617] border-2 border-[#181617] shadow-[0_0_24px_rgba(255,255,255,0.45),3px_3px_0px_#181617] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(255,255,255,0.65),4px_4px_0px_#181617] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {isPlaying ? (
          <span className="flex items-end gap-[2.5px] h-3.5" aria-hidden="true">
            <motion.span
              animate={{height: ['4px', '14px', '5px']}}
              transition={{duration: 0.65, repeat: Infinity, ease: 'easeInOut'}}
              className="w-[2.5px] bg-[#181617] rounded-full"
            />
            <motion.span
              animate={{height: ['12px', '5px', '14px']}}
              transition={{duration: 0.55, repeat: Infinity, ease: 'easeInOut'}}
              className="w-[2.5px] bg-[#181617] rounded-full"
            />
            <motion.span
              animate={{height: ['6px', '13px', '4px']}}
              transition={{duration: 0.75, repeat: Infinity, ease: 'easeInOut'}}
              className="w-[2.5px] bg-[#181617] rounded-full"
            />
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 18V6.5L19 4.5V16"
              stroke="#181617"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6.5" cy="18" r="2.8" fill="#181617" />
            <circle cx="16.5" cy="16" r="2.8" fill="#181617" />
          </svg>
        )}
        <span className="font-mono text-xs font-bold tracking-[0.14em]">
          {isPlaying ? activeTrack.title : 'MUSIC'}
        </span>
      </button>
    </div>
  );
};
