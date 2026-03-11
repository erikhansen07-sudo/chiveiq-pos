import { useState } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { OrderTab } from './OrderTab';
import { SummaryTab } from './SummaryTab';
import { TransactionsTab } from './TransactionsTab';
import type { MenuItem as MenuItemType, OrderItem as OrderItemType } from './types';
import { useAppData } from '@/app/context/AppDataContext';

interface POSModuleProps {
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

export function POSModule({
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
}: POSModuleProps) {
  const [activeTab, setActiveTab] = useState<'order' | 'summary' | 'transactions'>('order');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { transactions, employees, timePunches } = useAppData();

  const handleSummaryRowClick = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('transactions');
  };

  const handleBackToSummary = () => {
    setSelectedDate(null);
    setActiveTab('summary');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab('order')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'order'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Order
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'order' && (
          <OrderTab
            menuItems={menuItems}
            onItemClick={onItemClick}
            orderItems={orderItems}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onClearOrder={onClearOrder}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onCheckout={onCheckout}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryTab
            transactions={transactions}
            onRowClick={handleSummaryRowClick}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            selectedDate={selectedDate}
            onBackToSummary={selectedDate ? handleBackToSummary : undefined}
            employees={employees}
            timePunches={timePunches}
          />
        )}
      </div>
    </div>
  );
}