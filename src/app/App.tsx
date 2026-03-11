import { useState, useMemo } from 'react';
import { MenuItem } from '@/app/components/menu-item';
import { OrderItem } from '@/app/components/order-item';
import { CheckoutModal } from '@/app/components/checkout-modal';
import { RecipeModal } from '@/app/components/recipe-modal';
import { AddItemModal } from '@/app/components/add-item-modal';
import { ModifyRecipeModal } from '@/app/components/modify-recipe-modal';
import { InventoryModule } from '@/app/components/inventory-module';
import { LaborModule } from '@/app/components/labor';
import { LivePLModule } from '@/app/components/livepl';
import { OperationsModule } from '@/app/components/operations';
import { TodayPageWrapper } from '@/app/components/TodayPageWrapper';
import { AppDataProvider, useAppData } from '@/app/context/AppDataContext';
import { POSModule } from '@/app/components/pos';
import { ShoppingCart, Trash2, Search, X, ArrowLeft } from 'lucide-react';

interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
}

interface Variant {
  name: string;
  price: number;
  recipe: InventoryItem[];
}

interface MenuItemType {
  id: string;
  name: string;
  category: string;
  variants: Variant[];
}

interface RecipeHistoryEntry {
  id: string;
  menuItemId: string;
  variantIndex: number;
  recipe: { name: string; quantity: number; unit: string }[];
  retailPrice: number;
  cost: number;
  costPercent: number;
  startDate: Date;
  endDate: Date | null; // null if current
  publishedBy: string;
}

interface Modification {
  ingredient: string;
  action: 'remove' | 'extra';
}

interface OrderItemType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifications?: Modification[];
}

