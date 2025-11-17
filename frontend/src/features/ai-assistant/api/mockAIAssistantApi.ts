// Mock AI Assistant API Service

import {
  ChatMessage,
  Conversation,
  QuickQuery,
  AssistantCapability,
  AssistantResponse,
  ExplanationRequest,
  ClassificationRequest,
  ClassificationBatch,
  ClassificationResult,
  ExpenseClassification,
  TransactionToClassify,
} from '../types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to generate message IDs
let messageIdCounter = 1;
const generateMessageId = () => `msg_${messageIdCounter++}`;

// Mock quick queries
const mockQuickQueries: QuickQuery[] = [
  {
    id: '1',
    label: 'Quanto ho speso questo mese?',
    query: 'Quanto ho speso questo mese?',
    icon: '💰',
    category: 'spending',
  },
  {
    id: '2',
    label: 'Mostra spese anomale',
    query: 'Mostrami le spese anomale di questa settimana',
    icon: '🔍',
    category: 'insights',
  },
  {
    id: '3',
    label: 'Analisi categorie',
    query: 'Analizza le mie spese per categoria',
    icon: '📊',
    category: 'spending',
  },
  {
    id: '4',
    label: 'Previsione spese',
    query: 'Qual è la previsione di spesa per il prossimo mese?',
    icon: '🔮',
    category: 'predictions',
  },
  {
    id: '5',
    label: 'Suggerimenti risparmio',
    query: 'Come posso risparmiare questo mese?',
    icon: '💡',
    category: 'insights',
  },
  {
    id: '6',
    label: 'Saldo medio',
    query: 'Qual è il mio saldo medio negli ultimi 6 mesi?',
    icon: '📈',
    category: 'income',
  },
];

// Mock capabilities
const mockCapabilities: AssistantCapability[] = [
  {
    id: '1',
    title: 'Analisi Finanziaria',
    description: 'Rispondi a domande sulle tue finanze in linguaggio naturale',
    examples: [
      'Quanto ho speso in ristoranti questo mese?',
      'Qual è il mio trend di spesa negli ultimi 3 mesi?',
      'Mostrami le transazioni superiori a 100€',
    ],
    icon: '📊',
  },
  {
    id: '2',
    title: 'Rilevamento Anomalie',
    description: 'Identifica spese insolite e spiega le anomalie rilevate',
    examples: [
      'Ci sono spese anomale questa settimana?',
      'Perché questa transazione è stata segnalata?',
      'Mostrami tutte le anomalie del mese',
    ],
    icon: '🔍',
  },
  {
    id: '3',
    title: 'Previsioni e Insights',
    description: 'Ottieni previsioni e insights basati sui tuoi pattern di spesa',
    examples: [
      'Quanto spenderò il prossimo mese?',
      'Quali sono i miei pattern di spesa ricorrenti?',
      'Rischio di sforare il budget?',
    ],
    icon: '🔮',
  },
  {
    id: '4',
    title: 'Azioni Guidate',
    description: 'Assistenza nella creazione di budget, obiettivi e gestione categorie',
    examples: [
      'Aiutami a creare un budget per le vacanze',
      'Imposta un obiettivo di risparmio',
      'Correggi la categoria di questa transazione',
    ],
    icon: '🎯',
  },
  {
    id: '5',
    title: 'Generazione Report',
    description: 'Crea report personalizzati e visualizzazioni',
    examples: [
      'Genera un report mensile',
      'Crea un grafico delle spese per categoria',
      'Esporta l\'analisi delle spese in PDF',
    ],
    icon: '📄',
  },
];

