import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { clsx } from 'clsx';

export interface AreaChartDataPoint {
  [key: string]: string | number;
}

export interface AreaConfig {
  dataKey: string;
  stroke?: string;
  fill?: string;
  name?: string;
  stackId?: string;
}

export interface AreaChartProps {
  data: AreaChartDataPoint[];
  areas: AreaConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  className?: string;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any) => string;
}

const defaultColors = [
  { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)' }, // blue
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.2)' }, // green
  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)' }, // yellow
  { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)' }, // red
  { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.2)' }, // purple
  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.2)' }, // cyan
];

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  areas,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  stacked = false,
  className,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}) => {
  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-neutral-900 mb-2">
            {formatXAxis ? formatXAxis(label) : label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.stroke }}
              />
              <span className="text-neutral-600">{entry.name}:</span>
              <span className="font-medium text-neutral-900">
                {formatTooltip ? formatTooltip(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={clsx('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={formatXAxis}
            stroke="#d1d5db"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={formatYAxis}
            stroke="#d1d5db"
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
              iconType="rect"
            />
          )}
          {areas.map((area, index) => {
            const colors = defaultColors[index % defaultColors.length];
            return (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                stroke={area.stroke || colors.stroke}
                fill={area.fill || colors.fill}
                name={area.name || area.dataKey}
                stackId={stacked ? (area.stackId || 'stack') : undefined}
                strokeWidth={2}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

AreaChart.displayName = 'AreaChart';
