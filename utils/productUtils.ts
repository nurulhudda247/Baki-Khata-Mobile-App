import { Ionicons } from '@expo/vector-icons';

export type CategoryIcon = keyof typeof Ionicons.glyphMap;

export const getCategoryIcon = (category?: string): CategoryIcon => {
  switch (category?.toLowerCase()) {
    case 'grocery':
      return 'cart-outline';
    case 'medicine':
      return 'medkit-outline';
    case 'food':
      return 'fast-food-outline';
    case 'cigarette':
      return 'flame-outline';
    case 'tea':
      return 'cafe-outline';
    default:
      return 'cube-outline';
  }
};
