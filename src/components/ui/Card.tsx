import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CardProps {
  label: string;
  imageSource: string;
  color?: string; // Tailwind class like "bg-amber-100 border-amber-300"
  textColor?: string; // Tailwind class like "text-amber-900"
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
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
  color = 'bg-white border-slate-200 hover:bg-slate-50',
  textColor = 'text-slate-700',
  onClick,
  size = 'md'
}) => {
  // Verifica se o imageSource é uma string Base64 ou o nome de um ícone
  const isBase64 = imageSource.startsWith('data:image');
  
  const IconComponent = !isBase64 ? (iconMap[imageSource] || LucideIcons.HelpCircle) : null;

  // Ajusta tamanhos com base na propriedade size
  const cardSizeClasses = {
    sm: 'w-20 h-24 p-2 text-xs',
    md: 'w-32 h-36 p-3 text-sm md:w-36 md:h-40 md:text-base',
    lg: 'w-40 h-44 p-4 text-base md:w-44 md:h-48 md:text-lg'
  };

  const imageSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16 md:w-20 md:h-20',
    lg: 'w-24 h-24 md:w-28 md:h-28'
  };

  const iconSize = size === 'sm' ? 24 : size === 'md' ? 44 : 56;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-between border-2 rounded-2xl shadow-sm transition-all duration-150 cursor-pointer active:scale-95 select-none ${cardSizeClasses[size]} ${color} ${textColor} focus:outline-none focus:ring-4 focus:ring-blue-200`}
      style={{ touchAction: 'manipulation' }}
    >
      <div className={`flex items-center justify-center w-full flex-grow`}>
        {isBase64 ? (
          <img
            src={imageSource}
            alt={label}
            className={`${imageSizeClasses[size]} object-cover rounded-lg`}
            draggable={false}
          />
        ) : (
          IconComponent && <IconComponent size={iconSize} className="stroke-[1.75]" />
        )}
      </div>
      <span className="font-bold text-center w-full mt-2 truncate uppercase tracking-wider">
        {label}
      </span>
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
    prevProps.size === nextProps.size
  );
});
