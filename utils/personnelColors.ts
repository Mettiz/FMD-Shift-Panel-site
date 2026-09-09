/**
 * Personnel Color Utilities - v1.0.2
 * Provides high-contrast, distinguishable colors without duplicates
 */
import { Personnel } from '../types';

export const PERSONNEL_COLOR_PALETTE: string[] = [
  '#2563eb', // Royal Blue
  '#059669', // Emerald Green
  '#dc2626', // Crimson Red
  '#d97706', // Vibrant Amber Gold
  '#7c3aed', // Deep Violet
  '#0891b2', // Ocean Cyan
  '#db2777', // Rose Pink
  '#ea580c', // Bright Orange
  '#15803d', // Forest Pine Green
  '#4f46e5', // Indigo
  '#c026d3', // Electric Fuchsia
  '#0f766e', // Deep Teal
  '#b91c1c', // Ruby Crimson
  '#854d0e', // Bronze Ochre
  '#9333ea', // Royal Purple
  '#0284c7', // Sky Cerulean
  '#c2410c', // Burnt Orange
  '#4338ca', // Dark Indigo
  '#16a34a', // Bright Green
  '#be185d', // Berry Magenta
  '#047857', // Mint Deep Green
  '#6d28d9', // Dark Purple
  '#a16207', // Warm Olive Bronze
  '#1e40af', // Navy Cobalt
];

// Historical known default color mappings
const KNOWN_STAFF_COLORS: Record<string, string> = {
  'لسانی': '#2563eb',
  'سامان': '#059669',
  'سلیمان': '#dc2626',
  'فلاح': '#dc2626',
  'سالاروند': '#7c3aed',
  'دهقان': '#ea580c',
  'منصوری': '#0891b2',
  'گودرزی': '#db2777',
};

/**
 * Get next available distinct color from the palette for a new personnel,
 * guaranteeing no duplicate colors among personnel.
 */
export const getNextPersonnelColor = (existingPersonnel: Personnel[]): string => {
  const usedColors = new Set(
    existingPersonnel
      .map(p => p.color?.trim().toLowerCase())
      .filter((c): c is string => Boolean(c))
  );

  // 1. Find first unused color from distinct palette
  for (const color of PERSONNEL_COLOR_PALETTE) {
    if (!usedColors.has(color.toLowerCase())) {
      return color;
    }
  }

  // 2. If palette is exhausted, generate with golden-ratio hue distribution for maximum contrast
  const count = existingPersonnel.length;
  const hue = Math.round((count * 137.508) % 360);
  return `hsl(${hue}, 75%, 45%)`;
};

/**
 * Automatically audits personnel list and resolves any duplicate or missing colors,
 * ensuring every person has a completely unique, distinguishable color.
 */
export const ensureUniquePersonnelColors = (personnelList: Personnel[]): Personnel[] => {
  const usedColors = new Set<string>();
  let paletteIndex = 0;

  return personnelList.map(person => {
    const currentColor = person.color?.trim().toLowerCase();

    // If person has a unique valid color, keep it
    if (currentColor && !usedColors.has(currentColor)) {
      usedColors.add(currentColor);
      return person;
    }

    // Otherwise assign next distinct unused color
    let chosenColor = '';
    while (paletteIndex < PERSONNEL_COLOR_PALETTE.length) {
      const candidate = PERSONNEL_COLOR_PALETTE[paletteIndex].toLowerCase();
      paletteIndex++;
      if (!usedColors.has(candidate)) {
        chosenColor = candidate;
        break;
      }
    }

    if (!chosenColor) {
      const hue = Math.round((usedColors.size * 137.508) % 360);
      chosenColor = `hsl(${hue}, 75%, 45%)`;
    }

    usedColors.add(chosenColor.toLowerCase());
    return {
      ...person,
      color: chosenColor
    };
  });
};

/**
 * Clean person name for consistent matching
 */
const cleanName = (name: string): string => {
  return name.replace('مهندس', '').replace('خانم', '').replace('آقای', '').trim();
};

/**
 * Hash string to pick a deterministic color from palette
 */
const hashStringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PERSONNEL_COLOR_PALETTE.length;
  return PERSONNEL_COLOR_PALETTE[index];
};

/**
 * Get color for a person:
 * 1. From personnelList if found with custom color
 * 2. From historical known staff names
 * 3. Deterministically from palette using name hash (never dull slate gray)
 */
export const getPersonColor = (name: string, personnelList?: Personnel[]): string => {
  if (!name) return '#64748b';
  const cleaned = cleanName(name);

  // 1. Check personnelList
  if (personnelList && personnelList.length > 0) {
    const found = personnelList.find(p => {
      const pClean = cleanName(p.name);
      return pClean === cleaned || p.name === name || (pClean && cleaned.includes(pClean)) || (cleaned && pClean.includes(cleaned));
    });

    if (found && found.color) {
      return found.color;
    }
  }

  // 2. Check known staff names
  for (const [key, color] of Object.entries(KNOWN_STAFF_COLORS)) {
    if (name.includes(key)) {
      return color;
    }
  }

  // 3. Deterministic distinct color from palette based on cleaned name
  return hashStringToColor(cleaned || name);
};
