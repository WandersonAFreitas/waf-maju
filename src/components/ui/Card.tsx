import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CardProps {
  label: string;
  imageSource: string;
  color?: string; // Classe de cor padrão (ex: bg-white)
  textColor?: string; // Classe de cor de texto (ex: text-slate-700)
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
}

// Mapeamento explícito de ícones usados no sistema para evitar problemas de bundler e tree-shaking
const iconMap: Record<string, React.ComponentType<any>> = {
  Hand: LucideIcons.Hand,
  ThumbsDown: LucideIcons.ThumbsDown,
  Check: LucideIcons.Check,
  X: LucideIcons.X,
  HelpCircle: LucideIcons.HelpCircle,
  Heart: LucideIcons.Heart,
  User: LucideIcons.User,
  UserCheck: LucideIcons.UserCheck,
  GraduationCap: LucideIcons.GraduationCap,
  Users: LucideIcons.Users,
  Gamepad2: LucideIcons.Gamepad2,
  Utensils: LucideIcons.Utensils,
  CupSoda: LucideIcons.CupSoda,
  Moon: LucideIcons.Moon,
  MapPin: LucideIcons.MapPin,
  Eye: LucideIcons.Eye,
  Droplet: LucideIcons.Droplet,
  Apple: LucideIcons.Apple,
  Cookie: LucideIcons.Cookie,
  GlassWater: LucideIcons.GlassWater,
  Smile: LucideIcons.Smile,
  Frown: LucideIcons.Frown,
  Angry: LucideIcons.Angry,
  BatteryLow: LucideIcons.BatteryLow,
  Activity: LucideIcons.Activity,
  ToyBrick: LucideIcons.ToyBrick,
  Tablet: LucideIcons.Tablet,
  Tv: LucideIcons.Tv,
  Circle: LucideIcons.Circle,
  BookOpen: LucideIcons.BookOpen,
  Home: LucideIcons.Home,
  School: LucideIcons.School,
  Trees: LucideIcons.Trees,
  Bath: LucideIcons.Bath,
  ChevronLeft: LucideIcons.ChevronLeft,
  Plus: LucideIcons.Plus,
  Settings: LucideIcons.Settings,
  Trash2: LucideIcons.Trash2,
  Delete: LucideIcons.Delete
};

export const CardComponent: React.FC<CardProps> = ({
  label,
  imageSource,
  color = 'bg-white',
  textColor = 'text-[#181c1c]',
  onClick,
  size = 'md',
  selected = false
}) => {
  const isBase64 = imageSource.startsWith('data:image');
  const IconComponent = !isBase64 ? (iconMap[imageSource] || LucideIcons.HelpCircle) : null;

  // Ajusta tamanhos do botão de acordo com a especificação (rounded-md/lg, etc.)
  const cardSizeClasses = {
    sm: 'w-20 h-24 p-2 text-[10px] rounded-md',
    md: 'w-32 h-36 p-3 text-xs md:w-36 md:h-40 md:text-sm rounded-lg',
    lg: 'w-40 h-44 p-4 text-sm md:w-44 md:h-48 md:text-base rounded-lg'
  };

  const imageSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16 md:w-20 md:h-20',
    lg: 'w-24 h-24 md:w-28 md:h-28'
  };

  const iconSize = size === 'sm' ? 24 : size === 'md' ? 44 : 56;

  // Se selecionado, aplica borda grossa (3px) e fundo destacado (inclusive-aac-core)
  const selectionClasses = selected 
    ? 'border-[3px] border-[#944a00] bg-[#ffdcc5] scale-95 shadow-inner' 
    : `border border-slate-300 ${color} hover:bg-slate-50`;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-between shadow-sm transition-all duration-150 cursor-pointer active:scale-95 select-none ${cardSizeClasses[size]} ${selectionClasses} ${textColor} focus:outline-none focus:ring-4 focus:ring-amber-200/50`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Rótulo (Label) no TOPO */}
      <span className="font-bold text-center w-full truncate uppercase tracking-wider text-xs block mb-1">
        {label}
      </span>

      {/* Ícone/Imagem centralizado ABAIXO do rótulo */}
      <div className="flex items-center justify-center w-full flex-grow">
        {isBase64 ? (
          <img
            src={imageSource}
            alt={label}
            className={`${imageSizeClasses[size]} object-cover rounded-md`}
            draggable={false}
          />
        ) : (
          IconComponent && <IconComponent size={iconSize} className="stroke-[1.75]" />
        )}
      </div>
    </button>
  );
};

// Memoização estrita comparando apenas propriedades primitivas relevantes
export const Card = React.memo(CardComponent, (prevProps, nextProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.imageSource === nextProps.imageSource &&
    prevProps.color === nextProps.color &&
    prevProps.textColor === nextProps.textColor &&
    prevProps.size === nextProps.size &&
    prevProps.selected === nextProps.selected
  );
});
