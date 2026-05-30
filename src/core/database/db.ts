import Dexie, { type Table } from 'dexie';
import type { Category, Card } from '../types/models';

export class AppDatabase extends Dexie {
  categories!: Table<Category, number>;
  cards!: Table<Card, number>;

  constructor() {
    super('AACDatabase');
    this.version(1).stores({
      categories: '++id, name',
      cards: '++id, categoryId, text, isCustom'
    });
  }
}

export const db = new AppDatabase();

// Setup Seed Data
export const seedDatabase = async () => {
  try {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
      const defaultCategories: Category[] = [
        { id: 1, name: 'Ações', color: '#ffb3ba', createdAt: new Date() },
        { id: 2, name: 'Pessoas', color: '#baffc9', createdAt: new Date() },
        { id: 3, name: 'Alimentos', color: '#bae1ff', createdAt: new Date() },
      ];
      await db.categories.bulkAdd(defaultCategories);

      const defaultCards: Card[] = [
        { categoryId: 1, text: 'Eu quero', isCustom: false, createdAt: new Date() },
        { categoryId: 1, text: 'Não quero', isCustom: false, createdAt: new Date() },
        { categoryId: 1, text: 'Brincar', isCustom: false, createdAt: new Date() },
        { categoryId: 2, text: 'Eu', isCustom: false, createdAt: new Date() },
        { categoryId: 2, text: 'Você', isCustom: false, createdAt: new Date() },
        { categoryId: 2, text: 'Mãe', isCustom: false, createdAt: new Date() },
        { categoryId: 3, text: 'Água', isCustom: false, createdAt: new Date() },
        { categoryId: 3, text: 'Comer', isCustom: false, createdAt: new Date() },
        { categoryId: 3, text: 'Suco', isCustom: false, createdAt: new Date() },
      ];
      await db.cards.bulkAdd(defaultCards);
      console.log('Database seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
