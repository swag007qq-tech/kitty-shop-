import {AdoptMeRarity} from '../types';

export interface RarityBadgeMeta {
  code: AdoptMeRarity;
  label: string;
  iconSrc: string;
}

export const ADOPT_ME_RARITIES: RarityBadgeMeta[] = [
  {code: 'M', label: 'Mega Neon', iconSrc: '/assets/rarity-m.png'},
  {code: 'N', label: 'Neon', iconSrc: '/assets/rarity-n.png'},
  {code: 'F', label: 'Fly', iconSrc: '/assets/rarity-f.png'},
  {code: 'R', label: 'Ride', iconSrc: '/assets/rarity-r.png'},
];

const RARITY_ORDER: Record<AdoptMeRarity, number> = {
  M: 0,
  N: 1,
  F: 2,
  R: 3,
};

export function sortRarities(rarities: AdoptMeRarity[]): AdoptMeRarity[] {
  return Array.from(new Set(rarities)).sort((a, b) => RARITY_ORDER[a] - RARITY_ORDER[b]);
}

export function getRarityMeta(code: AdoptMeRarity): RarityBadgeMeta {
  return ADOPT_ME_RARITIES.find((r) => r.code === code) || ADOPT_ME_RARITIES[0];
}
