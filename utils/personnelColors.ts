/**
 * Personnel Color Utilities - v1.0.1
 */
import { Personnel } from '../types';

export const PERSONNEL_COLOR_PALETTE: string[] = [
  '#2563eb', // Royal Blue (لسانی)
  '#059669', // Emerald Green (سامان)
  '#e11d48', // Rose Red (سلیمان فلاح)
  '#7c3aed', // Purple / Violet (سالاروند)
  '#ea580c', // Bright Orange (دهقان)
  '#0891b2', // Cyan (منصوری)
  '#db2777', // Magenta Pink (گودرزی)
  '#d97706', // Amber Gold
  '#0d9488', // Deep Teal
  '#4f46e5', // Indigo
  '#16a34a', // Leaf Green
  '#c026d3', // Fuchsia
  '#0284c7', // Sky Blue
  '#9333ea', // Deep Purple
  '#ca8a04', // Golden Olive
  '#b91c1c', // Crimson Ruby
  '#4338ca', // Dark Indigo
  '#047857', // Forest Green
  '#c2410c', // Burnt Orange
  '#6d28d9', // Deep Violet
  '#be185d', // Deep Rose Berry
  '#0f766e', // Marine Teal
  '#1d4ed8', // Dark Blue
  '#854d0e', // Bronze
];

// Historical known default color mappings
const KNOWN_STAFF_COLORS: Record<string, string> = {
  'لسانی': '#2563eb',
  'سامان': '#059669',
  'سلیمان': '#e11d48',
  'فلاح': '#e11d48',
  'سالاروند': '#7c3aed',
  'دهقان': '#ea580c',
  'منصوری': '#0891b2',
  'گودرزی': '#db2777',
};

/**
 * Get next available distinct color from the palette for a new personnel
 */
export const getNextPersonnelColor = (existingPersonnel: Personnel[]): string => {
  const usedColors = new Set(
    existingPersonnel
      .map(p => p.color?.toLowerCase())
      .filter((c): c is string => Boolean(c))
  );

  // Find first unused color from palette
  for (const color of PERSONNEL_COLOR_PALETTE) {
    if (!usedColors.has(color.toLowerCase())) {
      return color;
    }
  }

  // If all colors are used, pick by index mod palette length or generate shifted hue
  const index = existingPersonnel.length % PERSONNEL_COLOR_PALETTE.length;
  return PERSONNEL_COLOR_PALETTE[index];
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
