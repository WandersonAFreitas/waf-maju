export type ScreenType = 'LOGIN' | 'MAIN' | 'SETTINGS';

export interface Category {  
  id: string;          // ex: 'alimentacao', 'sentimentos'  
  label: string;       // ex: 'COMIDAS'  
  color: string;       // Classe de cor CSS do Tailwind (ex: 'bg-[#d8b4fe]')  
  textColor: string;   // Cor do texto acessível (ex: 'text-purple-950')  
  order: number;       // Sequência de ordenação lógica na grade  
  profileId?: string;  // Identificador do perfil isolado
}

export interface ActionCard {  
  id?: number;          // Auto-incrementável no IndexedDB  
  label: string;       // Texto exibido e falado (ex: 'QUERO', 'BANHEIRO')  
  imageSource: string; // Nome do ícone Lucide OR String Base64 da imagem comprimida  
  categoryId?: string; // Opcional. Se ausente, pertence à raiz (Ações principais)  
  order: number;       // Ordem de exibição na grade  
  color?: string;      // Cor de fundo customizada do card
  profileId?: string;  // Identificador do perfil isolado
}

export interface SavedWord {
  id?: number;
  word: string;
  profileId: string;
  order: number;
}

