import { useState } from 'react';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Tabs } from '@/core/components/atomic/Tabs';
import { Spinner } from '@/core/components/atomic/Spinner';
import { Button } from '@/core/components/atomic/Button';
import {
  useOptimizationOverview,
  useOptimizationSuggestions,
  useWasteDetections,
  useDuplicateServices,
  useSavingsStrategies,
  useAlternatives,
  useImplementSuggestion,
  useDismissSuggestion,
} from '../hooks/useOptimization';
import { SuggestionCard } from '../components/SuggestionCard';
import { WasteCard } from '../components/WasteCard';
import { SavingsStrategyCard } from '../components/SavingsStrategyCard';
import { Sparkles, TrendingDown, Target, Repeat, AlertTriangle } from 'lucide-react';

export const OptimizationPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data
  const { data: overview, isLoading: overviewLoading } = useOptimizationOverview();
  const { data: suggestions, isLoading: suggestionsLoading } = useOptimizationSuggestions();
  const { data: wasteDetections, isLoading: wasteLoading } = useWasteDetections();
  const { data: duplicates, isLoading: duplicatesLoading } = useDuplicateServices();
  const { data: strategies, isLoading: strategiesLoading } = useSavingsStrategies();
  const { data: alternatives, isLoading: alternativesLoading } = useAlternatives();

  const implementSuggestion = useImplementSuggestion();
  const dismissSuggestion = useDismissSuggestion();

  const tabs = [
    { id: 'overview', label: 'Panoramica' },
    { id: 'suggestions', label: 'Suggerimenti' },
    { id: 'waste', label: 'Sprechi' },
    { id: 'strategies', label: 'Strategie' },
    { id: 'alternatives', label: 'Alternative' },
  ];

  const handleImplementSuggestion = (id: string) => {
    implementSuggestion.mutate(id);
  };

  const handleDismissSuggestion = (id: string) => {
    dismissSuggestion.mutate(id);
  };

  const activeSuggestions = suggestions?.filter((s) => s.status === 'active') || [];
  const implementedSuggestions = suggestions?.filter((s) => s.status === 'implemented') || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="Ottimizzazione"
        subtitle="Suggerimenti AI per ottimizzare le tue finanze"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Ottimizzazione' },
        ]}
        actions={
          <Button variant="primary" leftIcon={<Sparkles className="h-4 w-4" />}>
            Genera Nuovi Suggerimenti
          </Button>
        }
        tabs={
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        }
      />

      <div className="p-6 space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {overviewLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" label="Caricamento panoramica..." />
              </div>
            ) : overview ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card variant="elevated">
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-neutral-600 mb-2">Risparmio Potenziale</p>
                          <p className="text-2xl font-bold text-green-600">
                            €{overview.totalPotentialSavings.toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            €{overview.monthlySavingsOpportunity.toFixed(2)}/mese
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <TrendingDown className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card variant="elevated">
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-neutral-600 mb-2">Suggerimenti Attivi</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {overview.activeSuggestions}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {overview.implementedSuggestions} implementati
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Target className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card variant="elevated">
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-neutral-600 mb-2">Sprechi Rilevati</p>
                          <p className="text-2xl font-bold text-orange-600">
                            €{overview.wasteDetected.totalWastedAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {overview.wasteDetected.unusedSubscriptions} abbonamenti
                          </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card variant="elevated">
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-neutral-600 mb-2">Totale Risparmiato</p>
                          <p className="text-2xl font-bold text-purple-600">
                            €{overview.totalSavedToDate.toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Precisione: {overview.averageAccuracy}%
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Sparkles className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="bordered" className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardBody>
                      <div className="text-center py-4">
                        <div className="inline-flex p-3 bg-green-100 rounded-full mb-3">
                          <TrendingDown className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-neutral-900 mb-1">Riduci Sprechi</h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          {overview.wasteDetected.unusedSubscriptions} abbonamenti inutilizzati rilevati
                        </p>
                        <Button variant="primary" size="sm" onClick={() => setActiveTab('waste')}>
                          Visualizza
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  <Card variant="bordered" className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardBody>
                      <div className="text-center py-4">
                        <div className="inline-flex p-3 bg-blue-100 rounded-full mb-3">
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-neutral-900 mb-1">Strategie di Risparmio</h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          {strategies?.filter((s) => s.status === 'active').length || 0} strategie attive
                        </p>
                        <Button variant="primary" size="sm" onClick={() => setActiveTab('strategies')}>
                          Inizia
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  <Card variant="bordered" className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardBody>
                      <div className="text-center py-4">
                        <div className="inline-flex p-3 bg-purple-100 rounded-full mb-3">
                          <Repeat className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-neutral-900 mb-1">Alternative Migliori</h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          {alternatives?.length || 0} alternative più convenienti trovate
                        </p>
                        <Button variant="primary" size="sm" onClick={() => setActiveTab('alternatives')}>
                          Esplora
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Top Suggestions Preview */}
                <Card variant="elevated">
                  <CardHeader
                    title="Suggerimenti Prioritari"
                    action={
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('suggestions')}>
                        Vedi Tutti
                      </Button>
                    }
                  />
                  <CardBody>
                    {suggestionsLoading ? (
                      <Spinner />
                    ) : activeSuggestions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeSuggestions.slice(0, 2).map((suggestion) => (
                          <SuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            onImplement={() => handleImplementSuggestion(suggestion.id)}
                            onDismiss={() => handleDismissSuggestion(suggestion.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-neutral-600">Nessun suggerimento al momento</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </>
            ) : null}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <Card variant="bordered" className="bg-blue-50 border-blue-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      Suggerimenti Personalizzati AI
                    </h3>
                    <p className="text-sm text-neutral-700">
                      I nostri algoritmi AI analizzano continuamente le tue finanze per identificare
                      opportunità di ottimizzazione e risparmio.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {suggestionsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : activeSuggestions.length > 0 || implementedSuggestions.length > 0 ? (
              <>
                {activeSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Suggerimenti Attivi ({activeSuggestions.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {activeSuggestions.map((suggestion) => (
                        <SuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          onImplement={() => handleImplementSuggestion(suggestion.id)}
                          onDismiss={() => handleDismissSuggestion(suggestion.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {implementedSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Suggerimenti Implementati ({implementedSuggestions.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {implementedSuggestions.map((suggestion) => (
                        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Waste Tab */}
        {activeTab === 'waste' && (
          <div className="space-y-6">
            <Card variant="bordered" className="bg-orange-50 border-orange-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      Rilevamento Sprechi Automatico
                    </h3>
                    <p className="text-sm text-neutral-700">
                      Identifichiamo abbonamenti inutilizzati, servizi duplicati e spese ad alto costo
                      ma basso utilizzo.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {wasteLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : wasteDetections && wasteDetections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wasteDetections.map((waste) => (
                  <WasteCard key={waste.id} waste={waste} />
                ))}
              </div>
            ) : (
              <Card variant="elevated">
                <CardBody>
                  <div className="text-center py-12">
                    <span className="text-5xl mb-4 block">✅</span>
                    <p className="text-lg font-medium text-neutral-900">Nessuno spreco rilevato</p>
                    <p className="text-sm text-neutral-600 mt-2">
                      Stai gestendo le tue finanze in modo efficiente!
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Duplicate Services */}
            {duplicates && duplicates.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Servizi Duplicati
                </h3>
                <div className="space-y-3">
                  {duplicates.map((duplicate) => (
                    <Card key={duplicate.id} variant="bordered" className="border-orange-200">
                      <CardBody>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-neutral-900">
                                {duplicate.category}
                              </h4>
                              <p className="text-sm text-neutral-600 mt-1">
                                {duplicate.recommendation}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-neutral-600">Risparmio</p>
                              <p className="text-lg font-bold text-green-600">
                                €{duplicate.potentialSaving.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {duplicate.services.map((service, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-neutral-50 rounded-lg p-2"
                              >
                                <span className="text-sm font-medium">{service.merchantName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-neutral-600">{service.frequency}</span>
                                  <span className="text-sm font-semibold">
                                    €{service.amount.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strategies Tab */}
        {activeTab === 'strategies' && (
          <div className="space-y-6">
            <Card variant="bordered" className="bg-green-50 border-green-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <Target className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      Strategie di Risparmio Personalizzate
                    </h3>
                    <p className="text-sm text-neutral-700">
                      Piani strutturati per raggiungere i tuoi obiettivi di risparmio con passaggi
                      chiari e tracciamento dei progressi.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {strategiesLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : strategies && strategies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategies.map((strategy) => (
                  <SavingsStrategyCard key={strategy.id} strategy={strategy} />
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Alternatives Tab */}
        {activeTab === 'alternatives' && (
          <div className="space-y-6">
            <Card variant="bordered" className="bg-purple-50 border-purple-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <Repeat className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      Alternative Più Convenienti
                    </h3>
                    <p className="text-sm text-neutral-700">
                      Confrontiamo i tuoi fornitori attuali con alternative più economiche mantenendo
                      la stessa qualità di servizio.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {alternativesLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : alternatives && alternatives.length > 0 ? (
              <div className="space-y-4">
                {alternatives.map((alternative) => (
                  <Card key={alternative.id} variant="elevated">
                    <CardBody>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900 mb-1">
                              {alternative.category}
                            </h4>
                            <p className="text-sm text-neutral-600">{alternative.reason}</p>
                          </div>
                          <div className="bg-green-100 rounded-lg p-3 text-center ml-4">
                            <p className="text-xs text-green-700">Risparmio Annuale</p>
                            <p className="text-2xl font-bold text-green-600">
                              €{alternative.yearlyProjection.toFixed(0)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-4">
                          <div>
                            <p className="text-xs text-neutral-600 mb-2">Attuale</p>
                            <p className="font-semibold text-neutral-900">
                              {alternative.currentMerchant}
                            </p>
                            <p className="text-lg font-bold text-neutral-700 mt-1">
                              €{alternative.currentAmount.toFixed(2)}/mese
                            </p>
                          </div>
                          <div className="border-l border-neutral-200 pl-4">
                            <p className="text-xs text-green-700 mb-2">Suggerito</p>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-neutral-900">
                                {alternative.suggestedMerchant}
                              </p>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {alternative.qualityScore}/100
                              </span>
                            </div>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              €{alternative.suggestedAmount.toFixed(2)}/mese
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-green-700 mb-2">Pro:</p>
                            <ul className="space-y-1">
                              {alternative.pros.map((pro, index) => (
                                <li key={index} className="text-sm text-neutral-700 flex items-start gap-2">
                                  <span className="text-green-600">✓</span>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-red-700 mb-2">Contro:</p>
                            <ul className="space-y-1">
                              {alternative.cons.map((con, index) => (
                                <li key={index} className="text-sm text-neutral-700 flex items-start gap-2">
                                  <span className="text-red-600">✗</span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-neutral-200">
                          <Button variant="primary" size="sm">
                            Richiedi Preventivo
                          </Button>
                          <Button variant="ghost" size="sm">
                            Maggiori Info
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
