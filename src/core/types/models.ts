export interface Category {
  id?: number;
  name: string;
  color: string;
  icon?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Card {
  id?: number;
  categoryId: number;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  isCustom?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
