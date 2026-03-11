import { useState, useMemo, useEffect } from 'react';
import { Package, AlertTriangle, ShoppingCart, Search, Filter, CheckCircle2 } from 'lucide-react';
import { StatsCard } from '@/app/components/inventory/StatsCard';
import { StatsCardDark } from '@/app/components/inventory/StatsCardDark';
import { InventoryTable, InventoryItem } from '@/app/components/inventory/InventoryTable';
import { InventoryTableDark } from '@/app/components/inventory/InventoryTableDark';
import { InventoryModal } from '@/app/components/inventory/InventoryModal';
import { CategoryStatus } from '@/app/components/inventory/CategoryStatus';
import { Tabs } from '@/app/components/inventory/Tabs';
import { DetailTable, DetailInventoryItem } from '@/app/components/inventory/DetailTable';
import { DefinitionTable, DefinitionInventoryItem } from '@/app/components/inventory/DefinitionTable';
import { DefinitionModal } from '@/app/components/inventory/DefinitionModal';
import { ConfigurationTab, CategoryPrefix } from '@/app/components/inventory/ConfigurationTab';
import { ParTable, ParItem } from '@/app/components/inventory/ParTable';
import { SourceTable, SourceInventoryItem } from '@/app/components/inventory/SourceTable';
import { OrdersTable, OrderItem } from '@/app/components/inventory/OrdersTable';
import { PurchaseOrdersTable, PurchaseOrder, POStatus } from '@/app/components/inventory/PurchaseOrdersTable';
import { ClosedPOsTable } from '@/app/components/inventory/ClosedPOsTable';
import { PhysicalCountTab, PhysicalCount, CountItem } from '@/app/components/inventory/PhysicalCountTab';
import { CSVImportTab } from '@/app/components/inventory/CSVImportTab';

