// Mock Optimization API Service

import type {
  OptimizationOverview,
  OptimizationSuggestion,
  WasteDetection,
  DuplicateService,
  SavingsStrategy,
  AlternativeRecommendation,
  CashFlowOptimization,
} from '../optimization.types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockOverview: OptimizationOverview = {
  totalPotentialSavings: 2845.50,
  monthlySavingsOpportunity: 237.12,
  activeSuggestions: 12,
  implementedSuggestions: 8,
  totalSavedToDate: 1543.80,
  topCategory: 'Abbonamenti',
  averageAccuracy: 87.5,
  wasteDetected: {
    unusedSubscriptions: 4,
    duplicateServices: 2,
    totalWastedAmount: 89.97,
  },
};

const mockSuggestions: OptimizationSuggestion[] = [
  {
    id: '1',
    title: 'Cancella abbonamento Spotify Premium inutilizzato',
    description: 'Non hai utilizzato Spotify negli ultimi 3 mesi, ma continui a pagare l\'abbonamento.',
    category: 'subscriptions',
    priority: 'high',
    potentialSavings: 119.88,
    monthlySavings: 9.99,
    confidence: 0.95,
    aiExplanation: 'Analizzando i tuoi pattern di utilizzo, ho notato che non hai aperto l\'app negli ultimi 90 giorni.',
    actionSteps: [
      'Vai alle impostazioni del tuo account Spotify',
      'Seleziona "Gestisci abbonamento"',
      'Clicca su "Cancella abbonamento"',
      'Considera di passare al piano gratuito se vuoi mantenere le tue playlist',
    ],
    relatedTransactions: ['txn_spotify_001', 'txn_spotify_002'],
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Cambia fornitore energia elettrica',
    description: 'Puoi risparmiare €15/mese cambiando al fornitore XYZ con le stesse condizioni.',
    category: 'alternatives',
    priority: 'medium',
    potentialSavings: 180.00,
    monthlySavings: 15.00,
    confidence: 0.82,
    aiExplanation: 'Ho confrontato le tariffe di 15 fornitori e trovato un\'opzione più conveniente con rating simile.',
    actionSteps: [
      'Visita il sito del fornitore XYZ',
      'Richiedi un preventivo personalizzato',
      'Confronta i termini del contratto',
      'Procedi con il cambio (gestito dal nuovo fornitore)',
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Consolida i tuoi servizi di streaming',
    description: 'Hai 3 servizi di streaming attivi. Potresti ridurli a 2 e risparmiare.',
    category: 'savings',
    priority: 'low',
    potentialSavings: 143.88,
    monthlySavings: 11.99,
    confidence: 0.68,
    aiExplanation: 'Utilizzi Netflix e Disney+ regolarmente, ma Amazon Prime Video solo occasionalmente.',
    actionSteps: [
      'Valuta quali servizi usi maggiormente',
      'Considera di condividere un abbonamento famiglia',
      'Cancella i servizi meno utilizzati',
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Ottimizza il timing dei pagamenti ricorrenti',
    description: 'Alcuni pagamenti avvengono nello stesso periodo causando picchi di spesa.',
    category: 'timing',
    priority: 'medium',
    potentialSavings: 0,
    monthlySavings: 0,
    confidence: 0.90,
    aiExplanation: 'Distribuendo i pagamenti, eviterai periodi di basso saldo e possibili scoperti.',
    actionSteps: [
      'Contatta i fornitori per modificare le date di addebito',
      'Distribuisci i pagamenti nell\'arco del mese',
      'Mantieni un saldo minimo costante',
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockWasteDetections: WasteDetection[] = [
  {
    id: '1',
    type: 'unused_subscription',
    merchantName: 'Spotify Premium',
    category: 'Intrattenimento',
    subscriptionAmount: 9.99,
    frequency: 'monthly',
    lastUsage: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    usageCount: 0,
    usageFrequency: 'never',
    costPerUse: 0,
    monthlyCost: 9.99,
    detectedAt: new Date().toISOString(),
    recommendation: 'Cancella questo abbonamento o passa al piano gratuito.',
    potentialSaving: 119.88,
  },
  {
    id: '2',
    type: 'high_cost_low_usage',
    merchantName: 'Palestra Premium Gym',
    category: 'Salute',
    subscriptionAmount: 59.99,
    frequency: 'monthly',
    lastUsage: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    usageCount: 2,
    usageFrequency: 'rarely',
    costPerUse: 29.99,
    monthlyCost: 59.99,
    detectedAt: new Date().toISOString(),
    recommendation: 'Considera un abbonamento pay-per-use o trova una palestra più economica.',
    potentialSaving: 360.00,
  },
  {
    id: '3',
    type: 'duplicate_service',
    merchantName: 'Adobe Creative Cloud',
    category: 'Software',
    subscriptionAmount: 60.49,
    frequency: 'monthly',
    usageCount: 8,
    usageFrequency: 'occasionally',
    costPerUse: 7.56,
    monthlyCost: 60.49,
    detectedAt: new Date().toISOString(),
    recommendation: 'Hai anche Canva Pro che offre funzionalità simili. Valuta se ti serve entrambi.',
    potentialSaving: 725.88,
  },
];

const mockDuplicates: DuplicateService[] = [
  {
    id: '1',
    services: [
      { merchantName: 'Adobe Creative Cloud', amount: 60.49, frequency: 'monthly' },
      { merchantName: 'Canva Pro', amount: 12.99, frequency: 'monthly' },
    ],
    category: 'Software Design',
    totalMonthlyCost: 73.48,
    recommendation: 'Questi servizi hanno funzionalità sovrapposte. Potresti mantenerne solo uno.',
    potentialSaving: 155.88,
  },
  {
    id: '2',
    services: [
      { merchantName: 'Netflix Premium', amount: 17.99, frequency: 'monthly' },
      { merchantName: 'Amazon Prime Video', amount: 4.99, frequency: 'monthly' },
      { merchantName: 'Disney+', amount: 8.99, frequency: 'monthly' },
    ],
    category: 'Streaming Video',
    totalMonthlyCost: 31.97,
    recommendation: 'Considera di mantenere solo 1-2 servizi e alternare gli altri.',
    potentialSaving: 143.88,
  },
];

const mockStrategies: SavingsStrategy[] = [
  {
    id: '1',
    title: 'Sfida "No Spesa Fuori" per 30 giorni',
    description: 'Prepara tutti i pasti a casa per un mese intero e risparmia su ristoranti e takeaway.',
    targetCategory: 'Ristoranti',
    targetAmount: 300.00,
    timeframe: 'monthly',
    difficulty: 'medium',
    impact: 'high',
    steps: [
      { order: 1, description: 'Pianifica i menu settimanali', completed: false },
      { order: 2, description: 'Fai la spesa una volta a settimana', completed: false },
      { order: 3, description: 'Prepara i pasti in batch nel weekend', completed: false },
      { order: 4, description: 'Porta il pranzo al lavoro', completed: false },
    ],
    projectedSavings: {
      monthly: 300.00,
      yearly: 3600.00,
    },
    status: 'suggested',
  },
  {
    id: '2',
    title: 'Ottimizza i trasporti',
    description: 'Utilizza i mezzi pubblici invece dell\'auto per gli spostamenti urbani.',
    targetCategory: 'Trasporti',
    targetAmount: 150.00,
    timeframe: 'monthly',
    difficulty: 'easy',
    impact: 'medium',
    steps: [
      { order: 1, description: 'Acquista abbonamento mezzi pubblici mensile', completed: true },
      { order: 2, description: 'Pianifica i percorsi ottimali', completed: true },
      { order: 3, description: 'Usa l\'auto solo per necessità', completed: false },
    ],
    projectedSavings: {
      monthly: 150.00,
      yearly: 1800.00,
    },
    actualSavings: 127.50,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    id: '3',
    title: 'Elimina gli sprechi energetici',
    description: 'Riduci il consumo di energia con piccoli accorgimenti quotidiani.',
    targetAmount: 50.00,
    timeframe: 'monthly',
    difficulty: 'easy',
    impact: 'low',
    steps: [
      { order: 1, description: 'Sostituisci le lampadine con LED', completed: true },
      { order: 2, description: 'Spegni i dispositivi in standby', completed: true },
      { order: 3, description: 'Imposta il termostato a 19°C', completed: true },
      { order: 4, description: 'Usa elettrodomestici nelle fasce orarie economiche', completed: false },
    ],
    projectedSavings: {
      monthly: 50.00,
      yearly: 600.00,
    },
    actualSavings: 48.20,
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
];

const mockAlternatives: AlternativeRecommendation[] = [
  {
    id: '1',
    currentMerchant: 'Fornitore Energia A',
    currentAmount: 95.00,
    suggestedMerchant: 'Fornitore Energia B',
    suggestedAmount: 78.50,
    category: 'Bollette',
    monthlySavings: 16.50,
    yearlyProjection: 198.00,
    qualityScore: 92,
    reason: 'Stesso servizio, tariffa migliore e recensioni positive.',
    pros: [
      'Risparmio del 17% sul costo mensile',
      'Energia 100% rinnovabile',
      'Assistenza clienti 24/7',
      'Nessun costo di attivazione',
    ],
    cons: [
      'Richiede contratto di 12 mesi',
      'Penale di €25 per recesso anticipato',
    ],
  },
  {
    id: '2',
    currentMerchant: 'Supermercato Premium',
    currentAmount: 450.00,
    suggestedMerchant: 'Supermercato Discount',
    suggestedAmount: 340.00,
    category: 'Alimentari',
    monthlySavings: 110.00,
    yearlyProjection: 1320.00,
    qualityScore: 78,
    reason: 'Prodotti simili a prezzi più bassi, con qualche compromesso sulla varietà.',
    pros: [
      'Risparmio del 24% sulla spesa mensile',
      'Marchi propri di buona qualità',
      'Offerte settimanali vantaggiose',
    ],
    cons: [
      'Meno varietà di prodotti',
      'Alcune marche premium non disponibili',
      'Negozi più affollati',
    ],
  },
];

const mockCashFlowOptimizations: CashFlowOptimization[] = [
  {
    id: '1',
    title: 'Distribuisci i pagamenti nell\'arco del mese',
    description: 'I tuoi pagamenti ricorrenti si concentrano tra il 1° e il 5° del mese, causando un calo significativo del saldo.',
    currentPattern: {
      problematicPeriod: '1-5 del mese',
      avgBalance: 450.00,
      minBalance: 120.00,
    },
    suggestedPattern: {
      recommendations: [
        'Sposta l\'abbonamento palestra al 15 del mese',
        'Richiedi cambio data di addebito bolletta luce al 20 del mese',
        'Modifica data pagamento Netflix al 10 del mese',
      ],
      expectedMinBalance: 680.00,
      improvement: 82,
    },
    implementation: {
      steps: [
        'Contatta i fornitori via email o telefono',
        'Richiedi la modifica della data di addebito',
        'Conferma le nuove date nel tuo calendario',
      ],
      difficulty: 'easy',
    },
  },
];

export const mockOptimizationApi = {
  getOverview: async (): Promise<OptimizationOverview> => {
    await delay(500);
    return mockOverview;
  },

  getSuggestions: async (): Promise<OptimizationSuggestion[]> => {
    await delay(600);
    return mockSuggestions;
  },

  getSuggestionById: async (id: string): Promise<OptimizationSuggestion> => {
    await delay(400);
    const suggestion = mockSuggestions.find((s) => s.id === id);
    if (!suggestion) throw new Error('Suggestion not found');
    return suggestion;
  },

  getWasteDetections: async (): Promise<WasteDetection[]> => {
    await delay(550);
    return mockWasteDetections;
  },

  getDuplicateServices: async (): Promise<DuplicateService[]> => {
    await delay(500);
    return mockDuplicates;
  },

  getSavingsStrategies: async (): Promise<SavingsStrategy[]> => {
    await delay(600);
    return mockStrategies;
  },

  getAlternatives: async (): Promise<AlternativeRecommendation[]> => {
    await delay(550);
    return mockAlternatives;
  },

  getCashFlowOptimizations: async (): Promise<CashFlowOptimization[]> => {
    await delay(500);
    return mockCashFlowOptimizations;
  },

  implementSuggestion: async (id: string): Promise<OptimizationSuggestion> => {
    await delay(800);
    const suggestion = mockSuggestions.find((s) => s.id === id);
    if (!suggestion) throw new Error('Suggestion not found');
    return {
      ...suggestion,
      status: 'implemented',
      implementedAt: new Date().toISOString(),
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dismissSuggestion: async (_id: string): Promise<void> => {
    await delay(400);
  },
};
