import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from 'recharts';
import { clsx } from 'clsx';

export interface BarChartDataPoint {
  [key: string]: string | number;
}

export interface BarConfig {
  dataKey: string;
  fill?: string;
  name?: string;
  stackId?: string;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  layout?: 'horizontal' | 'vertical';
  stacked?: boolean;
  className?: string;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any) => string;
  barSize?: number;
  customColors?: string[];
}

const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

export const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  layout = 'horizontal',
  stacked = false,
  className,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  barSize,
  customColors,
}) => {
  const colors = customColors || defaultColors;

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
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
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
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          barSize={barSize}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          {layout === 'horizontal' ? (
            <>
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
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={formatYAxis}
                stroke="#d1d5db"
              />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={formatXAxis}
                stroke="#d1d5db"
              />
            </>
          )}
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
              iconType="rect"
            />
          )}
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.fill || colors[index % colors.length]}
              name={bar.name || bar.dataKey}
              stackId={stacked ? (bar.stackId || 'stack') : undefined}
              radius={[4, 4, 0, 0]}
            >
              {!stacked &&
                data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={bar.fill || colors[index % colors.length]} />
                ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

BarChart.displayName = 'BarChart';
