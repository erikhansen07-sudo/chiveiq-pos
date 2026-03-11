import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { CostItem } from '@/app/components/livepl/types';
import type { Employee, ScheduledShift, TimePunch } from '@/app/components/labor/types';
import type { SourceInventoryItem } from '@/app/components/inventory/SourceTable';

// AppDataContext - Central data management for the POS system
interface Transaction {
  id: string;
  timestamp: Date;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  tips?: number;
  paymentMethod?: string;
  discounts?: number;
  voids?: number;
}

interface AppDataContextType {
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  loadSampleData: () => void;
  
  // Cost Items (from Live P&L)
  costItems: CostItem[];
  setCostItems: (items: CostItem[]) => void;
  
  // Labor
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  timePunches: TimePunch[];
  setTimePunches: (punches: TimePunch[]) => void;
  scheduledShifts: ScheduledShift[];
  setScheduledShifts: (shifts: ScheduledShift[]) => void;
  
  // Inventory
  inventoryItems: SourceInventoryItem[];
  setInventoryItems: (items: SourceInventoryItem[]) => void;
  
  // Calculated metrics
  getTodayRevenue: () => number;
  getWeekRevenue: () => number;
  getMonthRevenue: () => number;
  getTodayFoodCost: () => number;
  getWeekFoodCost: () => number;
  getMonthFoodCost: () => number;
  getTodayLaborCost: () => number;
  getWeekLaborCost: () => number;
  getMonthLaborCost: () => number;
  getFixedCosts: (period: 'DAY' | 'WEEK' | 'MONTH') => CostItem[];
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const initialCostItems: CostItem[] = [
  {
    id: 'cost-1',
    name: 'Rent',
    category: 'rent',
    amount: 4500,
    frequency: 'monthly',
    allocationMethod: 'per-day-open',
    effectiveDate: new Date('2026-01-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'cost-2',
    name: 'Insurance',
    category: 'insurance',
    amount: 800,
    frequency: 'monthly',
    allocationMethod: 'per-day-open',
    effectiveDate: new Date('2026-01-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'cost-3',
    name: 'POS Software',
    category: 'saas',
    amount: 199,
    frequency: 'monthly',
    allocationMethod: 'per-day-open',
    effectiveDate: new Date('2026-01-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'cost-4',
    name: 'Utilities',
    category: 'utilities',
    amount: 1200,
    frequency: 'monthly',
    allocationMethod: 'per-day-open',
    effectiveDate: new Date('2026-01-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'cost-5',
    name: 'Cleaning Supplies',
    category: 'supplies',
    amount: 150,
    frequency: 'weekly',
    allocationMethod: 'per-day-open',
    effectiveDate: new Date('2026-02-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-02-01'),
  },
];

// Generate sample transaction data for testing
const generateSampleTransactions = (): Transaction[] => {
  const now = new Date();
  const transactions: Transaction[] = [];
  
  // Menu items with prices - matching the actual POS menu with variants
  const menuItems = [
    // Burgers
    { name: 'Classic Burger - Single', price: 8.99, category: 'Burgers' },
    { name: 'Classic Burger - Double', price: 11.99, category: 'Burgers' },
    { name: 'Cheeseburger - Single', price: 9.99, category: 'Burgers' },
    { name: 'Cheeseburger - Double', price: 12.99, category: 'Burgers' },
    { name: 'Bacon Burger - Single', price: 10.99, category: 'Burgers' },
    { name: 'Bacon Burger - Double', price: 13.99, category: 'Burgers' },
    { name: 'Veggie Burger - Regular', price: 9.49, category: 'Burgers' },
    
    // Sides
    { name: 'French Fries - Small', price: 2.99, category: 'Sides' },
    { name: 'French Fries - Medium', price: 3.99, category: 'Sides' },
    { name: 'French Fries - Large', price: 4.99, category: 'Sides' },
    { name: 'Onion Rings - Small', price: 3.49, category: 'Sides' },
    { name: 'Onion Rings - Large', price: 4.99, category: 'Sides' },
    { name: 'Garden Salad - Small', price: 3.99, category: 'Sides' },
    { name: 'Garden Salad - Large', price: 5.99, category: 'Sides' },
    { name: 'Coleslaw - Regular', price: 3.49, category: 'Sides' },
    
    // Drinks
    { name: 'Soft Drink - Small', price: 1.99, category: 'Drinks' },
    { name: 'Soft Drink - Medium', price: 2.49, category: 'Drinks' },
    { name: 'Soft Drink - Large', price: 2.99, category: 'Drinks' },
    { name: 'Iced Tea - Small', price: 1.99, category: 'Drinks' },
    { name: 'Iced Tea - Medium', price: 2.49, category: 'Drinks' },
    { name: 'Iced Tea - Large', price: 2.99, category: 'Drinks' },
    { name: 'Milkshake - Small', price: 3.99, category: 'Drinks' },
    { name: 'Milkshake - Large', price: 5.49, category: 'Drinks' },
    { name: 'Bottled Water - Small', price: 1.49, category: 'Drinks' },
    { name: 'Bottled Water - Large', price: 1.99, category: 'Drinks' },
    
    // Desserts
    { name: 'Apple Pie - Regular', price: 3.99, category: 'Desserts' },
    { name: 'Ice Cream Cone - Single Scoop', price: 2.99, category: 'Desserts' },
    { name: 'Ice Cream Cone - Double Scoop', price: 4.49, category: 'Desserts' },
    { name: 'Brownie - Regular', price: 3.99, category: 'Desserts' },
    { name: 'Cookie - Regular', price: 2.49, category: 'Desserts' },
  ];
  
  let transactionId = 1;
  
  // Payment method options
  const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'Apple Pay', 'Google Pay'];
  
  // Helper to create a realistic combo transaction
  const createRealisticTransaction = (timestamp: Date): Transaction => {
    const items = [];
    let subtotal = 0;
    
    // 70% chance of burger combo (burger + side + drink)
    if (Math.random() > 0.3) {
      // Pick a burger
      const burgerItems = menuItems.filter(item => item.category === 'Burgers');
      const burger = burgerItems[Math.floor(Math.random() * burgerItems.length)];
      items.push({ name: burger.name, price: burger.price, quantity: 1 });
      subtotal += burger.price;
      
      // 80% chance of side
      if (Math.random() > 0.2) {
        const sideItems = menuItems.filter(item => item.category === 'Sides');
        const side = sideItems[Math.floor(Math.random() * sideItems.length)];
        items.push({ name: side.name, price: side.price, quantity: 1 });
        subtotal += side.price;
      }
      
      // 90% chance of drink
      if (Math.random() > 0.1) {
        const drinkItems = menuItems.filter(item => item.category === 'Drinks');
        const drink = drinkItems[Math.floor(Math.random() * drinkItems.length)];
        items.push({ name: drink.name, price: drink.price, quantity: 1 });
        subtotal += drink.price;
      }
      
      // 25% chance of dessert
      if (Math.random() > 0.75) {
        const dessertItems = menuItems.filter(item => item.category === 'Desserts');
        const dessert = dessertItems[Math.floor(Math.random() * dessertItems.length)];
        items.push({ name: dessert.name, price: dessert.price, quantity: 1 });
        subtotal += dessert.price;
      }
    } else {
      // Random 1-4 items
      const numItems = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < numItems; i++) {
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.random() > 0.8 ? 2 : 1; // 20% chance of quantity 2
        items.push({ name: item.name, price: item.price, quantity });
        subtotal += item.price * quantity;
      }
    }
    
    // Random discounts (5% chance)
    const discounts = Math.random() > 0.95 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    
    // Random voids (2% chance, small amount)
    const voids = Math.random() > 0.98 ? Math.round(Math.random() * 5 * 100) / 100 : 0;
    
    const adjustedSubtotal = subtotal - discounts - voids;
    const tax = Math.round(adjustedSubtotal * 0.0875 * 100) / 100; // 8.75% tax
    
    // Random tips (70% chance, between 15-22% of subtotal)
    const tipPercentage = Math.random() > 0.3 ? 0.15 + Math.random() * 0.07 : 0;
    const tips = Math.round(adjustedSubtotal * tipPercentage * 100) / 100;
    
    const total = Math.round((adjustedSubtotal + tax + tips) * 100) / 100;
    
    // Random payment method
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    return {
      id: `txn-sample-${transactionId++}`,
      timestamp,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
      tips: tips > 0 ? tips : undefined,
      paymentMethod,
      discounts: discounts > 0 ? discounts : undefined,
      voids: voids > 0 ? voids : undefined,
    };
  };
  
  // Helper to create transactions for a specific day with realistic hourly distribution
  const createTransactionsForDay = (date: Date, isToday: boolean = false) => {
    // Business hours: 6am-10pm
    // Peak hours: 11:30am-1:30pm (lunch), 5:30pm-7:30pm (dinner)
    
    // Hourly distribution (approximate transactions per hour)
    const hourlyDistribution = {
      6: 2, 7: 3, 8: 4, 9: 3, 10: 4,
      11: 8, 12: 12, 13: 10, // Lunch rush
      14: 5, 15: 4, 16: 5,
      17: 8, 18: 14, 19: 12, // Dinner rush
      20: 6, 21: 4
    };
    
    const dayTransactions: Transaction[] = [];
    
    Object.entries(hourlyDistribution).forEach(([hour, count]) => {
      const hourNum = parseInt(hour);
      
      // If today, only generate transactions up to current hour
      if (isToday && hourNum > now.getHours()) {
        return;
      }
      
      for (let i = 0; i < count; i++) {
        const timestamp = new Date(date);
        timestamp.setHours(hourNum, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
        
        // If today and in current hour, make sure we don't create future transactions
        if (isToday && hourNum === now.getHours() && timestamp > now) {
          continue;
        }
        
        dayTransactions.push(createRealisticTransaction(timestamp));
      }
    });
    
    return dayTransactions;
  };
  
  // Generate transactions for TODAY
  const todayTransactions = createTransactionsForDay(now, true);
  transactions.push(...todayTransactions);
  
  // Generate transactions for last 30 days
  for (let daysAgo = 1; daysAgo <= 30; daysAgo++) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // 85% chance of being open on any given day
    if (Math.random() > 0.15) {
      const dayTransactions = createTransactionsForDay(date);
      transactions.push(...dayTransactions);
    }
  }
  
  // Sort by timestamp (oldest first)
  return transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Generate sample time punches to ensure employees are clocked in for all transactions
const generateSampleTimePunches = (): TimePunch[] => {
  const punches: TimePunch[] = [];
  let punchId = 1;
  const now = new Date();
  
  // Employee IDs for active employees - aligned with roles
  const shiftAssignments = [
    // Morning shift (6am-2:30pm) - handles breakfast and lunch rush
    { 
      shift: 'morning', 
      start: 6, 
      end: 14.5,
      employees: [
        { id: 'emp-1', role: 'Manager' },      // Sarah Johnson - oversees opening
        { id: 'emp-2', role: 'Cook' },         // Mike Chen - morning cook
        { id: 'emp-3', role: 'Cashier' },      // Emily Rodriguez - morning cashier
      ]
    },
    // Midday shift (10:30am-7pm) - covers lunch rush and into dinner
    { 
      shift: 'midday', 
      start: 10.5, 
      end: 19,
      employees: [
        { id: 'emp-4', role: 'Line Cook' },    // James Wilson - lunch/dinner prep
        { id: 'emp-5', role: 'Cashier' },      // Amanda Lee - midday cashier
      ]
    },
    // Evening shift (4pm-10:30pm) - handles dinner rush and closing
    { 
      shift: 'evening', 
      start: 16, 
      end: 22.5,
      employees: [
        { id: 'emp-6', role: 'Assistant Manager' },  // David Martinez - closing manager
        { id: 'emp-7', role: 'Prep Cook' },          // Lisa Thompson - evening cook
      ]
    },
  ];

  // Generate punches for the last 30 days
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // 85% chance of being open (matches transaction generation)
    if (Math.random() > 0.15) {
      // Generate shifts for this day
      shiftAssignments.forEach(assignment => {
        assignment.employees.forEach(emp => {
          // 92% chance employee shows up for their shift
          if (Math.random() > 0.08) {
            // Clock in time (within 10 minutes of shift start)
            const clockInTime = new Date(date);
            const startHour = Math.floor(assignment.start);
            const startMinute = (assignment.start % 1) * 60;
            const variation = Math.floor(Math.random() * 10) - 2; // -2 to +8 minutes
            clockInTime.setHours(startHour, startMinute + variation, 0, 0);
            
            // Clock out time (within 15 minutes of shift end)
            const clockOutTime = new Date(date);
            const endHour = Math.floor(assignment.end);
            const endMinute = (assignment.end % 1) * 60;
            const endVariation = Math.floor(Math.random() * 15) - 5; // -5 to +10 minutes
            clockOutTime.setHours(endHour, endMinute + endVariation, 0, 0);
            
            // Don't create future punches
            if (clockInTime > now) return;
            
            // Clock in
            punches.push({
              id: `punch-${punchId++}`,
              employeeId: emp.id,
              timestamp: clockInTime,
              punchType: 'clock-in',
              editedBy: undefined,
              editReason: undefined,
              isEdited: false,
            });
            
            // Break logic for longer shifts (6+ hours)
            const shiftLength = assignment.end - assignment.start;
            if (shiftLength >= 6) {
              // 85% chance of taking a break
              if (Math.random() > 0.15) {
                const breakStart = new Date(clockInTime);
                const hoursIntoShift = 2.5 + Math.random() * 2; // 2.5-4.5 hours into shift
                breakStart.setTime(breakStart.getTime() + hoursIntoShift * 60 * 60 * 1000);
                
                if (breakStart < now && breakStart < clockOutTime) {
                  punches.push({
                    id: `punch-${punchId++}`,
                    employeeId: emp.id,
                    timestamp: breakStart,
                    punchType: 'break-start',
                    editedBy: undefined,
                    editReason: undefined,
                    isEdited: false,
                  });
                  
                  const breakEnd = new Date(breakStart);
                  breakEnd.setMinutes(breakEnd.getMinutes() + 30); // 30 min break
                  
                  if (breakEnd < now && breakEnd < clockOutTime) {
                    punches.push({
                      id: `punch-${punchId++}`,
                      employeeId: emp.id,
                      timestamp: breakEnd,
                      punchType: 'break-end',
                      editedBy: undefined,
                      editReason: undefined,
                      isEdited: false,
                    });
                  }
                }
              }
            }
            
            // Clock out (only if not in the future and shift has ended)
            if (clockOutTime <= now) {
              punches.push({
                id: `punch-${punchId++}`,
                employeeId: emp.id,
                timestamp: clockOutTime,
                punchType: 'clock-out',
                editedBy: undefined,
                editReason: undefined,
                isEdited: false,
              });
            }
          }
        });
      });
      
      // Occasionally add a manager edit for late punch (3% of all punch days)
      if (Math.random() > 0.97 && punches.length > 4) {
        const randomPunch = punches[Math.floor(Math.random() * Math.min(punches.length, punches.length - 20))];
        if (randomPunch && !randomPunch.isEdited) {
          randomPunch.isEdited = true;
          randomPunch.editedBy = 'emp-1'; // Edited by manager Sarah Johnson
          randomPunch.editReason = 'Forgot to clock in on time';
        }
      }
    }
  }
  
  // Sort by timestamp
  return punches.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Generate initial employees
const generateInitialEmployees = (): Employee[] => {
  return [
    { id: 'emp-1', name: 'Sarah Johnson', title: 'Manager', startDate: new Date('2023-01-15'), payType: 'salary', payRate: 52000, status: 'active', pin: '1234', tipEligible: false },
    { id: 'emp-2', name: 'Mike Chen', title: 'Cook', startDate: new Date('2023-03-10'), payType: 'hourly', payRate: 16.00, status: 'active', pin: '2345', tipEligible: true },
    { id: 'emp-3', name: 'Emily Rodriguez', title: 'Cashier', startDate: new Date('2023-06-01'), payType: 'hourly', payRate: 15.00, status: 'active', pin: '3456', tipEligible: true },
    { id: 'emp-4', name: 'James Wilson', title: 'Line Cook', startDate: new Date('2023-02-20'), payType: 'hourly', payRate: 16.50, status: 'active', pin: '4567', tipEligible: true },
    { id: 'emp-5', name: 'Amanda Lee', title: 'Cashier', startDate: new Date('2023-07-15'), payType: 'hourly', payRate: 14.50, status: 'active', pin: '5678', tipEligible: true },
    { id: 'emp-6', name: 'David Martinez', title: 'Assistant Manager', startDate: new Date('2023-04-01'), payType: 'salary', payRate: 45000, status: 'active', pin: '6789', tipEligible: false },
    { id: 'emp-7', name: 'Lisa Thompson', title: 'Prep Cook', startDate: new Date('2023-08-01'), payType: 'hourly', payRate: 14.00, status: 'active', pin: '7890', tipEligible: true },
  ];
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>(initialCostItems);
  const [employees, setEmployees] = useState<Employee[]>(generateInitialEmployees());
  const [timePunches, setTimePunches] = useState<TimePunch[]>([]);
  const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([]);
  const [inventoryItems, setInventoryItems] = useState<SourceInventoryItem[]>([]);

  // Load sample data on mount - always generate fresh data for testing
  useEffect(() => {
    const sampleTransactions = generateSampleTransactions();
    setTransactions(sampleTransactions);
    const sampleTimePunches = generateSampleTimePunches();
    setTimePunches(sampleTimePunches);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 SAMPLE DATA LOADED');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Transactions: ${sampleTransactions.length} total`);
    console.log(`   💰 With tips: ${sampleTransactions.filter(t => t.tips && t.tips > 0).length}`);
    console.log(`   💳 Payment methods: ${new Set(sampleTransactions.map(t => t.paymentMethod)).size} types`);
    console.log(`   🎯 In business hours: ${sampleTransactions.filter(t => {
      const hour = t.timestamp.getHours();
      return hour >= 6 && hour < 22;
    }).length}/${sampleTransactions.length}`);
    
    // Calculate revenue by period
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const todayRevenue = sampleTransactions.filter(t => t.timestamp >= startOfDay).reduce((sum, t) => sum + t.total, 0);
    const weekRevenue = sampleTransactions.filter(t => t.timestamp >= startOfWeek).reduce((sum, t) => sum + t.total, 0);
    const monthRevenue = sampleTransactions.filter(t => t.timestamp >= startOfMonth).reduce((sum, t) => sum + t.total, 0);
    
    console.log(`   📈 Revenue - Today: $${todayRevenue.toFixed(2)} | Week: $${weekRevenue.toFixed(2)} | Month: $${monthRevenue.toFixed(2)}`);
    console.log('───────────────────────────────────────────────────────');
    console.log(`🕒 Time Punches: ${sampleTimePunches.length} total`);
    
    // Calculate punches by employee
    const punchesByEmployee = new Map<string, number>();
    sampleTimePunches.forEach(punch => {
      punchesByEmployee.set(punch.employeeId, (punchesByEmployee.get(punch.employeeId) || 0) + 1);
    });
    
    console.log(`   👥 Employees with punches: ${punchesByEmployee.size}`);
    punchesByEmployee.forEach((count, empId) => {
      const emp = generateInitialEmployees().find(e => e.id === empId);
      if (emp) {
        console.log(`      ${emp.name} (${emp.title}): ${count} punches`);
      }
    });
    
    // Calculate hours by employee for today
    const todayPunches = sampleTimePunches.filter(p => p.timestamp >= startOfDay);
    const employeeHours = new Map<string, number>();
    const employeePunches = new Map<string, TimePunch[]>();
    
    todayPunches.forEach(punch => {
      const existing = employeePunches.get(punch.employeeId) || [];
      employeePunches.set(punch.employeeId, [...existing, punch]);
    });
    
    employeePunches.forEach((punches, empId) => {
      let clockInTime: Date | null = null;
      let totalHours = 0;
      
      punches.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).forEach(punch => {
        if (punch.punchType === 'clock-in') {
          clockInTime = punch.timestamp;
        } else if (punch.punchType === 'clock-out' && clockInTime) {
          const hours = (punch.timestamp.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
          clockInTime = null;
        }
      });
      
      if (clockInTime) {
        const hours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
      
      if (totalHours > 0) {
        employeeHours.set(empId, totalHours);
      }
    });
    
    console.log(`   ⏱️  Today's hours worked:`);
    employeeHours.forEach((hours, empId) => {
      const emp = generateInitialEmployees().find(e => e.id === empId);
      if (emp) {
        console.log(`      ${emp.name}: ${hours.toFixed(2)}h`);
      }
    });
    
    console.log('═══════════════════════════════════════════════════════\n');
  }, []);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn-${Date.now()}`,
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const loadSampleData = () => {
    const sampleTransactions = generateSampleTransactions();
    setTransactions(sampleTransactions);
    const sampleTimePunches = generateSampleTimePunches();
    setTimePunches(sampleTimePunches);
    localStorage.setItem('hasLoadedSampleData', 'true');
    console.log(`Loaded ${sampleTransactions.length} sample transactions`);
    console.log(`🕒 Loaded ${sampleTimePunches.length} sample time punches`);
  };

  // Helper to get start of day/week/month
  const getStartOfPeriod = (period: 'DAY' | 'WEEK' | 'MONTH'): Date => {
    const now = new Date();
    const start = new Date(now);
    
    switch (period) {
      case 'DAY':
        start.setHours(0, 0, 0, 0);
        break;
      case 'WEEK':
        const day = start.getDay();
        const diff = start.getDate() - day;
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        break;
      case 'MONTH':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    
    return start;
  };

  const getTodayRevenue = () => {
    const startOfDay = getStartOfPeriod('DAY');
    return transactions
      .filter(t => t.timestamp >= startOfDay)
      .reduce((sum, t) => sum + t.total, 0);
  };

  const getWeekRevenue = () => {
    const startOfWeek = getStartOfPeriod('WEEK');
    return transactions
      .filter(t => t.timestamp >= startOfWeek)
      .reduce((sum, t) => sum + t.total, 0);
  };

  const getMonthRevenue = () => {
    const startOfMonth = getStartOfPeriod('MONTH');
    return transactions
      .filter(t => t.timestamp >= startOfMonth)
      .reduce((sum, t) => sum + t.total, 0);
  };

  // Food cost estimation (rough estimate: 25% of revenue as placeholder)
  const getTodayFoodCost = () => getTodayRevenue() * 0.25;
  const getWeekFoodCost = () => getWeekRevenue() * 0.25;
  const getMonthFoodCost = () => getMonthRevenue() * 0.25;

  const calculateLaborCost = (startDate: Date): number => {
    const now = new Date();
    
    // Find all punches in the period
    const relevantPunches = timePunches
      .filter(p => p.timestamp >= startDate && p.timestamp <= now)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Group punches by employee
    const employeePunches = new Map<string, TimePunch[]>();
    relevantPunches.forEach(punch => {
      const existing = employeePunches.get(punch.employeeId) || [];
      employeePunches.set(punch.employeeId, [...existing, punch]);
    });
    
    let totalCost = 0;
    
    // Calculate hours worked for each employee
    employeePunches.forEach((punches, employeeId) => {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee || !employee.payRate || employee.payType !== 'hourly') return;
      
      let clockInTime: Date | null = null;
      let totalHours = 0;
      
      punches.forEach(punch => {
        if (punch.punchType === 'clock-in') {
          clockInTime = punch.timestamp;
        } else if (punch.punchType === 'clock-out' && clockInTime) {
          const hours = (punch.timestamp.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
          clockInTime = null;
        }
      });
      
      // If still clocked in, calculate up to now
      if (clockInTime) {
        const hours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
      
      totalCost += totalHours * employee.payRate;
    });
    
    return totalCost;
  };

  const getTodayLaborCost = () => calculateLaborCost(getStartOfPeriod('DAY'));
  const getWeekLaborCost = () => calculateLaborCost(getStartOfPeriod('WEEK'));
  const getMonthLaborCost = () => calculateLaborCost(getStartOfPeriod('MONTH'));

  const getFixedCosts = (period: 'DAY' | 'WEEK' | 'MONTH'): CostItem[] => {
    return costItems.map(item => {
      // Calculate the allocated amount based on period
      let allocatedAmount = item.amount;
      
      if (item.frequency === 'monthly') {
        if (period === 'DAY') {
          allocatedAmount = item.amount / 30; // Daily allocation
        } else if (period === 'WEEK') {
          allocatedAmount = item.amount / 4.33; // Weekly allocation
        }
        // For MONTH, use the full amount
      } else if (item.frequency === 'weekly') {
        if (period === 'DAY') {
          allocatedAmount = item.amount / 7; // Daily allocation
        } else if (period === 'MONTH') {
          allocatedAmount = item.amount * 4.33; // Monthly allocation
        }
        // For WEEK, use the full amount
      } else if (item.frequency === 'daily') {
        if (period === 'WEEK') {
          allocatedAmount = item.amount * 7; // Weekly allocation
        } else if (period === 'MONTH') {
          allocatedAmount = item.amount * 30; // Monthly allocation
        }
        // For DAY, use the full amount
      }
      
      return {
        ...item,
        amount: allocatedAmount,
      };
    });
  };

  return (
    <AppDataContext.Provider
      value={{
        transactions,
        addTransaction,
        loadSampleData,
        costItems,
        setCostItems,
        employees,
        setEmployees,
        timePunches,
        setTimePunches,
        scheduledShifts,
        setScheduledShifts,
        inventoryItems,
        setInventoryItems,
        getTodayRevenue,
        getWeekRevenue,
        getMonthRevenue,
        getTodayFoodCost,
        getWeekFoodCost,
        getMonthFoodCost,
        getTodayLaborCost,
        getWeekLaborCost,
        getMonthLaborCost,
        getFixedCosts,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}