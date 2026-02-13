import { User, Bot, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { PieChart, LineChart } from '@/core/components/composite/charts';
import type { ChatMessage as ChatMessageType, ChartDataItem } from '../ai-assistant.types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (suggestion: string) => void;
  onActionClick?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSuggestionClick,
  onActionClick,
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('mb-4 flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary' : 'bg-purple-600'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-primary-foreground" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex max-w-[80%] flex-1 flex-col',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-card-foreground'
          )}
        >
          {/* Text Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {message.content.split('\n').map((line, index) => {
              // Handle markdown bold
              const parts = line.split(/\*\*(.*?)\*\*/g);
              return (
                <p
                  key={index}
                  className={cn('mb-2 last:mb-0', isUser && 'text-primary-foreground')}
                >
                  {parts.map((part, i) =>
                    i % 2 === 1 ? (
                      <strong
                        key={i}
                        className={isUser ? 'text-primary-foreground' : 'text-foreground'}
                      >
                        {part}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </p>
              );
            })}
          </div>

          {/* Chart Data */}
          {message.type === 'chart' && message.metadata?.chartData && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              {message.metadata.chartData.chartType === 'pie' &&
                message.metadata.chartData.data && (
                  <PieChart
                    data={message.metadata.chartData.data.map((d: ChartDataItem) => ({
                      name: d.category || d.name || '',
                      value: d.amount || d.value || 0,
                    }))}
                    height={250}
                    formatValue={(value) => `€${value.toFixed(2)}`}
                  />
                )}
              {message.metadata.chartData.chartType === 'line' &&
                message.metadata.chartData.data && (
                  <LineChart
                    data={message.metadata.chartData.data}
                    xAxisKey="month"
                    lines={[{ dataKey: 'balance', name: 'Saldo', stroke: 'hsl(var(--primary))' }]}
                    height={250}
                    formatYAxis={(value) => `€${value}`}
                    formatTooltip={(value) => `€${value.toFixed(2)}`}
                  />
                )}
            </div>
          )}

          {/* Table Data */}
          {message.type === 'table' && message.metadata?.tableData && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {Object.keys(message.metadata.tableData[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left font-medium capitalize text-foreground"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {message.metadata.tableData.map(
                    (row: Record<string, string | number>, index: number) => (
                      <tr key={index} className="border-b border-border last:border-0">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-3 py-2">
                            {typeof value === 'number' && value > 100
                              ? `€${value.toFixed(2)}`
                              : value}
                          </td>
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Insight Data */}
          {message.type === 'insight' && message.metadata?.chartData && (
            <Alert className="mt-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription>
                {message.metadata.chartData.prediction && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Previsione
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        €{message.metadata.chartData.prediction.expected.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      Range: €{message.metadata.chartData.prediction.min} - €
                      {message.metadata.chartData.prediction.max}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-700 dark:text-blue-300">
                        Confidenza:
                      </span>
                      <Progress
                        value={message.metadata.chartData.prediction.confidence * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                        {(message.metadata.chartData.prediction.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
                {message.metadata.chartData.factors && (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-medium text-blue-900 dark:text-blue-100">
                      Fattori considerati:
                    </p>
                    <ul className="space-y-1">
                      {message.metadata.chartData.factors.map((factor: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-200"
                        >
                          <span className="text-blue-600 dark:text-blue-400">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          {message.type === 'action' && message.metadata?.actionData && (
            <div className="mt-4">
              <Button className="w-full" onClick={onActionClick}>
                {message.metadata.actionData.title}
              </Button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="mt-1 text-xs text-muted-foreground">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>

        {/* Suggestions */}
        {isAssistant && message.metadata?.chartData?.suggestions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.metadata.chartData.suggestions.map((suggestion: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer transition-colors hover:bg-secondary/80"
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
