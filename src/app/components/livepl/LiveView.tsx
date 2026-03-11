import React, { useState } from 'react';
import { DollarSign, TrendingUp, Utensils, Users, PieChart, AlertCircle } from 'lucide-react';
import type { CostItem, TrueUpEntry, Period, PLData, DataSource } from './types';

interface LiveViewProps {
  costItems: CostItem[];
  trueUps: TrueUpEntry[];
}

export function LiveView({ costItems, trueUps }: LiveViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');

  const plData = calculatePLData(selectedPeriod, costItems, trueUps);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as Period[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground border border-border hover:bg-accent'
              }`}
            >
              {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Coverage Indicator */}
        <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${plData.coverage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground">
              {plData.coverage}% Actual Data
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Net Sales"
          value={plData.netSales}
          source="actual"
          icon={DollarSign}
          iconColor="bg-primary"
          format="currency"
        />
        <MetricCard
          title="Food Cost"
          value={plData.foodCost}
          source="assumed"
          icon={Utensils}
          iconColor="bg-orange-500"
          format="currency"
        />
        <MetricCard
          title="Labor Cost"
          value={plData.laborCost}
          source="actual"
          icon={Users}
          iconColor="bg-purple-500"
          format="currency"
        />
        <MetricCard
          title="Prime Cost"
          value={plData.primeCostPercent}
          source="actual"
          icon={PieChart}
          iconColor="bg-destructive"
          format="percent"
          subtitle={`$${plData.primeCost.toFixed(2)}`}
        />
        <MetricCard
          title="Operating Margin"
          value={plData.operatingMarginPercent}
          source="actual"
          icon={TrendingUp}
          iconColor="bg-primary"
          format="percent"
          subtitle={`$${plData.operatingMargin.toFixed(2)}`}
        />
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Operational View Only</p>
          <p className="mt-1 text-amber-700">
            This is a real-time operational tool for intraday decisions. Values marked as "Assumed" or "Allocated" 
            are estimates. Not for accounting, payroll, or compliance purposes.
          </p>
        </div>
      </div>

      {/* P&L Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Profit & Loss - {plData.periodLabel}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-foreground">Line Item</th>
                <th className="text-right px-6 py-3 font-semibold text-foreground">Amount</th>
                <th className="text-right px-6 py-3 font-semibold text-foreground">% of Sales</th>
                <th className="text-center px-6 py-3 font-semibold text-foreground">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Revenue */}
              <tr>
                <td className="px-6 py-4 font-medium text-foreground">Revenue</td>
                <td className="px-6 py-4 text-right font-medium text-foreground">${plData.netSales.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-medium text-foreground">100.0%</td>
                <td className="px-6 py-4 text-center">
                  <SourceBadge source="actual" />
                </td>
              </tr>

              {/* COGS */}
              <tr>
                <td className="px-6 py-4 text-muted-foreground">Cost of Goods Sold</td>
                <td className="px-6 py-4 text-right text-muted-foreground">${plData.foodCost.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-muted-foreground">{((plData.foodCost / plData.netSales) * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-center">
                  <SourceBadge source="assumed" />
                </td>
              </tr>

              {/* Gross Profit */}
              <tr className="bg-muted">
                <td className="px-6 py-4 font-semibold text-foreground pl-8">Gross Profit</td>
                <td className="px-6 py-4 text-right font-semibold text-foreground">${(plData.netSales - plData.foodCost).toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-semibold text-foreground">{(((plData.netSales - plData.foodCost) / plData.netSales) * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-center"></td>
              </tr>

              {/* Labor */}
              <tr>
                <td className="px-6 py-4 text-muted-foreground">Labor</td>
                <td className="px-6 py-4 text-right text-muted-foreground">${plData.laborCost.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-muted-foreground">{((plData.laborCost / plData.netSales) * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-center">
                  <SourceBadge source="actual" />
                </td>
              </tr>

              {/* Prime Cost */}
              <tr className="bg-muted">
                <td className="px-6 py-4 font-semibold text-foreground pl-8">Prime Cost</td>
                <td className="px-6 py-4 text-right font-semibold text-foreground">${plData.primeCost.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-semibold text-foreground">{plData.primeCostPercent.toFixed(1)}%</td>
                <td className="px-6 py-4 text-center"></td>
              </tr>

              {/* Operating Expenses */}
              <tr>
                <td className="px-6 py-4 text-muted-foreground">Operating Expenses</td>
                <td className="px-6 py-4 text-right text-muted-foreground">${plData.operatingExpenses.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-muted-foreground">{((plData.operatingExpenses / plData.netSales) * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-center">
                  <SourceBadge source="allocated" />
                </td>
              </tr>

              {/* Fixed Costs */}
              <tr>
                <td className="px-6 py-4 text-muted-foreground">Fixed Costs</td>
                <td className="px-6 py-4 text-right text-muted-foreground">${plData.fixedCosts.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-muted-foreground">{((plData.fixedCosts / plData.netSales) * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-center">
                  <SourceBadge source="allocated" />
                </td>
              </tr>

              {/* EBITDA (Bottom Line) */}
              <tr className="bg-secondary border-t-2 border-primary/30">
                <td className="px-6 py-5 font-bold text-foreground text-lg">EBITDA</td>
                <td className="px-6 py-5 text-right font-bold text-foreground text-lg">${plData.operatingMargin.toFixed(2)}</td>
                <td className="px-6 py-5 text-right font-bold text-foreground text-lg">{plData.operatingMarginPercent.toFixed(1)}%</td>
                <td className="px-6 py-5 text-center"></td>
              </tr>

              {/* Daily EBITDA (if not already daily) */}
              {selectedPeriod !== 'today' && (
                <tr className="bg-secondary">
                  <td className="px-6 py-4 font-semibold text-muted-foreground pl-8">Daily EBITDA (avg)</td>
                  <td className="px-6 py-4 text-right font-semibold text-muted-foreground">
                    ${(plData.operatingMargin / (selectedPeriod === 'week' ? 7 : 30)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-muted-foreground">
                    {plData.operatingMarginPercent.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  source: DataSource;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  format: 'currency' | 'percent';
  subtitle?: string;
}

function MetricCard({ title, value, source, icon: Icon, iconColor, format, subtitle }: MetricCardProps) {
  const formattedValue = format === 'currency' 
    ? `$${value.toFixed(2)}` 
    : `${value.toFixed(1)}%`;

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <SourceBadge source={source} size="sm" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{formattedValue}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${iconColor} rounded-lg p-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

interface SourceBadgeProps {
  source: DataSource;
  size?: 'sm' | 'md';
}

function SourceBadge({ source, size = 'md' }: SourceBadgeProps) {
  const config = {
    actual: { label: 'Actual', color: 'bg-secondary text-primary border-primary/30' },
    assumed: { label: 'Assumed', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    allocated: { label: 'Allocated', color: 'bg-gray-100 text-muted-foreground border-gray-200' },
  };

  const { label, color } = config[source];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center rounded border ${color} ${sizeClass} font-medium`}>
      {label}
    </span>
  );
}

