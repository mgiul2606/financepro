import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardBody } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import { Button } from '@/core/components/atomic/Button';
import { Spinner } from '@/core/components/atomic/Spinner';
import {
  useChat,
  useQuickQueries,
  useCapabilities,
  useClassifyTransactions,
  useConfirmClassification,
  useRejectClassification,
} from '../hooks/useAIAssistant';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { ExpenseClassifier } from '../components/ExpenseClassifier';
import { Bot, Sparkles, MessageCircle, FileText } from 'lucide-react';
import type { TransactionToClassify, ClassificationBatch } from '../types';

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
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader
        title={t('aiAssistant.title')}
        subtitle={t('aiAssistant.subtitle')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/' }, { label: t('aiAssistant.title') }]}
        actions={
          activeTab === 'chat' && messages.length > 0 ? (
            <button
              onClick={clearMessages}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {t('aiAssistant.newConversation')}
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' && (
          <>
            {/* Chat Container */}
            <div className="flex-1 overflow-y-auto p-6">
              {showWelcome ? (
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Welcome Message */}
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4">
                      <Bot className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                      {t('aiAssistant.welcomeTitle')}
                    </h2>
                    <p className="text-neutral-600 max-w-xl mx-auto">
                      {t('aiAssistant.welcomeMessage')}
                    </p>
                  </div>

                  {/* Quick Queries */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {t('aiAssistant.frequentQuestions')}
                    </h3>
                    {queriesLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {quickQueries?.map((query) => (
                          <button
                            key={query.id}
                            onClick={() => handleQuickQuery(query.query)}
                            className="flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all text-left group"
                          >
                            <span className="text-2xl">{query.icon}</span>
                            <span className="text-sm font-medium text-neutral-900 group-hover:text-blue-600">
                              {query.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Capabilities */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                      {t('aiAssistant.whatCanIDo')}
                    </h3>
                    {capabilitiesLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {capabilities?.map((capability) => (
                          <Card key={capability.id} variant="bordered" hoverable>
                            <CardBody>
                              <div className="flex items-start gap-3">
                                <span className="text-3xl">{capability.icon}</span>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-neutral-900 mb-1">
                                    {capability.title}
                                  </h4>
                                  <p className="text-sm text-neutral-600 mb-3">
                                    {capability.description}
                                  </p>
                                  <div className="space-y-1">
                                    {capability.examples.slice(0, 2).map((example, index) => (
                                      <p key={index} className="text-xs text-neutral-500 italic">
                                        "{example}"
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {t('aiAssistant.tipsTitle')}
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
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
                <div className="max-w-4xl mx-auto">
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
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            />
                            <div
                              className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
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
            <div className="border-t border-neutral-200 bg-white">
              <div className="max-w-4xl mx-auto">
                <ChatInput onSend={handleSendMessage} disabled={isTyping} />
              </div>
            </div>

            {/* Quick Queries Bar (when chatting) */}
            {messages.length > 0 && quickQueries && (
              <div className="border-t border-neutral-200 bg-neutral-50 p-3">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-medium text-neutral-600 whitespace-nowrap">
                      {t('aiAssistant.suggestions')}
                    </span>
                    {quickQueries.slice(0, 4).map((query) => (
                      <Badge
                        key={query.id}
                        variant="secondary"
                        size="sm"
                        className="cursor-pointer hover:bg-neutral-300 transition-colors whitespace-nowrap"
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
            <div className="max-w-6xl mx-auto">
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
