import { X, CreditCard, Banknote } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '@/app/context/AppDataContext';

interface OrderItemType {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutModalProps {
  orderItems: OrderItemType[];
  subtotal: number;
  tax: number;
  total: number;
  onClose: () => void;
  onComplete: () => void;
}

export function CheckoutModal({ orderItems, subtotal, tax, total, onClose, onComplete }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | null>(null);
  const [processing, setProcessing] = useState(false);
  const { addTransaction } = useAppData();

  const handlePayment = () => {
    setProcessing(true);
    
    // Record the transaction
    addTransaction({
      timestamp: new Date(),
      items: orderItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      tax,
      total,
    });
    
    setTimeout(() => {
      onComplete();
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Total</span>
            <span className="text-3xl font-semibold">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <button
            onClick={() => setPaymentMethod('card')}
            className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-colors ${
              paymentMethod === 'card'
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-6 h-6" />
            <span className="font-medium">Card</span>
          </button>
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-colors ${
              paymentMethod === 'cash'
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Banknote className="w-6 h-6" />
            <span className="font-medium">Cash</span>
          </button>
        </div>

        <button
          onClick={handlePayment}
          disabled={!paymentMethod || processing}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </div>
  );
}