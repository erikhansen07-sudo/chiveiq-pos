import { LucideIcon } from 'lucide-react';

interface StatsCardDarkProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
}

export function StatsCardDark({ title, value, icon: Icon, iconColor }: StatsCardDarkProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-5xl font-bold text-white mt-3">{value}</p>
        </div>
        <div className={`${iconColor} rounded-xl p-4`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
}
