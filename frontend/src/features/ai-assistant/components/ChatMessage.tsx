import { User, Bot, Lightbulb } from 'lucide-react';
import { Badge } from '@/core/components/atomic/Badge';
import { Button } from '@/core/components/atomic/Button';
import { PieChart, LineChart } from '@/core/components/composite/charts';
import type { ChatMessage as ChatMessageType } from '../types';
import { format } from 'date-fns';

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
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-purple-600'
        }`}
      >
        {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-neutral-200 text-neutral-900'
          }`}
        >
          {/* Text Content */}
          <div className="prose prose-sm max-w-none">
            {message.content.split('\n').map((line, index) => {
              // Handle markdown bold
              const parts = line.split(/\*\*(.*?)\*\*/g);
              return (
                <p key={index} className={`mb-2 last:mb-0 ${isUser ? 'text-white' : ''}`}>
                  {parts.map((part, i) =>
                    i % 2 === 1 ? (
                      <strong key={i} className={isUser ? 'text-white' : 'text-neutral-900'}>
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
            <div className="mt-4 bg-neutral-50 rounded-lg p-4">
              {message.metadata.chartData.chartType === 'pie' && (
                <PieChart
                  data={message.metadata.chartData.data.map((d: any) => ({
                    name: d.category,
                    value: d.amount,
                  }))}
                  height={250}
                  formatValue={(value) => `€${value.toFixed(2)}`}
                />
              )}
              {message.metadata.chartData.chartType === 'line' && (
                <LineChart
                  data={message.metadata.chartData.data}
                  xAxisKey="month"
                  lines={[{ dataKey: 'balance', name: 'Saldo', stroke: '#3b82f6' }]}
                  height={250}
                  formatYAxis={(value) => `€${value}`}
                  formatTooltip={(value) => `€${value.toFixed(2)}`}
                />
              )}
            </div>
          )}

          {/* Table Data */}
          {message.type === 'table' && message.metadata?.chartData && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-300">
                  <tr>
                    {Object.keys(message.metadata.chartData[0] || {}).map((key) => (
                      <th key={key} className="px-3 py-2 text-left font-medium capitalize">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {message.metadata.chartData.map((row: any, index: number) => (
                    <tr key={index} className="border-b border-neutral-200 last:border-0">
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-3 py-2">
                          {typeof value === 'number' && value > 100
                            ? `€${value.toFixed(2)}`
                            : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Insight Data */}
          {message.type === 'insight' && message.metadata?.chartData && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {message.metadata.chartData.prediction && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Previsione</span>
                        <span className="text-lg font-bold text-blue-600">
                          €{message.metadata.chartData.prediction.expected.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-blue-700">
                        Range: €{message.metadata.chartData.prediction.min} - €
                        {message.metadata.chartData.prediction.max}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-700">Confidenza:</span>
                        <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${message.metadata.chartData.prediction.confidence * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-blue-900">
                          {(message.metadata.chartData.prediction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                  {message.metadata.chartData.factors && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-blue-900 mb-2">Fattori considerati:</p>
                      <ul className="space-y-1">
                        {message.metadata.chartData.factors.map((factor: string, i: number) => (
                          <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {message.type === 'action' && message.metadata?.actionData && (
            <div className="mt-4">
              <Button variant="primary" size="sm" fullWidth onClick={onActionClick}>
                {message.metadata.actionData.title}
              </Button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-neutral-500 mt-1">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>

        {/* Suggestions */}
        {isAssistant && message.metadata?.chartData?.suggestions && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.metadata.chartData.suggestions.map((suggestion: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-neutral-300 transition-colors"
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
