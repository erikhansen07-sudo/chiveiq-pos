import { useState } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { MenuItem } from '@/app/components/menu-item';
import { OrderItem } from '@/app/components/order-item';
import type { MenuItem as MenuItemType, OrderItem as OrderItemType } from './types';

interface OrderTabProps {
  menuItems: MenuItemType[];
  onItemClick: (item: MenuItemType) => void;
  orderItems: OrderItemType[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearOrder: () => void;
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
}

export function OrderTab({
  menuItems,
  onItemClick,
  orderItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  subtotal,
  tax,
  total,
  onCheckout,
}: OrderTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('Burgers');

  // Get unique categories
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  // Filter items by selected category
  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="flex h-full">
      {/* Menu Section */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl">
          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 font-medium transition-colors ${
                  selectedCategory === category
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <MenuItem 
                key={item.id} 
                item={{ 
                  id: item.id, 
                  name: item.name, 
                  price: item.variants[0].price, 
                  category: item.category 
                }} 
                onAdd={() => onItemClick(item)} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Order Summary Section */}
      <div className="w-96 bg-white border-l border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Current Order</h2>
          </div>
          <p className="text-sm text-muted-foreground">{orderItems.length} items</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {orderItems.length === 0 ? (
            <div className="text-center text-muted-foreground mt-12">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No items in order</p>
            </div>
          ) : (
            <div>
              {orderItems.map((item) => (
                <OrderItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          )}
        </div>

        {orderItems.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-border">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={onCheckout}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-colors"
              >
                Checkout
              </button>
              <button
                onClick={onClearOrder}
                className="w-full flex items-center justify-center gap-2 border border-border py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