const menuItemsInitial: MenuItemType[] = [
  // Burgers
  { 
    id: '1', 
    name: 'Classic Burger', 
    category: 'Burgers',
    variants: [
      {
        name: 'Single',
        price: 8.99,
        recipe: [
          { name: 'Hamburger Buns', quantity: 1, unit: 'Bun Sets' },
          { name: 'Ground Beef', quantity: 1, unit: 'Patties' },
          { name: 'Iceberg Lettuce', quantity: 2, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 2, unit: 'Slices' },
          { name: 'Onions', quantity: 2, unit: 'Slices' },
          { name: 'Pickles', quantity: 3, unit: 'Slices' },
          { name: 'Ketchup', quantity: 2, unit: 'Squirts' },
          { name: 'Mustard', quantity: 1, unit: 'Squirts' },
        ]
      },
      {
        name: 'Double',
        price: 11.99,
        recipe: [
          { name: 'Hamburger Buns', quantity: 1, unit: 'Bun Sets' },
          { name: 'Ground Beef', quantity: 2, unit: 'Patties' },
          { name: 'Iceberg Lettuce', quantity: 3, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 3, unit: 'Slices' },
          { name: 'Onions', quantity: 3, unit: 'Slices' },
          { name: 'Pickles', quantity: 4, unit: 'Slices' },
          { name: 'Ketchup', quantity: 3, unit: 'Squirts' },
          { name: 'Mustard', quantity: 2, unit: 'Squirts' },
        ]
      }
    ]
  },
  { 
    id: '2', 
    name: 'Cheeseburger', 
    category: 'Burgers',
    variants: [
      {
        name: 'Single',
        price: 9.99,
        recipe: [
          { name: 'Hamburger Buns', quantity: 1, unit: 'Bun Sets' },
          { name: 'Ground Beef', quantity: 1, unit: 'Patties' },
          { name: 'Cheddar Cheese', quantity: 1, unit: 'Slices' },
          { name: 'Iceberg Lettuce', quantity: 2, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 2, unit: 'Slices' },
          { name: 'Onions', quantity: 2, unit: 'Slices' },
          { name: 'Pickles', quantity: 3, unit: 'Slices' },
          { name: 'Ketchup', quantity: 2, unit: 'Squirts' },
          { name: 'Mustard', quantity: 1, unit: 'Squirts' },
        ]
      },
      {
        name: 'Double',
        price: 12.99,
        recipe: [
          { name: 'Hamburger Buns', quantity: 1, unit: 'Bun Sets' },
          { name: 'Ground Beef', quantity: 2, unit: 'Patties' },
          { name: 'Cheddar Cheese', quantity: 2, unit: 'Slices' },
          { name: 'Iceberg Lettuce', quantity: 3, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 3, unit: 'Slices' },
          { name: 'Onions', quantity: 3, unit: 'Slices' },
          { name: 'Pickles', quantity: 4, unit: 'Slices' },
          { name: 'Ketchup', quantity: 3, unit: 'Squirts' },
          { name: 'Mustard', quantity: 2, unit: 'Squirts' },
        ]
      }
    ]
  },
  { 
    id: '3', 
    name: 'Bacon Burger', 
    category: 'Burgers',
    variants: [
      {
        name: 'Single',
        price: 10.99,
        recipe: [
          { name: 'Hamburger Buns', quantity: 1, unit: 'Bun Sets' },
          { name: 'Ground Beef', quantity: 1, unit: 'Patties' },
          { name: 'Bacon', quantity: 3, unit: 'Slices' },
          { name: 'Cheddar Cheese', quantity: 1, unit: 'Slices' },
          { name: 'Iceberg Lettuce', quantity: 2, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 2, unit: 'Slices' },
          { name: 'Onions', quantity: 2, unit: 'Slices' },
          { name: 'BBQ Sauce', quantity: 2, unit: 'Squirts' },
        ]
      },
      {
        name: 'Double',
        price: 13.99,
        recipe: [
          { name: 'Hamburger Buns', quantity: 1, unit: 'Bun Sets' },
          { name: 'Ground Beef', quantity: 2, unit: 'Patties' },
          { name: 'Bacon', quantity: 5, unit: 'Slices' },
          { name: 'Cheddar Cheese', quantity: 2, unit: 'Slices' },
          { name: 'Iceberg Lettuce', quantity: 3, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 3, unit: 'Slices' },
          { name: 'Onions', quantity: 3, unit: 'Slices' },
          { name: 'BBQ Sauce', quantity: 3, unit: 'Squirts' },
        ]
      }
    ]
  },
  { 
    id: '4', 
    name: 'Veggie Burger', 
    category: 'Burgers',
    variants: [
      {
        name: 'Regular',
        price: 9.49,
        recipe: [
          { name: 'Hamburger Buns', quantity: 1, unit: 'Bun Sets' },
          { name: 'Veggie Patty', quantity: 1, unit: 'Patties' },
          { name: 'Iceberg Lettuce', quantity: 3, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 3, unit: 'Slices' },
          { name: 'Onions', quantity: 2, unit: 'Slices' },
          { name: 'Avocado', quantity: 3, unit: 'Slices' },
          { name: 'Mayo', quantity: 2, unit: 'Squirts' },
        ]
      }
    ]
  },
  
  // Sides
  { 
    id: '5', 
    name: 'French Fries', 
    category: 'Sides',
    variants: [
      {
        name: 'Small',
        price: 2.99,
        recipe: [
          { name: 'French Fries', quantity: 1, unit: 'Scoops' },
        ]
      },
      {
        name: 'Medium',
        price: 3.99,
        recipe: [
          { name: 'French Fries', quantity: 1.5, unit: 'Scoops' },
        ]
      },
      {
        name: 'Large',
        price: 4.99,
        recipe: [
          { name: 'French Fries', quantity: 2, unit: 'Scoops' },
        ]
      }
    ]
  },
  { 
    id: '6', 
    name: 'Onion Rings', 
    category: 'Sides',
    variants: [
      {
        name: 'Small',
        price: 3.49,
        recipe: [
          { name: 'Onions', quantity: 8, unit: 'Slices' },
        ]
      },
      {
        name: 'Large',
        price: 4.99,
        recipe: [
          { name: 'Onions', quantity: 12, unit: 'Slices' },
        ]
      }
    ]
  },
  { 
    id: '7', 
    name: 'Garden Salad', 
    category: 'Sides',
    variants: [
      {
        name: 'Small',
        price: 3.99,
        recipe: [
          { name: 'Iceberg Lettuce', quantity: 8, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 3, unit: 'Slices' },
        ]
      },
      {
        name: 'Large',
        price: 5.99,
        recipe: [
          { name: 'Iceberg Lettuce', quantity: 12, unit: 'Leaves' },
          { name: 'Tomatoes', quantity: 5, unit: 'Slices' },
        ]
      }
    ]
  },
  { 
    id: '8', 
    name: 'Coleslaw', 
    category: 'Sides',
    variants: [
      {
        name: 'Regular',
        price: 3.49,
        recipe: [
          { name: 'Iceberg Lettuce', quantity: 10, unit: 'Leaves' },
          { name: 'Mayo', quantity: 3, unit: 'Squirts' },
        ]
      }
    ]
  },
  
  // Drinks
  { 
    id: '9', 
    name: 'Soft Drink', 
    category: 'Drinks',
    variants: [
      {
        name: 'Small',
        price: 1.99,
        recipe: [
          { name: 'Coca-Cola Syrup', quantity: 1.5, unit: 'Ounces' },
          { name: 'Paper Cups (12oz)', quantity: 1, unit: 'Cups' },
        ]
      },
      {
        name: 'Medium',
        price: 2.49,
        recipe: [
          { name: 'Coca-Cola Syrup', quantity: 2, unit: 'Ounces' },
          { name: 'Paper Cups (12oz)', quantity: 1, unit: 'Cups' },
        ]
      },
      {
        name: 'Large',
        price: 2.99,
        recipe: [
          { name: 'Coca-Cola Syrup', quantity: 3, unit: 'Ounces' },
          { name: 'Paper Cups (12oz)', quantity: 1, unit: 'Cups' },
        ]
      }
    ]
  },
  { 
    id: '10', 
    name: 'Iced Tea', 
    category: 'Drinks',
    variants: [
      {
        name: 'Small',
        price: 1.99,
        recipe: [
          { name: 'Paper Cups (12oz)', quantity: 1, unit: 'Cups' },
        ]
      },
      {
        name: 'Medium',
        price: 2.49,
        recipe: [
          { name: 'Paper Cups (12oz)', quantity: 1, unit: 'Cups' },
        ]
      },
      {
        name: 'Large',
        price: 2.99,
        recipe: [
          { name: 'Paper Cups (12oz)', quantity: 1, unit: 'Cups' },
        ]
      }
    ]
  },
  { 
    id: '11', 
    name: 'Milkshake', 
    category: 'Drinks',
    variants: [
      {
        name: 'Small',
        price: 3.99,
        recipe: [
          { name: 'Milk', quantity: 1.5, unit: 'Cups' },
          { name: 'Paper Cups (12oz)', quantity: 1, unit: 'Cups' },
        ]
      },
      {
        name: 'Large',
        price: 5.49,
        recipe: [
          { name: 'Milk', quantity: 2.5, unit: 'Cups' },
          { name: 'Paper Cups (12oz)', quantity: 1, unit: 'Cups' },
        ]
      }
    ]
  },
  { 
    id: '12', 
    name: 'Bottled Water', 
    category: 'Drinks',
    variants: [
      {
        name: 'Small',
        price: 1.49,
        recipe: []
      },
      {
        name: 'Large',
        price: 1.99,
        recipe: []
      }
    ]
  },
  
  // Desserts
  { 
    id: '13', 
    name: 'Apple Pie', 
    category: 'Desserts',
    variants: [
      {
        name: 'Regular',
        price: 3.99,
        recipe: []
      }
    ]
  },
  { 
    id: '14', 
    name: 'Ice Cream Cone', 
    category: 'Desserts',
    variants: [
      {
        name: 'Single Scoop',
        price: 2.99,
        recipe: []
      },
      {
        name: 'Double Scoop',
        price: 4.49,
        recipe: []
      }
    ]
  },
  { 
    id: '15', 
    name: 'Brownie', 
    category: 'Desserts',
    variants: [
      {
        name: 'Regular',
        price: 3.99,
        recipe: []
      }
    ]
  },
  { 
    id: '16', 
    name: 'Cookie', 
    category: 'Desserts',
    variants: [
      {
        name: 'Regular',
        price: 2.49,
        recipe: []
      }
    ]
  },
];

