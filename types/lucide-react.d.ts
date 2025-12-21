declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';

  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export type Icon = FC<IconProps>;

  // Common icons used in the codebase
  export const Activity: Icon;
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const Archive: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const BarChart3: Icon;
  export const Bell: Icon;
  export const BookOpen: Icon;
  export const Calendar: Icon;
  export const Camera: Icon;
  export const Car: Icon;
  export const Check: Icon;
  export const CheckCheck: Icon;
  export const CheckCircle: Icon;
  export const CheckCircle2: Icon;
  export const ChevronDown: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ChevronUp: Icon;
  export const Circle: Icon;
  export const ClipboardList: Icon;
  export const Clock: Icon;
  export const Coffee: Icon;
  export const Copy: Icon;
  export const CornerDownRight: Icon;
  export const Database: Icon;
  export const Download: Icon;
  export const Edit: Icon;
  export const ExternalLink: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  export const FileText: Icon;
  export const Filter: Icon;
  export const Flag: Icon;
  export const GraduationCap: Icon;
  export const Hand: Icon;
  export const HandHeart: Icon;
  export const HandHelping: Icon;
  export const Handshake: Icon;
  export const Headphones: Icon;
  export const Heart: Icon;
  export const HelpCircle: Icon;
  export const History: Icon;
  export const Home: Icon;
  export const Info: Icon;
  export const Laptop: Icon;
  export const Loader: Icon;
  export const Loader2: Icon;
  export const Lock: Icon;
  export const LogIn: Icon;
  export const LogOut: Icon;
  export const Mail: Icon;
  export const MapPin: Icon;
  export const Megaphone: Icon;
  export const Menu: Icon;
  export const MessageCircle: Icon;
  export const MessageSquare: Icon;
  export const MoreHorizontal: Icon;
  export const MoreVertical: Icon;
  export const Paperclip: Icon;
  export const Pencil: Icon;
  export const Phone: Icon;
  export const Plus: Icon;
  export const PlusCircle: Icon;
  export const RefreshCw: Icon;
  export const Rocket: Icon;
  export const RotateCcw: Icon;
  export const Save: Icon;
  export const Scale: Icon;
  export const Search: Icon;
  export const Send: Icon;
  export const Settings: Icon;
  export const Share: Icon;
  export const Shield: Icon;
  export const ShieldAlert: Icon;
  export const ShieldOff: Icon;
  export const ShoppingCart: Icon;
  export const Smile: Icon;
  export const Sparkles: Icon;
  export const Sprout: Icon;
  export const Star: Icon;
  export const Stethoscope: Icon;
  export const Tag: Icon;
  export const Trash: Icon;
  export const Trash2: Icon;
  export const TrendingDown: Icon;
  export const TrendingUp: Icon;
  export const Upload: Icon;
  export const User: Icon;
  export const UserCheck: Icon;
  export const UserMinus: Icon;
  export const UserPlus: Icon;
  export const Users: Icon;
  export const UserX: Icon;
  export const Wrench: Icon;
  export const X: Icon;
  export const XCircle: Icon;
  export const Zap: Icon;

  // Export Icon type for component props
  export type LucideIcon = Icon;

  // Export all other icons as a catch-all
  const icons: { [key: string]: Icon };
  export default icons;
}
