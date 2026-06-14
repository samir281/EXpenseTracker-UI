import {
  Utensils, ShoppingBag, Car, Fuel, Smartphone, Clapperboard,
  Heart, ShoppingCart, ArrowLeftRight, Package, Plane, Zap, CreditCard, Banknote, RotateCcw, Inbox,
} from "lucide-react";

export const CATEGORIES = {
  "Food Delivery":      { icon: Utensils,        color: "#E8364E" },
  "Dining Out":         { icon: Utensils,        color: "#F97316" },
  "Quick Commerce":     { icon: Zap,             color: "#A855F7" },
  "Online Shopping":    { icon: ShoppingBag,      color: "#EC4899" },
  "Cab / Ride":         { icon: Car,             color: "#06B6D4" },
  "Airlines / Flights": { icon: Plane,           color: "#3B82F6" },
  "Fuel":               { icon: Fuel,            color: "#F59E0B" },
  "Bills & Utilities":  { icon: Smartphone,      color: "#3B82F6" },
  "Entertainment":      { icon: Clapperboard,    color: "#EC4899" },
  "Health":             { icon: Heart,           color: "#F97316" },
  "Groceries":          { icon: ShoppingCart,     color: "#22C55E" },
  "Bill Payment":       { icon: CreditCard,      color: "#6B7280" },
  "Transfer/UPI":       { icon: ArrowLeftRight,   color: "#8B8B8B" },
  "Other":              { icon: Package,         color: "#6B7280" },
  "Salary":             { icon: Banknote,        color: "#22C55E" },
  "Refund":             { icon: RotateCcw,       color: "#06B6D4" },
  "Transfer Received":  { icon: Inbox,           color: "#22C55E" },
  "Other Income":       { icon: Banknote,        color: "#22C55E" },
};

export const CATEGORY_NAMES = [
  "Food Delivery", "Dining Out", "Quick Commerce", "Online Shopping",
  "Cab / Ride", "Airlines / Flights", "Fuel", "Bills & Utilities",
  "Entertainment", "Health", "Groceries", "Bill Payment", "Transfer/UPI", "Other",
];

export function getCategoryConfig(name) {
  return CATEGORIES[name] || CATEGORIES["Other"];
}

export const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

export function formatDateLong(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", weekday: "short",
  });
}