const categories = ['Burgers', 'Sides', 'Drinks', 'Desserts'];

// Inventory data for cost calculations
const inventoryItems = [
  { itemName: 'Iceberg Lettuce', lastVendorPrice: 28.50, orderingMinorCount: 24, preparedConversion: 20 },
  { itemName: 'Strawberries', lastVendorPrice: 18.75, orderingMinorCount: 5, preparedConversion: 12 },
  { itemName: 'Tomatoes', lastVendorPrice: 32.00, orderingMinorCount: 25, preparedConversion: 6 },
  { itemName: 'French Fries', lastVendorPrice: 49.50, orderingMinorCount: 6, preparedConversion: 10 },
  { itemName: 'Onions', lastVendorPrice: 22.50, orderingMinorCount: 50, preparedConversion: 8 },
  { itemName: 'Ground Beef', lastVendorPrice: 84.00, orderingMinorCount: 40, preparedConversion: 4 },
  { itemName: 'Chicken Breast', lastVendorPrice: 92.00, orderingMinorCount: 40, preparedConversion: 4 },
  { itemName: 'Bacon', lastVendorPrice: 45.00, orderingMinorCount: 10, preparedConversion: 12 },
  { itemName: 'Cheddar Cheese', lastVendorPrice: 19.00, orderingMinorCount: 4, preparedConversion: 16 },
  { itemName: 'Milk', lastVendorPrice: 14.00, orderingMinorCount: 4, preparedConversion: 16 },
  { itemName: 'Hamburger Buns', lastVendorPrice: 12.50, orderingMinorCount: 6, preparedConversion: 8 },
  { itemName: 'Coca-Cola Syrup', lastVendorPrice: 87.50, orderingMinorCount: 1, preparedConversion: 640 },
  { itemName: 'Ketchup', lastVendorPrice: 15.60, orderingMinorCount: 12, preparedConversion: 100 },
  { itemName: 'Paper Cups (12oz)', lastVendorPrice: 44.00, orderingMinorCount: 20, preparedConversion: 50 },
  { itemName: 'Mustard', lastVendorPrice: 14.40, orderingMinorCount: 12, preparedConversion: 100 },
  { itemName: 'Pickles', lastVendorPrice: 18.00, orderingMinorCount: 4, preparedConversion: 16 },
  { itemName: 'BBQ Sauce', lastVendorPrice: 16.80, orderingMinorCount: 12, preparedConversion: 100 },
  { itemName: 'Mayo', lastVendorPrice: 19.20, orderingMinorCount: 12, preparedConversion: 100 },
  { itemName: 'Avocado', lastVendorPrice: 38.40, orderingMinorCount: 48, preparedConversion: 10 },
  { itemName: 'Veggie Patty', lastVendorPrice: 64.00, orderingMinorCount: 32, preparedConversion: 1 },
];