// Simulate AI responses based on user query
const generateAssistantResponse = (query: string): AssistantResponse => {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('quanto') && lowerQuery.includes('speso')) {
    return {
      message: 'Questo mese hai speso un totale di **€2,345.67**. Ecco la distribuzione per categoria:',
      type: 'chart',
      data: {
        chartType: 'pie',
        data: [
          { category: 'Alimentari', amount: 567.89, percentage: 24 },
          { category: 'Trasporti', amount: 456.78, percentage: 19 },
          { category: 'Ristoranti', amount: 345.67, percentage: 15 },
          { category: 'Shopping', amount: 234.56, percentage: 10 },
          { category: 'Altro', amount: 740.77, percentage: 32 },
        ],
      },
      suggestions: [
        'Mostrami il dettaglio degli alimentari',
        'Confronta con il mese scorso',
        'Analizza i ristoranti',
      ],
    };
  }

  if (lowerQuery.includes('anomal')) {
    return {
      message: 'Ho rilevato **3 anomalie** questa settimana:',
      type: 'table',
      data: [
        {
          date: '2024-11-10',
          merchant: 'Electronics Store',
          amount: 450.0,
          reason: 'Importo 3.5x superiore alla media',
        },
        {
          date: '2024-11-12',
          merchant: 'Cinema',
          amount: 85.0,
          reason: 'Orario insolito (martedì mattina)',
        },
        {
          date: '2024-11-14',
          merchant: 'Supermercato Premium',
          amount: 120.0,
          reason: 'Merchant nuovo',
        },
      ],
      suggestions: ['Mostra dettagli prima anomalia', 'Segna come normale', 'Analizza pattern'],
    };
  }

  if (lowerQuery.includes('previsione') || lowerQuery.includes('prossimo mese')) {
    return {
      message:
        'Basandomi sui tuoi pattern di spesa, prevedo che il prossimo mese spenderai circa **€2,450-2,680**.',
      type: 'insight',
      data: {
        prediction: {
          min: 2450,
          expected: 2565,
          max: 2680,
          confidence: 0.87,
        },
        factors: [
          'Pattern stagionale (incremento del 5%)',
          'Spesa ricorrente Netflix (€15.99)',
          'Probabile spesa extra per le festività',
        ],
      },
      suggestions: [
        'Mostra il grafico della previsione',
        'Crea un budget per il prossimo mese',
        'Imposta un alert',
      ],
    };
  }

  if (lowerQuery.includes('risparmia') || lowerQuery.includes('suggerimenti')) {
    return {
      message:
        'Ho identificato **4 opportunità di risparmio** per te:\n\n' +
        '1. 💰 Cancella Spotify Premium (€9.99/mese) - Non lo usi da 3 mesi\n' +
        '2. 🔄 Cambia fornitore energia (Risparmio: €15/mese)\n' +
        '3. 🍔 Riduci spese ristoranti del 30% (Risparmio: €120/mese)\n' +
        '4. 🚗 Usa mezzi pubblici 2 giorni a settimana (Risparmio: €60/mese)',
      type: 'action',
      actions: [
        {
          type: 'optimize_spending',
          title: 'Applica suggerimenti',
          description: 'Implementa tutti i suggerimenti di risparmio',
        },
        {
          type: 'create_goal',
          title: 'Crea obiettivo risparmio',
          description: 'Imposta un obiettivo basato su questi risparmi',
        },
      ],
      suggestions: ['Dettagli primo suggerimento', 'Mostra impatto totale', 'Crea piano risparmio'],
    };
  }

  if (lowerQuery.includes('saldo') && lowerQuery.includes('medio')) {
    return {
      message:
        'Il tuo saldo medio negli ultimi 6 mesi è stato di **€1,234.56**.\n\n' +
        'Il saldo minimo è stato di **€456.78** (Marzo) e il massimo di **€2,345.67** (Giugno).',
      type: 'chart',
      data: {
        chartType: 'line',
        data: [
          { month: 'Maggio', balance: 987.65 },
          { month: 'Giugno', balance: 2345.67 },
          { month: 'Luglio', balance: 1543.21 },
          { month: 'Agosto', balance: 876.54 },
          { month: 'Settembre', balance: 1234.56 },
          { month: 'Ottobre', balance: 1456.78 },
        ],
      },
      suggestions: ['Analizza variazioni', 'Confronta con entrate', 'Crea previsione'],
    };
  }

  if (lowerQuery.includes('budget')) {
    return {
      message:
        'Ti aiuto a creare un budget! Per iniziare, ho bisogno di alcune informazioni:\n\n' +
        '1. Per quale categoria vuoi creare il budget?\n' +
        '2. Qual è l\'importo massimo mensile?\n' +
        '3. Vuoi impostare degli alert?',
      type: 'action',
      actions: [
        {
          type: 'create_budget',
          title: 'Crea Budget Guidato',
          description: 'Ti guiderò passo passo nella creazione',
          suggestedValues: {
            category: 'Alimentari',
            amount: 600,
            period: 'monthly',
          },
        },
      ],
      suggestions: ['Suggerisci budget basato sulla media', 'Mostra budget esistenti'],
    };
  }

  // Default response
  return {
    message:
      'Ciao! Sono il tuo assistente finanziario AI. Posso aiutarti con:\n\n' +
      '• 📊 Analisi delle tue spese e entrate\n' +
      '• 🔍 Rilevamento anomalie e spese insolite\n' +
      '• 🔮 Previsioni di spesa\n' +
      '• 💡 Suggerimenti per risparmiare\n' +
      '• 🎯 Creazione di budget e obiettivi\n\n' +
      'Cosa vorresti sapere?',
    type: 'text',
    suggestions: mockQuickQueries.slice(0, 3).map((q) => q.query),
  };
};

