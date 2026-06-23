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
  // Essenciais / Feedback
  ThumbsUp: LucideIcons.ThumbsUp,
  ThumbsDown: LucideIcons.ThumbsDown,
  Check: LucideIcons.Check,
  X: LucideIcons.X,
  HelpCircle: LucideIcons.HelpCircle,
  Heart: LucideIcons.Heart,
  AlertCircle: LucideIcons.AlertCircle,
  MessageSquare: LucideIcons.MessageSquare,
  // Pessoas & Relações
  User: LucideIcons.User,
  UserCheck: LucideIcons.UserCheck,
  Users: LucideIcons.Users,
  UserPlus: LucideIcons.UserPlus,
  GraduationCap: LucideIcons.GraduationCap,
  Baby: LucideIcons.Baby,
  // Sentimentos & Estados
  Smile: LucideIcons.Smile,
  Frown: LucideIcons.Frown,
  Angry: LucideIcons.Angry,
  Laugh: LucideIcons.Laugh,
  BatteryCharging: LucideIcons.BatteryCharging,
  BatteryLow: LucideIcons.BatteryLow,
  Activity: LucideIcons.Activity,
  Thermometer: LucideIcons.Thermometer,
  // Necessidades / Alimentação / Sono
  Utensils: LucideIcons.Utensils,
  GlassWater: LucideIcons.GlassWater,
  CupSoda: LucideIcons.CupSoda,
  Bed: LucideIcons.Bed,
  Moon: LucideIcons.Moon,
  Sun: LucideIcons.Sun,
  Apple: LucideIcons.Apple,
  Cookie: LucideIcons.Cookie,
  Pizza: LucideIcons.Pizza,
  Cake: LucideIcons.Cake,
  IceCream: LucideIcons.IceCream,
  // Higiene / Saúde
  Bath: LucideIcons.Bath,
  ShowerHead: LucideIcons.ShowerHead,
  Droplet: LucideIcons.Droplet,
  Trash2: LucideIcons.Trash2,
  ShieldAlert: LucideIcons.ShieldAlert,
  // Ações / Brincadeiras / Mídia
  Gamepad2: LucideIcons.Gamepad2,
  ToyBrick: LucideIcons.ToyBrick,
  Puzzle: LucideIcons.Puzzle,
  Music: LucideIcons.Music,
  Tv: LucideIcons.Tv,
  BookOpen: LucideIcons.BookOpen,
  Pencil: LucideIcons.Pencil,
  Brush: LucideIcons.Brush,
  Speaker: LucideIcons.Speaker,
  Volume2: LucideIcons.Volume2,
  Megaphone: LucideIcons.Megaphone,
  Hand: LucideIcons.Hand,
  Eye: LucideIcons.Eye,
  Ear: LucideIcons.Ear,
  // Lugares & Transporte
  Home: LucideIcons.Home,
  School: LucideIcons.School,
  Trees: LucideIcons.Trees,
  Store: LucideIcons.Store,
  MapPin: LucideIcons.MapPin,
  Car: LucideIcons.Car,
  Bike: LucideIcons.Bike,
  Footprints: LucideIcons.Footprints,
  Clock: LucideIcons.Clock,
  // Extras
  ChevronLeft: LucideIcons.ChevronLeft,
  Plus: LucideIcons.Plus,
  Settings: LucideIcons.Settings,
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
    md: 'w-full max-w-[144px] h-28 sm:w-32 sm:h-36 md:w-36 md:h-40 p-2 sm:p-3 rounded-lg',
    lg: 'w-40 h-44 p-4 text-sm md:w-44 md:h-48 md:text-base rounded-lg'
  };

  const imageSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20',
    lg: 'w-24 h-24 md:w-28 md:h-28'
  };

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
      <span className="font-bold text-center w-full truncate uppercase tracking-wider text-xs md:text-sm block mb-1">
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
          IconComponent && (
            <IconComponent 
              className="stroke-[1.75] w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 fill-current opacity-95" 
              style={{ fillOpacity: 0.15 }}
            />
          )
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