// Calculate cost per prepared unit
const calculatePreparedUnitCost = (itemName: string): number => {
  const invItem = inventoryItems.find(item => item.itemName === itemName);
  if (!invItem) return 0;
  
  // Cost per case / units per case = cost per counting unit
  const costPerCountingUnit = invItem.lastVendorPrice / invItem.orderingMinorCount;
  
  // Cost per counting unit / prepared units per counting unit = cost per prepared unit
  const costPerPreparedUnit = costPerCountingUnit / invItem.preparedConversion;
  
  return costPerPreparedUnit;
};

function App() {
  const { transactions } = useAppData();
  const [mainTab, setMainTab] = useState<'today' | 'pos' | 'recipes' | 'inventory' | 'labor' | 'livepl' | 'operations'>('today');
  const [selectedCategory, setSelectedCategory] = useState('Burgers');
  const [orderItems, setOrderItems] = useState<OrderItemType[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<MenuItemType | null>(null);
  const [itemToAdd, setItemToAdd] = useState<MenuItemType | null>(null);
  const [showModifyRecipe, setShowModifyRecipe] = useState(false);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<{ menuItem: MenuItemType; variantIndex: number; sku: string } | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulatedRecipe, setSimulatedRecipe] = useState<{ name: string; quantity: number; unit: string }[]>([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [selectedNewIngredient, setSelectedNewIngredient] = useState('');
  const [recipeHistory, setRecipeHistory] = useState<RecipeHistoryEntry[]>([]);
  const [recipeDetailTab, setRecipeDetailTab] = useState<'recipe' | 'history'>('recipe');
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<RecipeHistoryEntry | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>(menuItemsInitial);
  const [simulatedPrice, setSimulatedPrice] = useState<number>(0);

  const handleItemClick = (item: MenuItemType) => {
    setItemToAdd(item);
  };

  const handleDirectAdd = () => {
    if (!itemToAdd) return;
    
    const defaultVariant = itemToAdd.variants[0];
    setOrderItems((prev) => {
      const itemKey = `${itemToAdd.id}-${defaultVariant.name}-${Date.now()}`;
      return [...prev, { 
        id: itemKey, 
        name: `${itemToAdd.name} (${defaultVariant.name})`, 
        price: defaultVariant.price, 
        quantity: 1 
      }];
    });
    setItemToAdd(null);
  };

  const handleModifyThenAdd = () => {
    setShowModifyRecipe(true);
  };

  const handleAddModifiedItem = (variantName: string, modifications: Modification[]) => {
    if (!itemToAdd) return;
    
    const selectedVariant = itemToAdd.variants.find(v => v.name === variantName);
    if (!selectedVariant) return;

    const itemKey = `${itemToAdd.id}-${variantName}-${Date.now()}`;

    setOrderItems((prev) => {
      return [...prev, { 
        id: itemKey, 
        name: `${itemToAdd.name} (${variantName})`, 
        price: selectedVariant.price, 
        quantity: 1,
        modifications 
      }];
    });
    
    setItemToAdd(null);
    setShowModifyRecipe(false);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(id);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  const handleCheckoutComplete = () => {
    setOrderItems([]);
    setShowCheckout(false);
  };

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const filteredItems = menuItems.filter(
    (item) => item.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ChiveIQ Brand Header */}
      <div className="bg-card border-b border-border px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{background:'#2ba854'}}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="#fdfcf8" strokeWidth="1.8" fill="none"/>
              <circle cx="10" cy="10" r="2.5" fill="#fdfcf8" opacity="0.6"/>
            </svg>
          </div>
          <span style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:'1rem',letterSpacing:'-0.02em',color:'#1e7145'}}>ChiveIQ</span>
        </div>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',color:'rgba(15,26,18,0.35)',textTransform:'uppercase'}}>Restaurant Operations Platform</span>
      </div>
      {/* Main Tabs */}
      <div className="bg-card border-b border-border">
        <div className="flex gap-8 px-8">
          <button
            onClick={() => setMainTab('today')}
            className={`px-4 py-6 font-semibold transition-colors ${
              mainTab === 'today'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setMainTab('pos')}
            className={`px-4 py-6 font-semibold transition-colors ${
              mainTab === 'pos'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Point of Sale
          </button>
          <button
            onClick={() => setMainTab('recipes')}
            className={`px-4 py-6 font-semibold transition-colors ${
              mainTab === 'recipes'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Recipes
          </button>
          <button
            onClick={() => setMainTab('inventory')}
            className={`px-4 py-6 font-semibold transition-colors ${
              mainTab === 'inventory'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setMainTab('labor')}
            className={`px-4 py-6 font-semibold transition-colors ${
              mainTab === 'labor'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Labor
          </button>
          <button
            onClick={() => setMainTab('livepl')}
            className={`px-4 py-6 font-semibold transition-colors ${
              mainTab === 'livepl'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Live P&L
          </button>
          <button
            onClick={() => setMainTab('operations')}
            className={`px-4 py-6 font-semibold transition-colors ${
              mainTab === 'operations'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Operations
          </button>
        </div>
      </div>

      {/* Today View */}
      {mainTab === 'today' && (
        <TodayPageWrapper />
      )}

      {/* Point of Sale View */}
      {mainTab === 'pos' && (
        <POSModule
          menuItems={menuItems}
          onItemClick={handleItemClick}
          orderItems={orderItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearOrder={clearOrder}
          subtotal={subtotal}
          tax={tax}
          total={total}
          onCheckout={() => setShowCheckout(true)}
        />
      )}

      {/* Recipes View */}
      {mainTab === 'recipes' && (() => {
        // If viewing recipe detail, show detail screen
        if (selectedRecipeDetail) {
          const { menuItem, variantIndex, sku } = selectedRecipeDetail;
          const variant = menuItem.variants[variantIndex];

          // Initialize simulated recipe if showing simulation
          if (showSimulation && simulatedRecipe.length === 0) {
            setSimulatedRecipe([...variant.recipe]);
            setSimulatedPrice(variant.price);
          }

          // Calculate costs
          const originalCost = variant.recipe.reduce((sum, ingredient) => {
            const costPerUnit = calculatePreparedUnitCost(ingredient.name);
            return sum + (costPerUnit * ingredient.quantity);
          }, 0);

          const simulatedCost = simulatedRecipe.reduce((sum, ingredient) => {
            const costPerUnit = calculatePreparedUnitCost(ingredient.name);
            return sum + (costPerUnit * ingredient.quantity);
          }, 0);

          const originalGrossProfit = variant.price - originalCost;
          const simulatedGrossProfit = simulatedPrice - simulatedCost;
          const originalCostPercent = (originalCost / variant.price) * 100;
          const simulatedCostPercent = simulatedPrice > 0 ? (simulatedCost / simulatedPrice) * 100 : 0;

          return (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                  onClick={() => {
                    setSelectedRecipeDetail(null);
                    setShowSimulation(false);
                    setSimulatedRecipe([]);
                    setSimulatedPrice(0);
                  }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Recipes</span>
                </button>

                {/* Recipe Header */}
                <div className="bg-card rounded-lg border border-border p-8 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">SKU</div>
                      <div className="font-mono text-xl font-semibold text-foreground mb-3">
                        {sku}
                      </div>
                      <h1 className="text-3xl font-semibold text-foreground mb-2">
                        {menuItem.name} ({variant.name})
                      </h1>
                      <div className="text-sm text-muted-foreground">
                        Category: <span className="font-medium">{menuItem.category}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Price</div>
                        <div className="text-3xl font-semibold text-foreground">
                          ${variant.price.toFixed(2)}
                        </div>
                      </div>
                      {recipeDetailTab === 'recipe' && (
                        <button
                          onClick={() => {
                            if (showSimulation) {
                              setShowSimulation(false);
                              setSimulatedRecipe([]);
                              setSimulatedPrice(0);
                            } else {
                              setShowSimulation(true);
                              setSimulatedRecipe([...variant.recipe]);
                              setSimulatedPrice(variant.price);
                            }
                          }}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium text-sm"
                        >
                          {showSimulation ? 'Exit Simulation' : 'SIMULATE MODIFICATION'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-6 border-b border-border mt-6">
                    <button
                      onClick={() => {
                        setRecipeDetailTab('recipe');
                        setSelectedHistoryEntry(null);
                      }}
                      className={`pb-3 px-1 font-medium transition-colors ${
                        recipeDetailTab === 'recipe'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      RECIPE
                    </button>
                    <button
                      onClick={() => {
                        setRecipeDetailTab('history');
                        setShowSimulation(false);
                        setSimulatedRecipe([]);
                        setSimulatedPrice(0);
                      }}
                      className={`pb-3 px-1 font-medium transition-colors ${
                        recipeDetailTab === 'history'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      HISTORY
                    </button>
                  </div>
                </div>

                {recipeDetailTab === 'recipe' && !showSimulation ? (
                  /* Original Recipe View */
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-border">
                      <h2 className="text-lg font-semibold text-foreground">Recipe Ingredients</h2>
                    </div>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-border">
                        <tr>
                          <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Item</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Qty</th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Prepared UOM</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {variant.recipe.map((ingredient, index) => {
                          const costPerUnit = calculatePreparedUnitCost(ingredient.name);
                          const lineCost = costPerUnit * ingredient.quantity;
                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 text-sm font-medium text-foreground">{ingredient.name}</td>
                              <td className="px-6 py-4 text-sm text-right text-foreground">{ingredient.quantity}</td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">{ingredient.unit}</td>
                              <td className="px-6 py-4 text-sm text-right text-foreground">${lineCost.toFixed(3)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Total Recipe Cost:</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                            ${originalCost.toFixed(3)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Menu Price:</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                            ${variant.price.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Gross Profit:</td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">
                            ${originalGrossProfit.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Cost %:</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                            {originalCostPercent.toFixed(1)}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : recipeDetailTab === 'history' ? (
                  /* History View */
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-border">
                      <h2 className="text-lg font-semibold text-foreground">Recipe Change History</h2>
                    </div>
                    {recipeHistory.filter(h => h.menuItemId === menuItem.id && h.variantIndex === variantIndex).length === 0 ? (
                      <div className="px-6 py-12 text-center text-gray-500">
                        No history records yet. Changes will appear here after publishing recipe modifications.
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-border">
                          <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Effective Date</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Replaced Date</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Retail Price</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Cost</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Cost %</th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {recipeHistory
                            .filter(h => h.menuItemId === menuItem.id && h.variantIndex === variantIndex)
                            .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                            .map((entry) => (
                              <tr 
                                key={entry.id}
                                onClick={() => setSelectedHistoryEntry(entry)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {entry.startDate.toLocaleDateString()} {entry.startDate.toLocaleTimeString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {entry.endDate ? `${entry.endDate.toLocaleDateString()} ${entry.endDate.toLocaleTimeString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-foreground">
                                  ${entry.retailPrice.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-foreground">
                                  ${entry.cost.toFixed(3)}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-foreground">
                                  {entry.costPercent.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {entry.endDate === null ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      CURRENT
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      Historical
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  /* Side-by-Side Simulation View */
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left: Original Recipe */}
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground">Original Recipe</h2>
                      </div>
                      <div className="p-6 space-y-3">
                        {variant.recipe.map((ingredient, index) => {
                          const costPerUnit = calculatePreparedUnitCost(ingredient.name);
                          const lineCost = costPerUnit * ingredient.quantity;
                          return (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{ingredient.name}</div>
                                <div className="text-sm text-gray-500">{ingredient.quantity} {ingredient.unit}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">${lineCost.toFixed(3)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-gray-900">Total Cost:</span>
                          <span className="font-semibold text-gray-900">${originalCost.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-gray-900">Gross Profit:</span>
                          <span className="font-semibold text-green-600">${originalGrossProfit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-gray-900">Cost %:</span>
                          <span className="font-semibold text-gray-900">{originalCostPercent.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Simulated Recipe */}
                    <div className="bg-white rounded-lg border-2 border-blue-600 overflow-hidden">
                      <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-blue-900">Simulated Recipe</h2>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-900">Retail Price:</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={simulatedPrice}
                              onChange={(e) => setSimulatedPrice(parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-blue-300 rounded text-sm text-right font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        {simulatedRecipe.map((ingredient, index) => {
                          const costPerUnit = calculatePreparedUnitCost(ingredient.name);
                          const lineCost = costPerUnit * ingredient.quantity;
                          return (
                            <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{ingredient.name}</div>
                                <div className="text-sm text-gray-500">{ingredient.unit}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={ingredient.quantity}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 0;
                                    setSimulatedRecipe(prev => 
                                      prev.map((ing, i) => i === index ? { ...ing, quantity: newQty } : ing)
                                    );
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                />
                                <button
                                  onClick={() => {
                                    setSimulatedRecipe(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Remove"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="w-20 text-right">
                                <div className="font-medium text-gray-900">${lineCost.toFixed(3)}</div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Add Ingredient Row */}
                        {!showAddIngredient ? (
                          <div className="pt-3">
                            <button
                              onClick={() => {
                                setShowAddIngredient(true);
                                setSelectedNewIngredient('');
                              }}
                              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground hover:border-blue-600 hover:text-blue-600 transition-colors"
                            >
                              + Add Ingredient
                            </button>
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 mt-3">
                              <select
                                value={selectedNewIngredient}
                                onChange={(e) => setSelectedNewIngredient(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                autoFocus
                              >
                                <option value="">Select an ingredient...</option>
                                {inventoryItems
                                  .filter(invItem => !simulatedRecipe.some(ing => ing.name === invItem.itemName))
                                  .map((invItem) => (
                                    <option key={invItem.itemName} value={invItem.itemName}>
                                      {invItem.itemName}
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => {
                                  if (selectedNewIngredient) {
                                    setSimulatedRecipe(prev => [...prev, { 
                                      name: selectedNewIngredient, 
                                      quantity: 1, 
                                      unit: 'units'
                                    }]);
                                    setShowAddIngredient(false);
                                    setSelectedNewIngredient('');
                                  }
                                }}
                                disabled={!selectedNewIngredient}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddIngredient(false);
                                  setSelectedNewIngredient('');
                                }}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-blue-200 bg-blue-50 p-6 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-blue-900">Total Cost:</span>
                          <span className={`font-semibold ${simulatedCost > originalCost ? 'text-red-600' : simulatedCost < originalCost ? 'text-green-600' : 'text-blue-900'}`}>
                            ${simulatedCost.toFixed(3)}
                            {simulatedCost !== originalCost && (
                              <span className="text-xs ml-1">
                                ({simulatedCost > originalCost ? '+' : ''}{(simulatedCost - originalCost).toFixed(3)})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-blue-900">Gross Profit:</span>
                          <span className={`font-semibold ${simulatedGrossProfit < originalGrossProfit ? 'text-red-600' : simulatedGrossProfit > originalGrossProfit ? 'text-green-600' : 'text-blue-900'}`}>
                            ${simulatedGrossProfit.toFixed(2)}
                            {simulatedGrossProfit !== originalGrossProfit && (
                              <span className="text-xs ml-1">
                                ({simulatedGrossProfit > originalGrossProfit ? '+' : ''}{(simulatedGrossProfit - originalGrossProfit).toFixed(2)})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-blue-900">Cost %:</span>
                          <span className={`font-semibold ${simulatedCostPercent > originalCostPercent ? 'text-red-600' : simulatedCostPercent < originalCostPercent ? 'text-green-600' : 'text-blue-900'}`}>
                            {simulatedCostPercent.toFixed(1)}%
                            {simulatedCostPercent !== originalCostPercent && (
                              <span className="text-xs ml-1">
                                ({simulatedCostPercent > originalCostPercent ? '+' : ''}{(simulatedCostPercent - originalCostPercent).toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Publish Button - Only show during simulation */}
                {showSimulation && (
                  <div className="mt-6 flex items-center justify-center">
                    <button
                      onClick={() => {
                        const now = new Date();
                        
                        // Step 1: Mark any existing CURRENT entries for this item/variant as replaced
                        setRecipeHistory(prev => 
                          prev.map(entry => {
                            if (entry.menuItemId === menuItem.id && 
                                entry.variantIndex === variantIndex && 
                                entry.endDate === null) {
                              return { ...entry, endDate: now };
                            }
                            return entry;
                          })
                        );
                        
                        // Step 2: Save the OLD recipe to history (now replaced)
                        const oldRecipeEntry: RecipeHistoryEntry = {
                          id: `${Date.now()}-old-${menuItem.id}-${variantIndex}`,
                          menuItemId: menuItem.id,
                          variantIndex: variantIndex,
                          recipe: variant.recipe,
                          retailPrice: variant.price,
                          cost: originalCost,
                          costPercent: originalCostPercent,
                          startDate: new Date(Date.now() - 1000), // 1 second before publish
                          endDate: now,
                          publishedBy: 'System'
                        };
                        
                        // Step 3: Save the NEW recipe to history (marked as CURRENT)
                        const newRecipeEntry: RecipeHistoryEntry = {
                          id: `${Date.now()}-new-${menuItem.id}-${variantIndex}`,
                          menuItemId: menuItem.id,
                          variantIndex: variantIndex,
                          recipe: [...simulatedRecipe],
                          retailPrice: simulatedPrice,
                          cost: simulatedCost,
                          costPercent: simulatedCostPercent,
                          startDate: now,
                          endDate: null, // This is the CURRENT recipe
                          publishedBy: 'Current User'
                        };
                        
                        setRecipeHistory(prev => [...prev, oldRecipeEntry, newRecipeEntry]);
                        
                        // Actually update the menu item with the new recipe and price
                        setMenuItems(prevItems => 
                          prevItems.map(item => {
                            if (item.id === menuItem.id) {
                              return {
                                ...item,
                                variants: item.variants.map((v, idx) => {
                                  if (idx === variantIndex) {
                                    return {
                                      ...v,
                                      recipe: [...simulatedRecipe],
                                      price: simulatedPrice
                                    };
                                  }
                                  return v;
                                })
                              };
                            }
                            return item;
                          })
                        );
                        
                        // Update the selectedRecipeDetail to reflect the new values
                        setSelectedRecipeDetail(prev => {
                          if (prev) {
                            const updatedMenuItem = menuItems.find(item => item.id === menuItem.id);
                            if (updatedMenuItem) {
                              return {
                                ...prev,
                                menuItem: {
                                  ...updatedMenuItem,
                                  variants: updatedMenuItem.variants.map((v, idx) => {
                                    if (idx === variantIndex) {
                                      return {
                                        ...v,
                                        recipe: [...simulatedRecipe],
                                        price: simulatedPrice
                                      };
                                    }
                                    return v;
                                  })
                                }
                              };
                            }
                          }
                          return prev;
                        });
                        
                        alert(`Recipe updated successfully!\n\nOriginal cost: $${originalCost.toFixed(3)}\nNew cost: $${simulatedCost.toFixed(3)}\nChange: $${(simulatedCost - originalCost).toFixed(3)}\n\nOriginal price: $${variant.price.toFixed(2)}\nNew price: $${simulatedPrice.toFixed(2)}\n\nPrevious recipe has been saved to history.`);
                        setShowSimulation(false);
                        setSimulatedRecipe([]);
                        setSimulatedPrice(0);
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm shadow-lg"
                    >
                      PUBLISH UPDATED RECIPE
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Otherwise, show recipe list
        // Generate SKU from item name and variant index
        const generateSKU = (itemName: string, variantIndex: number): string => {
          const baseName = itemName.toUpperCase().replace(/\s+/g, '_');
          return `${baseName}_${variantIndex}`;
        };

        // Flatten menu items into individual SKU rows
        interface SKURow {
          sku: string;
          itemName: string;
          category: string;
          variant: string;
          price: number;
          cost: number;
          cogsPercent: number;
          menuItemId: string;
          variantIndex: number;
        }

        const skuRows: SKURow[] = [];
        menuItems.forEach((item) => {
          item.variants.forEach((variant, index) => {
            // Calculate cost for this variant
            const recipeCost = variant.recipe.reduce((sum, ingredient) => {
              const costPerUnit = calculatePreparedUnitCost(ingredient.name);
              return sum + (costPerUnit * ingredient.quantity);
            }, 0);
            
            const cogsPercent = variant.price > 0 ? (recipeCost / variant.price) * 100 : 0;
            
            skuRows.push({
              sku: generateSKU(item.name, index + 1),
              itemName: item.name,
              category: item.category,
              variant: variant.name,
              price: variant.price,
              cost: recipeCost,
              cogsPercent: cogsPercent,
              menuItemId: item.id,
              variantIndex: index,
            });
          });
        });

        // Filter SKU rows based on search query
        const filteredRows = skuRows.filter((row) => {
          if (!recipeSearchQuery.trim()) return true;
          
          const query = recipeSearchQuery.toLowerCase();
          return (
            row.sku.toLowerCase().includes(query) ||
            row.category.toLowerCase().includes(query) ||
            row.itemName.toLowerCase().includes(query) ||
            row.variant.toLowerCase().includes(query) ||
            row.price.toFixed(2).includes(query)
          );
        });

        return (
          <div className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-semibold mb-8">Menu Item Recipes</h1>
              
              {/* Search Box */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by SKU, category, item name, variant, or price..."
                    value={recipeSearchQuery}
                    onChange={(e) => setRecipeSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  {recipeSearchQuery && (
                    <button
                      onClick={() => setRecipeSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 font-semibold text-gray-900">
                        SKU
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-900">
                        Item Name
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-900">
                        Variant
                      </th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-900">
                        Retail Price
                      </th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-900">
                        Cost
                      </th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-900">
                        COGS %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No SKUs found matching &ldquo;{recipeSearchQuery}&rdquo;
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const menuItem = menuItems.find(item => item.id === row.menuItemId);
                        if (!menuItem) return null;

                        return (
                          <tr 
                            key={row.sku}
                            onClick={() => setSelectedRecipeDetail({ menuItem, variantIndex: row.variantIndex, sku: row.sku })}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-sm text-gray-900">
                              {row.sku}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {row.category}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {row.itemName}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {row.variant}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                              ${row.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-900">
                              ${row.cost.toFixed(3)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-900">
                              {row.cogsPercent.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Inventory Module */}
      {mainTab === 'inventory' && (
        <InventoryModule />
      )}

      {/* Labor Module */}
      {mainTab === 'labor' && (
        <LaborModule userRole="manager" currentEmployeeId="emp-1" transactions={transactions} />
      )}

      {/* LivePL Module */}
      {mainTab === 'livepl' && (
        <LivePLModule />
      )}

      {/* Operations Module */}
      {mainTab === 'operations' && (
        <OperationsModule />
      )}

      {/* Modals */}
      {showCheckout && (
        <CheckoutModal
          orderItems={orderItems}
          subtotal={subtotal}
          tax={tax}
          total={total}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
        />
      )}

      {selectedRecipe && (
        <RecipeModal
          itemName={selectedRecipe.name}
          variants={selectedRecipe.variants}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {itemToAdd && !showModifyRecipe && (
        <AddItemModal
          itemName={itemToAdd.name}
          onAdd={handleDirectAdd}
          onModify={handleModifyThenAdd}
          onClose={() => setItemToAdd(null)}
        />
      )}

      {itemToAdd && showModifyRecipe && (
        <ModifyRecipeModal
          itemName={itemToAdd.name}
          variants={itemToAdd.variants}
          onAdd={handleAddModifiedItem}
          onClose={() => {
            setShowModifyRecipe(false);
            setItemToAdd(null);
          }}
        />
      )}
    </div>
  );
}

function AppWithProvider() {
  // Wrapper component to provide AppDataContext to entire app
  return (
    <AppDataProvider>
      <App />
    </AppDataProvider>
  );
}

export default AppWithProvider;