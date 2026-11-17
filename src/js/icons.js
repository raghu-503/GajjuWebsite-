import {
  createIcons, Search, User, ShoppingBag, Menu, X, Plus, Minus, Trash2, ArrowRight, ArrowUpRight,
  ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Layers, Box, Check, Star, Truck, ShieldCheck,
  Package, Cpu, Radar, Gauge, Wrench, Rocket, FlaskConical, Clock, Mail, Lock, CreditCard, Wallet,
  Columns2, SlidersHorizontal, Move3d, MousePointerClick, Boxes, CircleCheck, Play, Pause, Zap, LogOut,
  Smartphone, Landmark, BatteryCharging, Eye, Hand, Sun, Moon, RefreshCw,
} from 'lucide';

const ICONS = {
  Search, User, ShoppingBag, Menu, X, Plus, Minus, Trash2, ArrowRight, ArrowUpRight, ChevronLeft,
  ChevronRight, RotateCcw, ZoomIn, ZoomOut, Layers, Box, Check, Star, Truck, ShieldCheck, Package, Cpu,
  Radar, Gauge, Wrench, Rocket, FlaskConical, Clock, Mail, Lock, CreditCard, Wallet, Columns2,
  SlidersHorizontal, Move3d, MousePointerClick, Boxes, CircleCheck, Play, Pause, Zap, LogOut, Smartphone,
  Landmark, BatteryCharging, Eye, Hand, Sun, Moon, RefreshCw,
};

/** Replace any <i data-lucide="name"> in the document (or a subtree) with inline SVG. */
export function refreshIcons() {
  createIcons({ icons: ICONS, attrs: { 'stroke-width': 1.6 } });
}
