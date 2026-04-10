import {
  Building2,
  Package,
  CreditCard,
  HelpCircle,
  Wrench,
  ShieldCheck,
  Mail,
  Folder,
  BookOpen,
  Sparkles,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Building2,
  Package,
  CreditCard,
  HelpCircle,
  Wrench,
  ShieldCheck,
  Mail,
  Folder,
  BookOpen,
  Sparkles,
  MessageSquare,
};

export function getCategoryIcon(name?: string): LucideIcon {
  if (!name) return Folder;
  return MAP[name] ?? Folder;
}
