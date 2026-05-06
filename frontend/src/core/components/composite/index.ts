// Composite Components
// Complex, reusable components built from primitive UI elements

export { DataTable } from './DataTable';
export type { DataTableProps, Column } from './DataTable';

export { PageHeader } from './PageHeader';
export type { PageHeaderProps, BreadcrumbItem } from './PageHeader';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { IconCircle } from './IconCircle';
export type { IconCircleProps } from './IconCircle';

export { StatCard } from './StatCard';
export type { ColorScheme } from './StatCard';

export { ProgressBar } from './ProgressBar';
export type { ProgressVariant } from './ProgressBar';

export { StatusBadge } from './StatusBadge';
export type { BadgeStatus } from './StatusBadge';

export { PageStateWrapper } from './PageStateWrapper';
export type { PageStateWrapperProps } from './PageStateWrapper';

// Charts
export { LineChart, BarChart, PieChart, AreaChart } from './charts';
export type {
  LineChartProps,
  LineChartDataPoint,
  LineConfig,
  BarChartProps,
  BarChartDataPoint,
  BarConfig,
  PieChartProps,
  PieChartDataPoint,
  AreaChartProps,
  AreaChartDataPoint,
  AreaConfig,
} from './charts';
