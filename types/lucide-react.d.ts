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
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const Archive: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const Check: Icon;
  export const CheckCircle: Icon;
  export const ChevronDown: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ChevronUp: Icon;
  export const Clock: Icon;
  export const Copy: Icon;
  export const Download: Icon;
  export const Edit: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  export const FileText: Icon;
  export const Filter: Icon;
  export const Heart: Icon;
  export const HelpCircle: Icon;
  export const Home: Icon;
  export const Info: Icon;
  export const Loader: Icon;
  export const Lock: Icon;
  export const LogIn: Icon;
  export const LogOut: Icon;
  export const Mail: Icon;
  export const MapPin: Icon;
  export const Menu: Icon;
  export const MessageCircle: Icon;
  export const MessageSquare: Icon;
  export const MoreHorizontal: Icon;
  export const MoreVertical: Icon;
  export const Phone: Icon;
  export const Plus: Icon;
  export const RefreshCw: Icon;
  export const Save: Icon;
  export const Search: Icon;
  export const Send: Icon;
  export const Settings: Icon;
  export const Share: Icon;
  export const Shield: Icon;
  export const ShieldAlert: Icon;
  export const Star: Icon;
  export const Trash: Icon;
  export const Trash2: Icon;
  export const TrendingUp: Icon;
  export const User: Icon;
  export const UserCheck: Icon;
  export const UserMinus: Icon;
  export const UserPlus: Icon;
  export const Users: Icon;
  export const X: Icon;
  export const XCircle: Icon;
  export const Zap: Icon;

  // Export all other icons as a catch-all
  const icons: { [key: string]: Icon };
  export default icons;
}
