export type DataSource = 'actual' | 'assumed' | 'allocated';
export type Period = 'today' | 'week' | 'month';
export type Frequency = 'monthly' | 'annually' | 'schedule';
export type PeriodStatus = 'open' | 'partially-actual' | 'fully-trued-up';
export type CostCategory = 'rent' | 'cams' | 'utilities' | 'insurance' | 'saas' | 'repairs' | 'supplies' | 'other';

// Operating expense categories used in P&L organization
export type OperatingCategory = 
  | 'occupancy'
  | 'labor'
  | 'food-cost'
  | 'beverage-cost'
  | 'packaging'
  | 'marketing'
  | 'technology'
  | 'operations'
  | 'admin';

// General ledger account types
export type AccountType = 
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'cogs'
  | 'labor'
  | 'operating-expense';

export interface LeaseYear {
  year: number;
  amount: number;
}

export interface LeasePeriod {
  startDate: Date;
  endDate: Date;
  amount: number;
}

export interface LeaseSchedule {
  periods: LeasePeriod[];
}

export interface CostItem {
  id: string;
  name: string;
  category: CostCategory;
  amount: number;
  frequency: Frequency;
  glAccountId: string; // Required: links to specific GL account
  notes?: string;
  effectiveDate: Date;
  createdBy: string;
  createdAt: Date;
  leaseSchedule?: LeaseSchedule;
  supersededBy?: string; // ID of the cost item that replaced this one
}

// General Ledger Account for mapping configuration
export interface GLAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  operatingCategory?: OperatingCategory; // Only applicable for operating-expense accounts
  createdAt: Date;
  updatedAt: Date;
}

export interface CostChangeHistory {
  id: string;
  costItemId: string;
  field: string;
  previousValue: string | number;
  newValue: string | number;
  effectiveDate: Date;
  changedBy: string;
  changedAt: Date;
  notes?: string;
}

export interface TrueUpEntry {
  id: string;
  costItemId: string;
  period: string; // ISO date string for the period start (YYYY-MM)
  assumedAmount: number;
  actualAmount: number;
  variance: number;
  notes?: string;
  truedUpBy: string;
  truedUpAt: Date;
  locked: boolean; // Once true-up is confirmed, it's locked
}

export interface PLLineItem {
  label: string;
  value: number;
  source: DataSource;
  isSubtotal?: boolean;
  isTotal?: boolean;
}

export interface PLSection {
  title: string;
  items: PLLineItem[];
}

export interface PLData {
  period: Period;
  periodLabel: string;
  coverage: number; // 0-100, percentage of actual data
  netSales: number;
  foodCost: number;
  laborCost: number;
  primeCost: number;
  primeCostPercent: number;
  operatingExpenses: number;
  fixedCosts: number;
  operatingMargin: number;
  operatingMarginPercent: number;
  sections: PLSection[];
}

export interface HistoricalPeriod {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  coverage: number;
}