// Initial source inventory data
const initialSourceInventory: SourceInventoryItem[] = [
  { id: '1', sku: 'P001', itemName: 'Iceberg Lettuce', category: 'Produce', whatToCount: 'HEADS', countingMinorUnit: 1, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Head', orderingMinorCount: 24, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 28.50, par: 50, lastPhysicalCount: 52.0, estOnHand: 50.0, avgDailyUsage: 10.0 },
  { id: '2', sku: 'P002', itemName: 'Strawberries', category: 'Produce', whatToCount: 'BASKETS', countingMinorUnit: 1, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Basket', orderingMinorCount: 5, orderingCount: 1, orderingUnitOfPurchase: 'flat', minOrder: 1, lastVendorPrice: 18.75, par: 15, lastPhysicalCount: 17.0, estOnHand: 16.0, avgDailyUsage: 4.0 },
  { id: '3', sku: 'P003', itemName: 'Tomatoes', category: 'Produce', whatToCount: 'TOMATOES', countingMinorUnit: 1, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Tomato', orderingMinorCount: 25, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 1, lastVendorPrice: 32.00, par: 25, lastPhysicalCount: 2.0, estOnHand: 0.5, avgDailyUsage: 5.0 },
  { id: '4', sku: 'P004', itemName: 'French Fries', category: 'Produce', whatToCount: 'BAGS', countingMinorUnit: 5, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Bag', orderingMinorCount: 6, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 3, lastVendorPrice: 49.50, par: 20, lastPhysicalCount: 22.0, estOnHand: 21.0, avgDailyUsage: 2.5 },
  { id: '5', sku: 'P005', itemName: 'Onions', category: 'Produce', whatToCount: 'ONIONS', countingMinorUnit: 1, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Onion', orderingMinorCount: 50, orderingCount: 1, orderingUnitOfPurchase: 'bag', minOrder: 2, lastVendorPrice: 22.50, par: 100, lastPhysicalCount: 105.0, estOnHand: 102.0, avgDailyUsage: 12.0 },
  { id: '6', sku: 'T001', itemName: 'Ground Beef', category: 'Proteins', whatToCount: 'PATTIES', countingMinorUnit: 1, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Patty', orderingMinorCount: 40, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 84.00, par: 120, lastPhysicalCount: 125.0, estOnHand: 122.0, avgDailyUsage: 15.0 },
  { id: '7', sku: 'T002', itemName: 'Chicken Breast', category: 'Proteins', whatToCount: 'BREASTS', countingMinorUnit: 1, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Breast', orderingMinorCount: 40, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 1, lastVendorPrice: 92.00, par: 80, lastPhysicalCount: 84.0, estOnHand: 82.0, avgDailyUsage: 10.0 },
  { id: '8', sku: 'T003', itemName: 'Bacon', category: 'Proteins', whatToCount: 'SLABS', countingMinorUnit: 1, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Slab', orderingMinorCount: 10, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 3, lastVendorPrice: 45.00, par: 30, lastPhysicalCount: 33.0, estOnHand: 31.0, avgDailyUsage: 3.0 },
  { id: '9', sku: 'D001', itemName: 'Cheddar Cheese', category: 'Dairy', whatToCount: 'BLOCKS', countingMinorUnit: 1, countingMinorUOM: 'lb', countingMajorUnit: 1, countingMajorUOM: 'Block', orderingMinorCount: 4, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 3, lastVendorPrice: 19.00, par: 20, lastPhysicalCount: 22.0, estOnHand: 21.0, avgDailyUsage: 2.5 },
  { id: '10', sku: 'D002', itemName: 'Milk', category: 'Dairy', whatToCount: 'JUGS', countingMinorUnit: 1, countingMinorUOM: 'gal', countingMajorUnit: 1, countingMajorUOM: 'Jug', orderingMinorCount: 4, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 14.00, par: 12, lastPhysicalCount: 13.0, estOnHand: 12.0, avgDailyUsage: 1.5 },
  { id: '11', sku: 'G001', itemName: 'Hamburger Buns', category: 'Dry Goods', whatToCount: 'PACKAGES', countingMinorUnit: 8, countingMinorUOM: 'bun', countingMajorUnit: 1, countingMajorUOM: 'Package', orderingMinorCount: 6, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 3, lastVendorPrice: 12.50, par: 15, lastPhysicalCount: 16.0, estOnHand: 15.0, avgDailyUsage: 2.0 },
  { id: '12', sku: 'B001', itemName: 'Coca-Cola Syrup', category: 'Beverages', whatToCount: 'BIBS', countingMinorUnit: 5, countingMinorUOM: 'gal', countingMajorUnit: 1, countingMajorUOM: 'BIB', orderingMinorCount: 1, orderingCount: 1, orderingUnitOfPurchase: 'BIB', minOrder: 3, lastVendorPrice: 87.50, par: 8, lastPhysicalCount: 4.0, estOnHand: 3.0, avgDailyUsage: 0.8 },
  { id: '13', sku: 'C001', itemName: 'Ketchup', category: 'Condiments', whatToCount: 'BOTTLES', countingMinorUnit: 32, countingMinorUOM: 'oz', countingMajorUnit: 1, countingMajorUOM: 'Bottle', orderingMinorCount: 12, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 15.60, par: 24, lastPhysicalCount: 25.0, estOnHand: 24.0, avgDailyUsage: 3.0 },
  { id: '14', sku: 'K001', itemName: 'Paper Cups (12oz)', category: 'Packaging', whatToCount: 'SLEEVES', countingMinorUnit: 50, countingMinorUOM: 'cup', countingMajorUnit: 1, countingMajorUOM: 'Sleeve', orderingMinorCount: 20, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 1, lastVendorPrice: 44.00, par: 40, lastPhysicalCount: 42.0, estOnHand: 41.0, avgDailyUsage: 5.0 },
  { id: '15', sku: 'C002', itemName: 'Mustard', category: 'Condiments', whatToCount: 'BOTTLES', countingMinorUnit: 32, countingMinorUOM: 'oz', countingMajorUnit: 1, countingMajorUOM: 'Bottle', orderingMinorCount: 12, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 14.40, par: 20, lastPhysicalCount: 22.0, estOnHand: 21.0, avgDailyUsage: 2.5 },
  { id: '16', sku: 'C003', itemName: 'Pickles', category: 'Condiments', whatToCount: 'JARS', countingMinorUnit: 1, countingMinorUOM: 'gal', countingMajorUnit: 1, countingMajorUOM: 'Jar', orderingMinorCount: 4, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 18.00, par: 8, lastPhysicalCount: 9.0, estOnHand: 8.0, avgDailyUsage: 1.0 },
  { id: '17', sku: 'C004', itemName: 'BBQ Sauce', category: 'Condiments', whatToCount: 'BOTTLES', countingMinorUnit: 32, countingMinorUOM: 'oz', countingMajorUnit: 1, countingMajorUOM: 'Bottle', orderingMinorCount: 12, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 16.80, par: 18, lastPhysicalCount: 19.0, estOnHand: 18.0, avgDailyUsage: 2.0 },
  { id: '18', sku: 'C005', itemName: 'Mayo', category: 'Condiments', whatToCount: 'JARS', countingMinorUnit: 32, countingMinorUOM: 'oz', countingMajorUnit: 1, countingMajorUOM: 'Jar', orderingMinorCount: 12, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 19.20, par: 16, lastPhysicalCount: 17.0, estOnHand: 16.0, avgDailyUsage: 2.0 },
  { id: '19', sku: 'P006', itemName: 'Avocado', category: 'Produce', whatToCount: 'AVOCADOS', countingMinorUnit: 1, countingMinorUOM: 'ea', countingMajorUnit: 1, countingMajorUOM: 'Avocado', orderingMinorCount: 48, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 1, lastVendorPrice: 38.40, par: 50, lastPhysicalCount: 52.0, estOnHand: 50.0, avgDailyUsage: 6.0 },
  { id: '20', sku: 'T004', itemName: 'Veggie Patty', category: 'Proteins', whatToCount: 'PATTIES', countingMinorUnit: 1, countingMinorUOM: 'ea', countingMajorUnit: 1, countingMajorUOM: 'Patty', orderingMinorCount: 32, orderingCount: 1, orderingUnitOfPurchase: 'case', minOrder: 2, lastVendorPrice: 64.00, par: 64, lastPhysicalCount: 66.0, estOnHand: 64.0, avgDailyUsage: 4.0 },
];

const initialCategoryPrefixes: CategoryPrefix[] = [
  { category: 'Produce', prefix: 'P' },
  { category: 'Proteins', prefix: 'T' },
  { category: 'Dairy', prefix: 'D' },
  { category: 'Dry Goods', prefix: 'G' },
  { category: 'Beverages', prefix: 'B' },
  { category: 'Condiments', prefix: 'C' },
  { category: 'Packaging', prefix: 'K' },
];

// Generate other tab data from SOURCE
const generateInventoryFromSource = (sourceItems: SourceInventoryItem[]): InventoryItem[] => {
  return sourceItems.map(item => ({
    id: item.id,
    name: item.itemName,
    category: item.category,
    quantity: Math.floor(item.estOnHand),
    par: item.par,
    lastCount: item.lastPhysicalCount,
    reorderLevel: Math.floor(item.par * 0.3),
    unit: item.countingMajorUOM,
    daysRemaining: item.avgDailyUsage > 0 ? item.estOnHand / item.avgDailyUsage : 0,
  }));
};

const generateDefinitionFromSource = (sourceItems: SourceInventoryItem[]): DefinitionInventoryItem[] => {
  const vendors = ['Sysco', 'US Foods', 'Gordon Food Service', 'Performance Food Group', 'Fresh Direct'];
  
  // Map item names to their prepared units (kitchen-level usage)
  const preparedUnitMap: { [key: string]: string } = {
    'Tomatoes': 'Slices',
    'Strawberries': 'Berries',
    'Ground Beef': 'Patties',
    'Chicken Breast': 'Breasts',
    'Bacon': 'Slices',
    'Iceberg Lettuce': 'Leaves',
    'Onions': 'Slices',
    'French Fries': 'Scoops',
    'Cheddar Cheese': 'Slices',
    'Milk': 'Cups',
    'Hamburger Buns': 'Bun Sets',
    'Coca-Cola Syrup': 'Ounces',
    'Ketchup': 'Squirts',
    'Paper Cups (12oz)': 'Cups',
    'Mustard': 'Squirts',
    'Pickles': 'Slices',
    'BBQ Sauce': 'Squirts',
    'Mayo': 'Squirts',
    'Avocado': 'Slices',
    'Veggie Patty': 'Patties',
  };
  
  // Map item names to prepared unit conversion factors (how many prepared units per counting unit)
  const preparedConversionMap: { [key: string]: number } = {
    'Tomatoes': 6,          // 6 slices per tomato
    'Strawberries': 12,     // 12 berries per lb
    'Ground Beef': 4,       // 4 patties per lb
    'Chicken Breast': 4,    // 4 breasts per lb
    'Bacon': 12,            // 12 slices per lb
    'Iceberg Lettuce': 20,  // 20 leaves per head
    'Onions': 8,            // 8 slices per onion
    'French Fries': 10,     // 10 scoops per bag
    'Cheddar Cheese': 16,   // 16 slices per lb
    'Milk': 16,             // 16 cups per gallon
    'Hamburger Buns': 8,    // 8 bun sets per package
    'Coca-Cola Syrup': 640, // 640 ounces per bag-in-box
    'Ketchup': 100,         // 100 squirts per bottle
    'Paper Cups (12oz)': 50, // 50 cups per sleeve
    'Mustard': 100,         // 100 squirts per bottle
    'Pickles': 16,          // 16 slices per jar
    'BBQ Sauce': 100,       // 100 squirts per bottle
    'Mayo': 100,            // 100 squirts per jar
    'Avocado': 10,          // 10 slices per avocado
    'Veggie Patty': 4,      // 4 patties per lb
  };
  
  // Map item ordering unit of purchase (how restaurant receives/orders the product)
  const orderUnitMap: { [key: string]: string } = {
    'Iceberg Lettuce': 'Case',
    'Strawberries': 'Flat',
    'Tomatoes': 'Case',
    'French Fries': 'Case',
    'Onions': 'Bag',
    'Ground Beef': 'Case',
    'Chicken Breast': 'Case',
    'Bacon': 'Case',
    'Cheddar Cheese': 'Case',
    'Milk': 'Case',
    'Hamburger Buns': 'Case',
    'Coca-Cola Syrup': 'Box',
    'Ketchup': 'Case',
    'Paper Cups (12oz)': 'Case',
    'Mustard': 'Case',
    'Pickles': 'Case',
    'BBQ Sauce': 'Case',
    'Mayo': 'Case',
    'Avocado': 'Case',
    'Veggie Patty': 'Case',
  };
  
  return sourceItems.map((item, index) => ({
    id: item.id,
    sku: item.sku,
    itemName: item.itemName,
    category: item.category,
    countingMinorUnit: item.countingMinorUnit,
    countingMinorUOM: item.countingMinorUOM,
    countingMajorUnit: item.countingMajorUnit,
    countingMajorUOM: item.countingMajorUOM,
    vendor: vendors[index % vendors.length],
    vendorSKU: `${vendors[index % vendors.length].substring(0, 3).toUpperCase()}-${item.sku}-${(index + 1) * 1024}`,
    lastVendorPrice: item.lastVendorPrice,
    conversionFactor: item.orderingMinorCount,
    countingUnitPrice: item.lastVendorPrice / item.orderingMinorCount,
    whatToCount: item.whatToCount,
    preparedUnit: preparedUnitMap[item.itemName] || item.countingMajorUOM, // Use mapped value or fall back to counting unit
    preparedConversion: (() => {
      const prepUnit = preparedUnitMap[item.itemName] || item.countingMajorUOM;
      // If prepared unit is the same as counting unit, conversion is 1:1
      if (prepUnit.toLowerCase() === item.countingMajorUOM.toLowerCase() || 
          prepUnit.toLowerCase() === item.whatToCount.toLowerCase().replace(/s$/, '')) {
        return 1;
      }
      return preparedConversionMap[item.itemName];
    })(),
    orderingCount: item.orderingCount,
    orderingUOM: item.orderingUnitOfPurchase,
    orderingUnitOfPurchase: orderUnitMap[item.itemName] || 'Case', // Use mapped value or default to Case
    orderingMinorCount: item.orderingMinorCount.toString(),
    orderingMinorUnitOfPurchase: item.countingMajorUOM.toLowerCase() + 's',
    minOrder: item.minOrder,
  }));
};

const generateDetailFromSource = (sourceItems: SourceInventoryItem[]): DetailInventoryItem[] => {
  // Map item names to their prepared units (kitchen-level usage)
  const preparedUnitMap: { [key: string]: string } = {
    'Tomatoes': 'Slices',
    'Strawberries': 'Berries',
    'Ground Beef': 'Patties',
    'Chicken Breast': 'Breasts',
    'Bacon': 'Slices',
    'Iceberg Lettuce': 'Leaves',
    'Onions': 'Slices',
    'French Fries': 'Scoops',
    'Cheddar Cheese': 'Slices',
    'Milk': 'Cups',
    'Hamburger Buns': 'Bun Sets',
    'Coca-Cola Syrup': 'Ounces',
    'Ketchup': 'Squirts',
    'Paper Cups (12oz)': 'Cups',
    'Mustard': 'Squirts',
    'Pickles': 'Slices',
    'BBQ Sauce': 'Squirts',
    'Mayo': 'Squirts',
    'Avocado': 'Slices',
    'Veggie Patty': 'Patties',
  };
  
  // Map item names to prepared unit conversion factors (how many prepared units per counting unit)
  const preparedConversionMap: { [key: string]: number } = {
    'Tomatoes': 6,          // 6 slices per tomato
    'Strawberries': 12,     // 12 berries per lb
    'Ground Beef': 4,       // 4 patties per lb
    'Chicken Breast': 4,    // 4 breasts per lb
    'Bacon': 12,            // 12 slices per lb
    'Iceberg Lettuce': 20,  // 20 leaves per head
    'Onions': 8,            // 8 slices per onion
    'French Fries': 10,     // 10 scoops per bag
    'Cheddar Cheese': 16,   // 16 slices per lb
    'Milk': 16,             // 16 cups per gallon
    'Hamburger Buns': 8,    // 8 bun sets per package
    'Coca-Cola Syrup': 640, // 640 ounces per bag-in-box
    'Ketchup': 100,         // 100 squirts per bottle
    'Paper Cups (12oz)': 50, // 50 cups per sleeve
    'Mustard': 100,         // 100 squirts per bottle
    'Pickles': 16,          // 16 slices per jar
    'BBQ Sauce': 100,       // 100 squirts per bottle
    'Mayo': 100,            // 100 squirts per jar
    'Avocado': 10,          // 10 slices per avocado
    'Veggie Patty': 4,      // 4 patties per lb
  };
  
  return sourceItems.map(item => {
    const preparedUnit = preparedUnitMap[item.itemName] || item.countingMajorUOM;
    
    // If prepared unit is the same as counting unit, conversion is 1:1
    const preparedConversion = (() => {
      if (preparedUnit.toLowerCase() === item.countingMajorUOM.toLowerCase() || 
          preparedUnit.toLowerCase() === item.whatToCount.toLowerCase().replace(/s$/, '')) {
        return 1;
      }
      return preparedConversionMap[item.itemName] || 1;
    })();
    
    return {
      id: item.id,
      sku: item.sku,
      itemName: item.itemName,
      category: item.category,
      lastPhysicalCount: item.lastPhysicalCount,
      estOnHand: item.estOnHand,
      par: item.par,
      unit: item.countingMajorUOM,
      countingMinorUnit: item.countingMinorUnit,
      countingMinorUOM: item.countingMinorUOM,
      lastPricePerUnit: item.lastVendorPrice / item.orderingMinorCount,
      lastVendorPrice: item.lastVendorPrice,
      conversionFactor: item.orderingMinorCount,
      preparedUnit,
      preparedConversion,
    };
  });
};

const generateParFromSource = (sourceItems: SourceInventoryItem[]): ParItem[] => {
  const vendors = ['Sysco', 'US Foods', 'Gordon Food Service', 'Performance Food Group', 'Fresh Direct'];
  
  return sourceItems.map((item, index) => ({
    id: item.id,
    itemName: item.itemName,
    category: item.category,
    par: item.par,
    countingMinorUnit: item.countingMinorUnit,
    countingMinorUOM: item.countingMinorUOM,
    countingMajorUOM: item.countingMajorUOM,
    currentStock: Math.floor(item.estOnHand),
    vendor: vendors[index % vendors.length],
  }));
};

export function InventoryModule() {
  const [inventory, setInventory] = useState<InventoryItem[]>(generateInventoryFromSource(initialSourceInventory));
  const [detailInventory, setDetailInventory] = useState<DetailInventoryItem[]>(generateDetailFromSource(initialSourceInventory));
  const [definitionInventory, setDefinitionInventory] = useState<DefinitionInventoryItem[]>(generateDefinitionFromSource(initialSourceInventory));
  const [parInventory, setParInventory] = useState<ParItem[]>(generateParFromSource(initialSourceInventory));
  const [sourceInventory, setSourceInventory] = useState<SourceInventoryItem[]>(initialSourceInventory);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [categoryPrefixes, setCategoryPrefixes] = useState<CategoryPrefix[]>(initialCategoryPrefixes);
  const [additionalChargeTypes, setAdditionalChargeTypes] = useState<string[]>([
    'FREIGHT', 'HANDLING FEE', 'CHARGEBACK', 'FUEL SURCHARGE', 'DELIVERY FEE',
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDefinitionModalOpen, setIsDefinitionModalOpen] = useState(false);
  const [editingDefinitionItem, setEditingDefinitionItem] = useState<DefinitionInventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('home');
  const [poSubTab, setPOSubTab] = useState<'open' | 'closed'>('open');
  const [parCategoryFilter, setParCategoryFilter] = useState('All');
  const [pastCounts, setPastCounts] = useState<PhysicalCount[]>([]);

  // Sync parInventory with sourceInventory changes
  useEffect(() => {
    setParInventory(prevPar => 
      prevPar.map(parItem => {
        const sourceItem = sourceInventory.find(s => s.id === parItem.id);
        if (sourceItem) {
          return {
            ...parItem,
            currentStock: Math.floor(sourceItem.estOnHand),
          };
        }
        return parItem;
      })
    );
  }, [sourceInventory]);

  // Update ON ORDER quantities whenever purchase orders change
  useEffect(() => {
    const onOrderMap: { [sku: string]: number } = {};
    
    purchaseOrders.forEach(po => {
      if (po.status === 'Submitted') {
        po.items.forEach(item => {
          const countingUnits = item.quantityToOrder * (item.orderingMinorCount || 1);
          onOrderMap[item.sku] = (onOrderMap[item.sku] || 0) + countingUnits;
        });
      }
    });
    
    setDetailInventory(prevDetail => prevDetail.map(item => ({
      ...item,
      onOrder: onOrderMap[item.sku] || 0
    })));
  }, [purchaseOrders]);

  // Calculate statistics
  const stats = useMemo(() => {
    const safeStockItems = detailInventory.filter(item => item.estOnHand >= item.par).length;
    const belowParItems = detailInventory.filter(item => item.estOnHand < item.par && item.estOnHand > 0).length;
    const outOfStockItems = detailInventory.filter(item => item.estOnHand === 0).length;

    return { safeStockItems, belowParItems, outOfStockItems };
  }, [detailInventory]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const handleAddItem = (itemData: Omit<InventoryItem, 'id' | 'lastPhysicalCount'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString(),
      lastPhysicalCount: new Date().toISOString().split('T')[0],
    };
    setInventory([...inventory, newItem]);
  };

  const handleEditItem = (itemData: Omit<InventoryItem, 'id' | 'lastPhysicalCount'>) => {
    if (editingItem) {
      setInventory(inventory.map(item =>
        item.id === editingItem.id
          ? { ...item, ...itemData, lastPhysicalCount: new Date().toISOString().split('T')[0] }
          : item
      ));
      setEditingItem(null);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleEditDetailItem = (item: DetailInventoryItem) => {
    console.log('Edit detail item:', item);
  };

  const handleEditDefinitionItem = (item: DefinitionInventoryItem) => {
    setEditingDefinitionItem(item);
    setIsDefinitionModalOpen(true);
  };

  const handleSaveDefinitionItem = (item: DefinitionInventoryItem) => {
    setDefinitionInventory(definitionInventory.map(i =>
      i.id === item.id ? item : i
    ));
    setEditingDefinitionItem(null);
  };

  const handleDeleteDefinitionItem = (item: DefinitionInventoryItem) => {
    if (confirm(`Are you sure you want to delete "${item.itemName}"?`)) {
      setDefinitionInventory(definitionInventory.filter(i => i.id !== item.id));
    }
  };

  const handleCopyDefinitionItem = (item: DefinitionInventoryItem) => {
    const newItem: DefinitionInventoryItem = {
      ...item,
      id: Date.now().toString(),
      sku: `${item.sku.charAt(0)}${(parseInt(item.sku.slice(1)) + 1).toString().padStart(3, '0')}`,
      itemName: `${item.itemName} (Copy)`,
    };
    setDefinitionInventory([...definitionInventory, newItem]);
  };

  const handleAddDefinitionItem = () => {
    alert('Add new item functionality will be implemented with a modal');
  };

  const handleUpdateCategoryPrefixes = (prefixes: CategoryPrefix[]) => {
    setCategoryPrefixes(prefixes);
  };

  const handleUpdatePar = (id: string, newPar: number) => {
    setParInventory(parInventory.map(item =>
      item.id === id ? { ...item, par: newPar } : item
    ));
  };

  const handleGenerateOrder = (filteredItems?: ParItem[]) => {
    const itemsToProcess = filteredItems || parInventory;
    const newOrders: OrderItem[] = [];
    const timestamp = Date.now();
    let counter = 0;
    
    itemsToProcess.forEach(parItem => {
      const sourceItem = sourceInventory.find(s => s.id === parItem.id);
      if (!sourceItem) return;
      
      const currentStock = Math.floor(sourceItem.estOnHand);
      const difference = currentStock - parItem.par;
      
      if (difference < 0) {
        const defItem = definitionInventory.find(d => d.id === parItem.id);
        if (defItem) {
          const quantityNeeded = Math.abs(difference);
          const orderingUnitsNeeded = quantityNeeded / sourceItem.orderingMinorCount;
          let quantityToOrder = Math.ceil(orderingUnitsNeeded);
          if (quantityToOrder < sourceItem.minOrder) {
            quantityToOrder = sourceItem.minOrder;
          }
          
          const unitPrice = sourceItem.lastVendorPrice;
          const totalCost = quantityToOrder * unitPrice;
          
          const orderId = `order-${timestamp}-${counter}-${parItem.id}`;
          counter++;
          
          newOrders.push({
            id: orderId,
            sku: sourceItem.sku,
            itemName: sourceItem.itemName,
            category: sourceItem.category,
            vendor: defItem.vendor || 'Unknown',
            vendorSKU: defItem.vendorSKU || '',
            quantityNeeded,
            quantityToOrder,
            orderingUnitOfPurchase: sourceItem.orderingUnitOfPurchase,
            countingMajorUnit: sourceItem.countingMajorUOM,
            unitPrice,
            totalCost,
            minOrder: sourceItem.minOrder,
            orderingMinorCount: sourceItem.orderingMinorCount,
          });
        }
      }
    });
    
    const existingVendors = [...new Set(orders.map(order => order.vendor))];
    const ordersToAdd = newOrders.filter(order => !existingVendors.includes(order.vendor));
    const skippedVendors = [...new Set(newOrders.filter(order => existingVendors.includes(order.vendor)).map(order => order.vendor))];
    
    if (skippedVendors.length > 0) {
      alert(`1 or more POs for a vendor were already created, and those were skipped (${skippedVendors.join(', ')}). POs were only generated for vendors that didn't have a draft PO.`);
    }
    
    if (ordersToAdd.length > 0) {
      setOrders([...orders, ...ordersToAdd]);
    }
    
    setActiveTab('order-generation');
  };

  const handleEditOrder = (id: string, newQuantity: number) => {
    setOrders(orders.map(order =>
      order.id === id
        ? { ...order, quantityToOrder: newQuantity, totalCost: newQuantity * order.unitPrice }
        : order
    ));
  };

  const handleAddOrder = (item: OrderItem) => {
    setOrders([...orders, item]);
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter(order => order.id !== id));
  };

  const handleClearAllOrders = () => {
    if (confirm('Are you sure you want to clear all orders?')) {
      setOrders([]);
    }
  };

  const handleClearVendorOrder = (vendor: string) => {
    setOrders(orders.filter(order => order.vendor !== vendor));
  };

  const handleCreatePO = (vendor: string, items: OrderItem[]) => {
    const poNumber = `PO-${Date.now().toString().slice(-8)}`;
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      poNumber,
      vendor,
      items,
      totalCost,
      status: 'Draft',
      createdAt: new Date(),
    };
    
    setPurchaseOrders(prev => [...prev, newPO]);
    
    // Check if there will be any orders left after removing this vendor's orders
    const remainingOrders = orders.filter(order => order.vendor !== vendor);
    
    setOrders(remainingOrders);
    
    // Only navigate to purchase orders if this was the last vendor order
    if (remainingOrders.length === 0) {
      setActiveTab('purchase-orders');
    }
  };

  const handleDraftAllPOs = (vendorOrders: { [vendor: string]: OrderItem[] }) => {
    const newPOs: PurchaseOrder[] = [];
    
    Object.entries(vendorOrders).forEach(([vendor, items]) => {
      const poNumber = `PO-${Date.now().toString().slice(-8)}-${vendor.substring(0, 3).toUpperCase()}`;
      const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
      
      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        poNumber,
        vendor,
        items,
        totalCost,
        status: 'Draft',
        createdAt: new Date(),
      };
      
      newPOs.push(newPO);
    });
    
    // Add all POs at once
    setPurchaseOrders(prev => [...prev, ...newPOs]);
    
    // Clear all orders and navigate to Purchase Orders
    setOrders([]);
    setActiveTab('purchase-orders');
  };

  const handleUpdatePOStatus = (id: string, status: POStatus) => {
    setPurchaseOrders(purchaseOrders.map(po => {
      if (po.id === id) {
        const updates: Partial<PurchaseOrder> = {status};
        
        if (status === 'Submitted' && !po.submittedAt) {
          updates.submittedAt = new Date();
        }
        
        if (status === 'Received' && !po.receivedAt) {
          updates.receivedAt = new Date();
        }
        
        return { ...po, ...updates };
      }
      return po;
    }));
  };

  const handleReceivePO = (id: string, receivedItems: any[], additionalCharges: any[]) => {
    setPurchaseOrders(purchaseOrders.map(po => {
      if (po.id === id) {
        return {
          ...po,
          status: 'Received' as POStatus,
          receivedAt: new Date(),
        };
      }
      return po;
    }));
    
    setDetailInventory(detailInventory.map(item => {
      const receivedItem = receivedItems.find(ri => ri.sku === item.sku);
      if (receivedItem) {
        const receivedCountingUnits = receivedItem.receivedQuantity * (receivedItem.orderingMinorCount || 1);
        return {
          ...item,
          estOnHand: item.estOnHand + receivedCountingUnits,
          onOrder: Math.max(0, (item.onOrder || 0) - receivedCountingUnits),
        };
      }
      return item;
    }));
    
    setSourceInventory(sourceInventory.map(item => {
      const receivedItem = receivedItems.find(ri => ri.sku === item.sku);
      if (receivedItem) {
        const receivedCountingUnits = receivedItem.receivedQuantity * (receivedItem.orderingMinorCount || 1);
        return {
          ...item,
          estOnHand: item.estOnHand + receivedCountingUnits,
        };
      }
      return item;
    }));
  };

  const handleViewPODetails = (po: PurchaseOrder) => {
    console.log('View PO Details:', po);
  };

  const handleAddItemsToPO = (poId: string, items: OrderItem[]) => {
    setPurchaseOrders(purchaseOrders.map(po => {
      if (po.id === poId) {
        const updatedItems = [...po.items, ...items];
        const updatedTotal = updatedItems.reduce((sum, item) => sum + item.totalCost, 0);
        return {
          ...po,
          items: updatedItems,
          totalCost: updatedTotal,
        };
      }
      return po;
    }));
  };

  const handleRemoveItemFromPO = (poId: string, itemId: string) => {
    setPurchaseOrders(purchaseOrders.map(po => {
      if (po.id === poId) {
        const updatedItems = po.items.filter(item => item.id !== itemId);
        const updatedTotal = updatedItems.reduce((sum, item) => sum + item.totalCost, 0);
        return {
          ...po,
          items: updatedItems,
          totalCost: updatedTotal,
        };
      }
      return po;
    }));
  };

  const handleEditSourceItem = (item: SourceInventoryItem) => {
    console.log('Edit source item:', item);
  };

  const handleCategoryClick = (category: string) => {
    setParCategoryFilter(category);
    setActiveTab('par');
  };

  const handleLockPhysicalCount = (items: CountItem[]) => {
    const newCount: PhysicalCount = {
      id: `count-${Date.now()}`,
      timestamp: new Date(),
      items,
    };
    
    setPastCounts(prev => [newCount, ...prev]);
    
    setSourceInventory(prev => {
      const updated = prev.map(sourceItem => {
        const countItem = items.find(ci => ci.id === sourceItem.id);
        if (countItem && countItem.newCount !== null) {
          return {
            ...sourceItem,
            lastPhysicalCount: countItem.newCount,
            estOnHand: countItem.newCount,
          };
        }
        return sourceItem;
      });
      return updated;
    });
    
    setDetailInventory(prev => {
      const updated = prev.map(detailItem => {
        const countItem = items.find(ci => ci.id === detailItem.id);
        if (countItem && countItem.newCount !== null) {
          return {
            ...detailItem,
            lastPhysicalCount: countItem.newCount,
            estOnHand: countItem.newCount,
          };
        }
        return detailItem;
      });
      return updated;
    });
  };

  const handleCSVImport = (items: SourceInventoryItem[]) => {
    // Clear existing data and import new
    setSourceInventory(items);
    setInventory(generateInventoryFromSource(items));
    setDefinitionInventory(generateDefinitionFromSource(items));
    setDetailInventory(generateDetailFromSource(items));
    setParInventory(generateParFromSource(items));
    
    // Clear orders and purchase orders
    setOrders([]);
    setPurchaseOrders([]);
    setPastCounts([]);
    
    // Show success message and navigate to home
    alert(`Successfully imported ${items.length} items! All existing data has been replaced.`);
    setActiveTab('home');
  };

  const availableOrderItems: OrderItem[] = useMemo(() => {
    return sourceInventory.map(sourceItem => {
      const defItem = definitionInventory.find(d => d.id === sourceItem.id);
      if (!defItem) return null;

      return {
        id: sourceItem.id,
        sku: sourceItem.sku,
        itemName: sourceItem.itemName,
        category: sourceItem.category,
        vendor: defItem.vendor || 'Unknown',
        vendorSKU: defItem.vendorSKU || '',
        quantityNeeded: 0,
        quantityToOrder: sourceItem.minOrder,
        orderingUnitOfPurchase: sourceItem.orderingUnitOfPurchase,
        countingMajorUnit: sourceItem.countingMajorUOM,
        unitPrice: sourceItem.lastVendorPrice,
        totalCost: sourceItem.minOrder * sourceItem.lastVendorPrice,
        minOrder: sourceItem.minOrder,
        orderingMinorCount: sourceItem.orderingMinorCount,
      };
    }).filter(item => item !== null) as OrderItem[];
  }, [sourceInventory, definitionInventory]);

  const categories = ['All', 'Produce', 'Proteins', 'Dairy', 'Dry Goods', 'Beverages', 'Condiments', 'Packaging'];

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'detail', label: 'Detail' },
    { id: 'physical', label: 'Physical' },
    { id: 'par', label: 'Par Levels' },
    { id: 'order-generation', label: 'Order Generation' },
    { id: 'purchase-orders', label: 'Purchase Orders' },
    { id: 'definition', label: 'Definition' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'source', label: 'SOURCE' },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Inventory Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Quick Serve Restaurant Management</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatsCard title="Safe Stock" value={stats.safeStockItems} icon={CheckCircle2} iconColor="text-green-500" />
              <StatsCard title="Below PAR" value={stats.belowParItems} icon={AlertTriangle} iconColor="text-yellow-500" />
              <StatsCard title="Out of Stock" value={stats.outOfStockItems} icon={ShoppingCart} iconColor="text-red-500" />
            </div>

            <CategoryStatus inventory={inventory} onCategoryClick={handleCategoryClick} />
          </>
        )}

        {activeTab === 'display' && (
          <div className="bg-gray-900 min-h-screen -m-8 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <StatsCardDark title="SAFE STOCK" value={stats.safeStockItems} icon={CheckCircle2} iconColor="bg-green-500" />
              <StatsCardDark title="BELOW PAR" value={stats.belowParItems} icon={AlertTriangle} iconColor="bg-yellow-500" />
              <StatsCardDark title="OUT OF STOCK" value={stats.outOfStockItems} icon={ShoppingCart} iconColor="bg-red-500" />
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
              <div className="px-6 py-5 border-b border-gray-700">
                <h2 className="text-2xl font-semibold text-white">Inventory Status</h2>
                <p className="text-sm text-gray-400 mt-2">
                  Real-time inventory monitoring • Showing {filteredInventory.length} of {inventory.length} items
                </p>
              </div>
              <InventoryTableDark items={filteredInventory} />
            </div>
          </div>
        )}

        {activeTab === 'definition' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Definition</h2>
            <DefinitionTable items={definitionInventory} onEditItem={handleEditDefinitionItem} onDeleteItem={handleDeleteDefinitionItem} onCopyItem={handleCopyDefinitionItem} onAddItem={handleAddDefinitionItem} />
          </div>
        )}

        {activeTab === 'detail' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Detail</h2>
            <DetailTable items={detailInventory} onEditItem={handleEditDetailItem} />
          </div>
        )}

        {activeTab === 'physical' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Physical Count</h2>
            <PhysicalCountTab 
              sourceInventory={sourceInventory} 
              definitionInventory={definitionInventory}
              onLockCount={handleLockPhysicalCount} 
              pastCounts={pastCounts} 
            />
          </div>
        )}

        {activeTab === 'par' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">PAR</h2>
            <ParTable items={parInventory} onUpdatePar={handleUpdatePar} onGenerateOrder={handleGenerateOrder} parCategoryFilter={parCategoryFilter} />
          </div>
        )}

        {activeTab === 'order-generation' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Order Generation</h2>
            <OrdersTable 
              items={orders} 
              onEditItem={handleEditOrder} 
              onAddItem={handleAddOrder} 
              onDeleteItem={handleDeleteOrder} 
              onClearAll={handleClearAllOrders}
              onClearVendorOrder={handleClearVendorOrder}
              onCreatePO={handleCreatePO}
              onDraftAllPOs={handleDraftAllPOs}
              availableItems={availableOrderItems}
              sourceInventory={sourceInventory}
            />
          </div>
        )}

        {activeTab === 'purchase-orders' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Purchase Orders</h2>
            
            <div className="flex gap-2 mb-6 border-b border-border">
              <button
                onClick={() => setPOSubTab('open')}
                className={
                  poSubTab === 'open'
                    ? 'px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition-colors'
                    : 'px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 transition-colors'
                }
              >
                OPEN POs
              </button>
              <button
                onClick={() => setPOSubTab('closed')}
                className={
                  poSubTab === 'closed'
                    ? 'px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition-colors'
                    : 'px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 transition-colors'
                }
              >
                CLOSED POs
              </button>
            </div>
            
            {poSubTab === 'open' && (
              <PurchaseOrdersTable 
                purchaseOrders={purchaseOrders.filter(po => po.status === 'Draft' || po.status === 'Submitted')} 
                onUpdateStatus={handleUpdatePOStatus}
                onReceivePO={handleReceivePO}
                onViewDetails={handleViewPODetails}
                availableChargeTypes={additionalChargeTypes}
                availableItems={availableOrderItems}
                onAddItemsToPO={handleAddItemsToPO}
                onRemoveItemFromPO={handleRemoveItemFromPO}
              />
            )}
            
            {poSubTab === 'closed' && (
              <ClosedPOsTable 
                purchaseOrders={purchaseOrders.filter(po => po.status === 'Received' || po.status === 'Cancelled')} 
                onViewPO={handleViewPODetails}
              />
            )}
          </div>
        )}

        {activeTab === 'configuration' && (
          <ConfigurationTab 
            categoryPrefixes={categoryPrefixes}
            additionalChargeTypes={additionalChargeTypes}
            onUpdatePrefixes={handleUpdateCategoryPrefixes}
            onUpdateChargeTypes={setAdditionalChargeTypes}
            onCSVImport={handleCSVImport}
          />
        )}
        
        {activeTab === 'source' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Source</h2>
            <SourceTable items={sourceInventory} onEditItem={handleEditSourceItem} />
          </div>
        )}
      </main>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={editingItem ? handleEditItem : handleAddItem}
        item={editingItem}
      />
      <DefinitionModal
        isOpen={isDefinitionModalOpen}
        onClose={() => setIsDefinitionModalOpen(false)}
        onSave={editingDefinitionItem ? handleSaveDefinitionItem : handleAddDefinitionItem}
        item={editingDefinitionItem}
      />
    </div>
  );
}