export const mockAIAssistantApi = {
  getQuickQueries: async (): Promise<QuickQuery[]> => {
    await delay(300);
    return mockQuickQueries;
  },

  getCapabilities: async (): Promise<AssistantCapability[]> => {
    await delay(300);
    return mockCapabilities;
  },

  sendMessage: async (message: string, conversationId?: string): Promise<ChatMessage[]> => {
    await delay(800); // Simulate AI thinking time

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      type: 'text',
      content: message,
      timestamp: new Date().toISOString(),
    };

    const response = generateAssistantResponse(message);

    const assistantMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      type: response.type,
      content: response.message,
      timestamp: new Date().toISOString(),
      metadata: {
        chartData: response.data,
        actionData: response.actions?.[0],
      },
    };

    return [userMessage, assistantMessage];
  },

  getExplanation: async (request: ExplanationRequest): Promise<ChatMessage> => {
    await delay(600);

    let explanation = '';

    if (request.type === 'classification') {
      explanation =
        'Ho classificato questa transazione come "Alimentari" perché:\n\n' +
        '1. Il merchant "Esselunga" è riconosciuto come supermercato\n' +
        '2. L\'importo (€45.67) è coerente con una spesa alimentare\n' +
        '3. Il giorno (Sabato) corrisponde al pattern tipico di spesa settimanale\n' +
        '4. Hai effettuato transazioni simili in passato presso lo stesso merchant';
    } else if (request.type === 'anomaly') {
      explanation =
        'Questa transazione è stata segnalata come anomala perché:\n\n' +
        '1. L\'importo (€450) è 3.5x superiore alla tua spesa media in questa categoria\n' +
        '2. Non hai mai effettuato acquisti presso questo merchant\n' +
        '3. L\'orario della transazione è insolito rispetto ai tuoi pattern abituali';
    } else if (request.type === 'prediction') {
      explanation =
        'La previsione si basa su:\n\n' +
        '1. Analisi dei tuoi pattern di spesa degli ultimi 12 mesi\n' +
        '2. Stagionalità rilevata (incremento del 5% in questo periodo)\n' +
        '3. Transazioni ricorrenti confermate\n' +
        '4. Eventi imminenti nel calendario (festività)';
    }

    return {
      id: generateMessageId(),
      role: 'assistant',
      type: 'text',
      content: explanation,
      timestamp: new Date().toISOString(),
    };
  },

  getConversations: async (): Promise<Conversation[]> => {
    await delay(400);
    return [
      {
        id: 'conv_1',
        title: 'Analisi spese Novembre',
        messages: [],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        archived: false,
      },
      {
        id: 'conv_2',
        title: 'Suggerimenti risparmio',
        messages: [],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        archived: false,
      },
    ];
  },

  // ========== Expense Classification API ==========

  classifyTransactions: async (
    request: ClassificationRequest
  ): Promise<ClassificationBatch> => {
    await delay(2000); // Simulate AI processing time

    const results: ClassificationResult[] = request.transactions.map((transaction) => {
      // Mock classification logic based on merchant/description
      let category = 'Altro';
      let subcategory: string | undefined;
      let confidence = 0.75;
      let explanation = '';
      let tags: string[] = [];

      const desc = transaction.description.toLowerCase();
      const merchant = transaction.merchant?.toLowerCase() || '';

      // Grocery stores
      if (
        desc.includes('esselunga') ||
        desc.includes('coop') ||
        desc.includes('conad') ||
        merchant.includes('esselunga')
      ) {
        category = 'Alimentari';
        subcategory = 'Supermercato';
        confidence = 0.95;
        tags = ['spesa', 'alimentari', 'essenziale'];
        explanation = `Classificato come "${category}" perché il merchant "${
          transaction.merchant || transaction.description
        }" è riconosciuto come supermercato. L'importo è coerente con una spesa alimentare tipica.`;
      }
      // Restaurants
      else if (
        desc.includes('ristorante') ||
        desc.includes('pizza') ||
        desc.includes('bar') ||
        desc.includes('trattoria')
      ) {
        category = 'Ristoranti';
        subcategory = 'Pranzo/Cena';
        confidence = 0.88;
        tags = ['ristorante', 'cibo', 'svago'];
        explanation = `Classificato come "${category}" in base al nome del merchant che indica un locale di ristorazione. L'importo è nella media per questo tipo di spesa.`;
      }
      // Entertainment subscriptions
      else if (
        desc.includes('netflix') ||
        desc.includes('spotify') ||
        desc.includes('prime')
      ) {
        category = 'Intrattenimento';
        subcategory = 'Abbonamenti';
        confidence = 0.98;
        tags = ['streaming', 'abbonamento', 'ricorrente'];
        explanation = `Classificato come "${category} - ${subcategory}" perché si tratta di un servizio di streaming riconosciuto. È una transazione ricorrente mensile.`;
      }
      // Online shopping
      else if (
        desc.includes('amazon') ||
        desc.includes('ebay') ||
        merchant.includes('amazon')
      ) {
        category = 'Shopping';
        subcategory = 'Online';
        confidence = 0.82;
        tags = ['shopping', 'online', 'e-commerce'];
        explanation = `Classificato come "${category}" perché la transazione è stata effettuata su una piattaforma di e-commerce. La categoria specifica potrebbe variare in base ai dettagli dell'acquisto.`;
      }
      // Utilities
      else if (
        desc.includes('enel') ||
        desc.includes('eni') ||
        desc.includes('tim') ||
        desc.includes('vodafone')
      ) {
        category = 'Utenze';
        subcategory = desc.includes('enel') || desc.includes('eni') ? 'Energia' : 'Telefonia';
        confidence = 0.92;
        tags = ['bolletta', 'utenze', 'ricorrente', 'essenziale'];
        explanation = `Classificato come "${category} - ${subcategory}" perché il merchant è un fornitore di servizi noto. Si tratta di una spesa ricorrente essenziale.`;
      }
      // Transport
      else if (
        desc.includes('eni') ||
        desc.includes('carburante') ||
        desc.includes('atm') ||
        desc.includes('trenitalia')
      ) {
        category = 'Trasporti';
        subcategory = desc.includes('carburante') || desc.includes('eni') ? 'Carburante' : 'Mezzi pubblici';
        confidence = 0.85;
        tags = ['trasporto', 'mobilità'];
        explanation = `Classificato come "${category}" in base al merchant e al tipo di servizio. Spesa tipica per questa categoria.`;
      }

      const classification: ExpenseClassification = {
        id: `class_${transaction.id}`,
        transactionId: transaction.id,
        category,
        subcategory,
        tags,
        confidence,
        explanation,
        suggestedBy: 'ai',
        confirmedByUser: false,
        createdAt: new Date().toISOString(),
      };

      // Generate alternative categories
      const alternativeCategories =
        confidence < 0.9
          ? [
              {
                category: 'Altro',
                subcategory: 'Non categorizzato',
                confidence: Math.max(0, 1 - confidence - 0.1),
              },
              {
                category: category === 'Shopping' ? 'Intrattenimento' : 'Shopping',
                confidence: Math.max(0, 1 - confidence - 0.2),
              },
            ]
          : [];

      return {
        transactionId: transaction.id,
        originalDescription: transaction.description,
        classification,
        alternativeCategories,
      };
    });

    const totalProcessed = results.length;
    const averageConfidence =
      results.reduce((sum, r) => sum + r.classification.confidence, 0) / totalProcessed;

    return {
      id: `batch_${Date.now()}`,
      results,
      totalProcessed,
      averageConfidence,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };
  },

  confirmClassification: async (
    transactionId: string,
    categoryId: string
  ): Promise<ExpenseClassification> => {
    await delay(300);

    return {
      id: `class_${transactionId}`,
      transactionId,
      category: categoryId,
      subcategory: undefined,
      tags: [],
      confidence: 1.0,
      explanation: 'Confermato manualmente dall\'utente',
      suggestedBy: 'manual',
      confirmedByUser: true,
      createdAt: new Date().toISOString(),
    };
  },

  rejectClassification: async (transactionId: string): Promise<void> => {
    await delay(300);
    console.log(`Classification rejected for transaction ${transactionId}`);
  },
};