// Calculate P&L data based on period
function calculatePLData(period: Period, costItems: CostItem[], trueUps: TrueUpEntry[]): PLData {
  // Mock calculation - in real app, would pull from POS and labor data
  const periodMultiplier = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  
  // Revenue (from POS - actual)
  const netSales = 4850 * periodMultiplier;
  
  // Food Cost (estimated based on recipe costs - assumed)
  const foodCost = netSales * 0.28; // 28% assumed food cost
  
  // Labor Cost (from time punches - actual)
  const laborCost = 1450 * periodMultiplier;
  
  // Prime Cost
  const primeCost = foodCost + laborCost;
  const primeCostPercent = (primeCost / netSales) * 100;
  
  // Operating Expenses (allocated from cost inputs)
  const dailyOperatingExpenses = calculateDailyOperatingExpenses(costItems);
  const operatingExpenses = dailyOperatingExpenses * periodMultiplier;
  
  // Fixed Costs (allocated)
  const dailyFixedCosts = calculateDailyFixedCosts(costItems);
  const fixedCosts = dailyFixedCosts * periodMultiplier;
  
  // Operating Margin
  const operatingMargin = netSales - primeCost - operatingExpenses - fixedCosts;
  const operatingMarginPercent = (operatingMargin / netSales) * 100;
  
  // Coverage (percentage of actual data)
  // Sales + Labor are actual, Food + Operating + Fixed are assumed
  const coverage = ((netSales + laborCost) / (netSales + foodCost + laborCost + operatingExpenses + fixedCosts)) * 100;

  const periodLabel = period === 'today' 
    ? 'Today' 
    : period === 'week' 
    ? 'This Week' 
    : 'This Month';

  const sections = [
    {
      title: 'Revenue',
      items: [
        { label: 'Gross Sales', value: netSales, source: 'actual' as DataSource },
        { label: 'Net Sales', value: netSales, source: 'actual' as DataSource, isSubtotal: true },
      ],
    },
    {
      title: 'Cost of Goods Sold',
      items: [
        { label: 'Food & Beverage', value: foodCost, source: 'assumed' as DataSource },
        { label: 'Total COGS', value: foodCost, source: 'assumed' as DataSource, isSubtotal: true },
      ],
    },
    {
      title: 'Labor',
      items: [
        { label: 'Hourly Wages', value: laborCost * 0.85, source: 'actual' as DataSource },
        { label: 'Payroll Taxes (est)', value: laborCost * 0.15, source: 'assumed' as DataSource },
        { label: 'Total Labor', value: laborCost, source: 'actual' as DataSource, isSubtotal: true },
        { label: 'Prime Cost', value: primeCost, source: 'actual' as DataSource, isSubtotal: true },
      ],
    },
    {
      title: 'Operating Expenses',
      items: [
        { label: 'Utilities', value: operatingExpenses * 0.4, source: 'allocated' as DataSource },
        { label: 'Supplies', value: operatingExpenses * 0.3, source: 'allocated' as DataSource },
        { label: 'Repairs & Maintenance', value: operatingExpenses * 0.2, source: 'allocated' as DataSource },
        { label: 'Other', value: operatingExpenses * 0.1, source: 'allocated' as DataSource },
        { label: 'Total Operating Expenses', value: operatingExpenses, source: 'allocated' as DataSource, isSubtotal: true },
      ],
    },
    {
      title: 'Fixed Costs',
      items: [
        { label: 'Rent', value: fixedCosts * 0.7, source: 'allocated' as DataSource },
        { label: 'Insurance', value: fixedCosts * 0.2, source: 'allocated' as DataSource },
        { label: 'SaaS & Software', value: fixedCosts * 0.1, source: 'allocated' as DataSource },
        { label: 'Total Fixed Costs', value: fixedCosts, source: 'allocated' as DataSource, isSubtotal: true },
      ],
    },
    {
      title: 'Net',
      items: [
        { label: 'Operating Margin', value: operatingMargin, source: 'actual' as DataSource, isTotal: true },
      ],
    },
  ];

  return {
    period,
    periodLabel,
    coverage: Math.round(coverage),
    netSales,
    foodCost,
    laborCost,
    primeCost,
    primeCostPercent,
    operatingExpenses,
    fixedCosts,
    operatingMargin,
    operatingMarginPercent,
    sections,
  };
}

function calculateDailyOperatingExpenses(costItems: CostItem[]): number {
  const operatingCategories = ['utilities', 'supplies', 'repairs'];
  return costItems
    .filter(c => operatingCategories.includes(c.category))
    .reduce((sum, cost) => {
      const dailyAmount = convertToDailyAmount(cost.amount, cost.frequency);
      return sum + dailyAmount;
    }, 0);
}

function calculateDailyFixedCosts(costItems: CostItem[]): number {
  const fixedCategories = ['rent', 'insurance', 'saas'];
  return costItems
    .filter(c => fixedCategories.includes(c.category))
    .reduce((sum, cost) => {
      const dailyAmount = convertToDailyAmount(cost.amount, cost.frequency);
      return sum + dailyAmount;
    }, 0);
}

function convertToDailyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case 'daily':
      return amount;
    case 'weekly':
      return amount / 7;
    case 'monthly':
      return amount / 30;
    default:
      return amount / 30;
  }
}