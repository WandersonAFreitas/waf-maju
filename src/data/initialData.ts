import type { Category, ActionCard } from '../types';

export const initialCategories: Category[] = [
  {
    id: 'pessoas',
    label: 'PESSOAS',
    color: 'bg-amber-100 border-amber-300 active:bg-amber-200',
    textColor: 'text-amber-900',
    order: 1
  },
  {
    id: 'acoes',
    label: 'AÇÕES',
    color: 'bg-emerald-100 border-emerald-300 active:bg-emerald-200',
    textColor: 'text-emerald-950',
    order: 2
  },
  {
    id: 'alimentos',
    label: 'ALIMENTOS',
    color: 'bg-sky-100 border-sky-300 active:bg-sky-200',
    textColor: 'text-blue-950',
    order: 3
  },
  {
    id: 'sentimentos',
    label: 'SENTIMENTOS',
    color: 'bg-purple-100 border-purple-300 active:bg-purple-200',
    textColor: 'text-purple-950',
    order: 4
  },
  {
    id: 'objetos',
    label: 'OBJETOS',
    color: 'bg-cyan-100 border-cyan-300 active:bg-cyan-200',
    textColor: 'text-cyan-950',
    order: 5
  },
  {
    id: 'lugares',
    label: 'LUGARES',
    color: 'bg-rose-100 border-rose-300 active:bg-rose-200',
    textColor: 'text-rose-950',
    order: 6
  }
];

export const initialActionCards: ActionCard[] = [
  // Root cards (Actions/Essential responses at the root level)
  { label: 'QUERO', imageSource: 'Hand', order: 1 },
  { label: 'NÃO QUERO', imageSource: 'ThumbsDown', order: 2 },
  { label: 'SIM', imageSource: 'Check', order: 3 },
  { label: 'NÃO', imageSource: 'X', order: 4 },
  { label: 'AJUDA', imageSource: 'HelpCircle', order: 5 },
  { label: 'OBRIGADO', imageSource: 'Heart', order: 6 },

  // Pessoas
  { label: 'MAMÃE', imageSource: 'User', categoryId: 'pessoas', order: 1 },
  { label: 'PAPAI', imageSource: 'UserCheck', categoryId: 'pessoas', order: 2 },
  { label: 'PROFESSOR', imageSource: 'GraduationCap', categoryId: 'pessoas', order: 3 },
  { label: 'AMIGO', imageSource: 'Users', categoryId: 'pessoas', order: 4 },

  // Ações
  { label: 'BRINCAR', imageSource: 'Gamepad2', categoryId: 'acoes', order: 1 },
  { label: 'COMER', imageSource: 'Utensils', categoryId: 'acoes', order: 2 },
  { label: 'BEBER', imageSource: 'CupSoda', categoryId: 'acoes', order: 3 },
  { label: 'DORMIR', imageSource: 'Moon', categoryId: 'acoes', order: 4 },
  { label: 'IR', imageSource: 'MapPin', categoryId: 'acoes', order: 5 },
  { label: 'VER', imageSource: 'Eye', categoryId: 'acoes', order: 6 },

  // Alimentos
  { label: 'ÁGUA', imageSource: 'Droplet', categoryId: 'alimentos', order: 1 },
  { label: 'SUCO', imageSource: 'CupSoda', categoryId: 'alimentos', order: 2 },
  { label: 'MAÇÃ', imageSource: 'Apple', categoryId: 'alimentos', order: 3 },
  { label: 'PÃO', imageSource: 'Cookie', categoryId: 'alimentos', order: 4 },
  { label: 'LEITE', imageSource: 'GlassWater', categoryId: 'alimentos', order: 5 },

  // Sentimentos
  { label: 'FELIZ', imageSource: 'Smile', categoryId: 'sentimentos', order: 1 },
  { label: 'TRISTE', imageSource: 'Frown', categoryId: 'sentimentos', order: 2 },
  { label: 'BRAVO', imageSource: 'Angry', categoryId: 'sentimentos', order: 3 },
  { label: 'CANSADO', imageSource: 'BatteryLow', categoryId: 'sentimentos', order: 4 },
  { label: 'DOR', imageSource: 'Activity', categoryId: 'sentimentos', order: 5 },

  // Objetos
  { label: 'BRINQUEDO', imageSource: 'ToyBrick', categoryId: 'objetos', order: 1 },
  { label: 'TABLET', imageSource: 'Tablet', categoryId: 'objetos', order: 2 },
  { label: 'TELEVISÃO', imageSource: 'Tv', categoryId: 'objetos', order: 3 },
  { label: 'BOLA', imageSource: 'Circle', categoryId: 'objetos', order: 4 },
  { label: 'LIVRO', imageSource: 'BookOpen', categoryId: 'objetos', order: 5 },

  // Lugares
  { label: 'CASA', imageSource: 'Home', categoryId: 'lugares', order: 1 },
  { label: 'ESCOLA', imageSource: 'School', categoryId: 'lugares', order: 2 },
  { label: 'PARQUE', imageSource: 'Trees', categoryId: 'lugares', order: 3 },
  { label: 'BANHEIRO', imageSource: 'Bath', categoryId: 'lugares', order: 4 }
];
