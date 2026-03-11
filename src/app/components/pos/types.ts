export interface MenuItem {
  id: string;
  name: string;
  category: string;
  variants: MenuVariant[];
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  ingredients: VariantIngredient[];
}

export interface VariantIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  variantId: string;
  variantName: string;
  basePrice: number;
  quantity: number;
  modifications: Modification[];
  finalPrice: number;
}

export interface Modification {
  type: 'add' | 'remove' | 'extra';
  ingredient: string;
  priceAdjustment: number;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  discounts?: number;
  voids?: number;
  tips?: number;
  paymentMethod?: string;
}

export interface TransactionItem {
  name: string;
  price: number;
  quantity: number;
}

export interface DailySummary {
  date: Date;
  grossSales: number;
  discounts: number;
  voids: number;
  netSales: number;
  tipsCollected: number;
  transactionCount: number;
  avgTransaction: number;
}
