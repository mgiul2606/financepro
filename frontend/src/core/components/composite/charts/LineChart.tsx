import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { clsx } from 'clsx';

export interface LineChartDataPoint {
  [key: string]: string | number;
}

export interface LineConfig {
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  name?: string;
  dot?: boolean;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  lines: LineConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any) => string;
}

const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
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
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
              iconType="line"
            />
          )}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke || defaultColors[index % defaultColors.length]}
              strokeWidth={line.strokeWidth || 2}
              name={line.name || line.dataKey}
              dot={line.dot !== undefined ? line.dot : false}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

LineChart.displayName = 'LineChart';
