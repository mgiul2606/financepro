import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Bot, Sparkles, MessageCircle, FileText } from 'lucide-react';
import {
  useChat,
  useQuickQueries,
  useCapabilities,
  useClassifyTransactions,
  useConfirmClassification,
  useRejectClassification,
} from '../ai-assistant.hooks';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { ExpenseClassifier } from '../components/ExpenseClassifier';
import type { TransactionToClassify, ClassificationBatch } from '../ai-assistant.types';
import { cn } from '@/lib/utils';

type TabType = 'chat' | 'classification';

export const AIAssistantPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  // Chat hooks
  const { messages, isTyping, handleSendMessage, clearMessages } = useChat();
  const { data: quickQueries, isLoading: queriesLoading } = useQuickQueries();
  const { data: capabilities, isLoading: capabilitiesLoading } = useCapabilities();

  // Classification hooks
  const classifyMutation = useClassifyTransactions();
  const confirmMutation = useConfirmClassification();
  const rejectMutation = useRejectClassification();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleQuickQuery = (query: string) => {
    handleSendMessage(query);
  };

  const handleClassify = async (
    transactions: TransactionToClassify[]
  ): Promise<ClassificationBatch> => {
    const result = await classifyMutation.mutateAsync(transactions);
    return result;
  };

  const handleConfirmClassification = (transactionId: string, categoryId: string) => {
    confirmMutation.mutate({ transactionId, categoryId });
  };

  const handleRejectClassification = (transactionId: string) => {
    rejectMutation.mutate(transactionId);
  };

  const showWelcome = messages.length === 0 && !isTyping;

  const tabs = [
    {
      id: 'chat' as const,
      label: t('aiAssistant.chatTab'),
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: 'classification' as const,
      label: t('aiAssistant.classificationTab'),
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-muted/50">
      {/* Header */}
      <PageHeader
        title={t('aiAssistant.title')}
        subtitle={t('aiAssistant.subtitle')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/' }, { label: t('aiAssistant.title') }]}
        actions={
          activeTab === 'chat' && messages.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              {t('aiAssistant.newConversation')}
            </Button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="border-b border-border bg-background">
        <div className="px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <>
            {/* Chat Container */}
            <div className="flex-1 overflow-y-auto p-6">
              {showWelcome ? (
                <div className="mx-auto max-w-3xl space-y-8">
                  {/* Welcome Message */}
                  <div className="py-8 text-center">
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-purple-600 to-blue-600">
                      <Bot className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-foreground">
                      {t('aiAssistant.welcomeTitle')}
                    </h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">
                      {t('aiAssistant.welcomeMessage')}
                    </p>
                  </div>

                  {/* Quick Queries */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      {t('aiAssistant.frequentQuestions')}
                    </h3>
                    {queriesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {quickQueries?.map((query) => (
                          <button
                            key={query.id}
                            onClick={() => handleQuickQuery(query.query)}
                            className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
                          >
                            <span className="text-2xl">{query.icon}</span>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary">
                              {query.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Capabilities */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                      {t('aiAssistant.whatCanIDo')}
                    </h3>
                    {capabilitiesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {capabilities?.map((capability) => (
                          <Card
                            key={capability.id}
                            className="transition-shadow hover:shadow-md"
                          >
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <span className="text-3xl">{capability.icon}</span>
                                <div className="flex-1">
                                  <h4 className="mb-1 font-semibold text-foreground">
                                    {capability.title}
                                  </h4>
                                  <p className="mb-3 text-sm text-muted-foreground">
                                    {capability.description}
                                  </p>
                                  <div className="space-y-1">
                                    {capability.examples.slice(0, 2).map((example, index) => (
                                      <p
                                        key={index}
                                        className="text-xs italic text-muted-foreground"
                                      >
                                        "{example}"
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                    <h4 className="mb-2 flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-100">
                      <Sparkles className="h-4 w-4" />
                      {t('aiAssistant.tipsTitle')}
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{t('aiAssistant.tip1')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{t('aiAssistant.tip2')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{t('aiAssistant.tip3')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{t('aiAssistant.tip4')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-4xl">
                  {/* Messages */}
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        onSuggestionClick={handleQuickQuery}
                      />
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="rounded-lg border border-border bg-card px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                            <div
                              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                              style={{ animationDelay: '0.2s' }}
                            />
                            <div
                              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                              style={{ animationDelay: '0.4s' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-border bg-background">
              <div className="mx-auto max-w-4xl">
                <ChatInput onSend={handleSendMessage} disabled={isTyping} />
              </div>
            </div>

            {/* Quick Queries Bar (when chatting) */}
            {messages.length > 0 && quickQueries && (
              <div className="border-t border-border bg-muted/50 p-3">
                <div className="mx-auto max-w-4xl">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                      {t('aiAssistant.suggestions')}
                    </span>
                    {quickQueries.slice(0, 4).map((query) => (
                      <Badge
                        key={query.id}
                        variant="secondary"
                        className="cursor-pointer whitespace-nowrap transition-colors hover:bg-secondary/80"
                        onClick={() => handleQuickQuery(query.query)}
                      >
                        {query.icon} {query.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'classification' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-6xl">
              <ExpenseClassifier
                onClassify={handleClassify}
                onConfirmClassification={handleConfirmClassification}
                onRejectClassification={handleRejectClassification}
                isLoading={classifyMutation.isPending}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
