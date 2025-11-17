import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { clsx } from 'clsx';

export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  formatValue?: (value: number) => string;
  formatPercentage?: (value: number) => string;
}

const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
];

const renderLabel = (entry: any, formatPercentage?: (value: number) => string) => {
  const percentage = entry.percent * 100;
  if (formatPercentage) {
    return formatPercentage(percentage);
  }
  return `${percentage.toFixed(0)}%`;
};

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  showTooltip = true,
  showLabels = true,
  innerRadius = 0,
  outerRadius = 80,
  className,
  formatValue,
  formatPercentage,
}) => {
  const CustomTooltip = ({ active, payload }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.payload.fill }}
            />
            <span className="text-sm font-medium text-neutral-900">
              {data.name}
            </span>
          </div>
          <p className="text-sm text-neutral-600">
            {formatValue ? formatValue(data.value) : data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={clsx('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            label={showLabels ? (entry) => renderLabel(entry, formatPercentage) : false}
            labelLine={showLabels}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || defaultColors[index % defaultColors.length]}
              />
            ))}
          </Pie>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: '14px' }}
              iconType="circle"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

PieChart.displayName = 'PieChart';
