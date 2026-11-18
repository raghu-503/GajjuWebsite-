import {
  ArrowRight, ArrowUpRight, Box, Boxes, Check, ChevronLeft, ChevronRight, Clock, CreditCard, Hand,
  Landmark, Lock, LogOut, Mail, Menu, Minus, Moon, Move3d, Package, Plus, RotateCcw, Search,
  ShieldCheck, ShoppingBag, Smartphone, Star, Sun, Trash2, Truck, User, X, Zap, ZoomIn, ZoomOut,
  AudioLines, Pause, BookOpenCheck, BrainCircuit, Cable, CircleDot, Code, Cog, CookingPot, Cuboid, DoorOpen, Footprints, ListChecks, Play, PlugZap, Users, WifiOff, Wrench,
} from 'lucide-react';

// Kebab-case names, matching the old <i data-lucide="…"> markup, so icons can be picked by name
// (toasts, shipping methods, …).
const ICONS = {
  'audio-lines': AudioLines,
  'book-open-check': BookOpenCheck,
  'brain-circuit': BrainCircuit,
  'cable': Cable,
  'circle-dot': CircleDot,
  'code': Code,
  'cog': Cog,
  'cooking-pot': CookingPot,
  'cuboid': Cuboid,
  'door-open': DoorOpen,
  'footprints': Footprints,
  'list-checks': ListChecks,
  'play': Play,
  'pause': Pause,
  'plug-zap': PlugZap,
  'users': Users,
  'wifi-off': WifiOff,
  'wrench': Wrench,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  box: Box,
  boxes: Boxes,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock,
  'credit-card': CreditCard,
  hand: Hand,
  landmark: Landmark,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  menu: Menu,
  minus: Minus,
  moon: Moon,
  'move-3d': Move3d,
  package: Package,
  plus: Plus,
  'rotate-ccw': RotateCcw,
  search: Search,
  'shield-check': ShieldCheck,
  'shopping-bag': ShoppingBag,
  smartphone: Smartphone,
  star: Star,
  sun: Sun,
  'trash-2': Trash2,
  truck: Truck,
  user: User,
  x: X,
  zap: Zap,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
};

export default function Icon({ name, ...props }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp strokeWidth={1.6} aria-hidden="true" {...props} />;
}
