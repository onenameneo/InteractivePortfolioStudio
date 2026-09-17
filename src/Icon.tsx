import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  Sun,
  Moon,
  Play,
  Pause,
  Copy,
  X,
  Sparkles,
  Command,
  MapPin,
  Plus,
  Check,
  Save,
  Upload,
  Trash2,
  LogOut,
  type LucideProps,
} from "lucide-react";

// Explicit imports keep the bundle limited to the icons used by this site.
const icons = {
  "arrow-up-right": ArrowUpRight,
  "arrow-down-left": ArrowDownLeft,
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  "arrow-left": ArrowLeft,
  sun: Sun,
  moon: Moon,
  play: Play,
  pause: Pause,
  copy: Copy,
  close: X,
  sparkles: Sparkles,
  command: Command,
  location: MapPin,
  plus: Plus,
  check: Check,
  save: Save,
  publish: Upload,
  trash: Trash2,
  logout: LogOut,
};
export type IconName = keyof typeof icons;
export default function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: Omit<LucideProps, "name"> & { name: IconName }) {
  const Component = icons[name];
  return (
    <Component
      {...props}
      size={size}
      strokeWidth={strokeWidth}
      className={`ui-icon ${className}`}
      aria-hidden="true"
      focusable="false"
    />
  );
}
