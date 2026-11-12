/**
 * Phase 6 — AI Assistant, Jarvis, forecasting and predictive inventory.
 *
 * Demo mode: a rule-based assistant and browser statistical models run entirely in this browser on
 * permission-filtered prototype data. Nothing is sent anywhere. Results are labelled as demo /
 * statistical — never as trained model predictions.
 *
 * Real mode: chat goes to OpenJarvis, Ollama or a cloud provider. Local providers without an API
 * key (OpenJarvis / Ollama on this machine) may be called directly; anything needing a key or any
 * cloud provider goes through the integration gateway (docs/INTEGRATION_GATEWAY.md) so no secret
 * ever reaches the browser. Backend ML forecasting also goes through the gateway.
 */

export const AI_PROVIDERS = Object.freeze({
  DEMO: 'DEMO',
  OPENJARVIS: 'OPENJARVIS',
  OLLAMA: 'OLLAMA',
  GEMINI: 'GEMINI',
  OPENAI_COMPATIBLE: 'OPENAI_COMPATIBLE',
  CUSTOM: 'CUSTOM',
})

/**
 * connection: 'none' (demo) | 'direct' (browser → local server, keyless only) | 'gateway' (backend proxy).
 * OpenJarvis endpoints verified against the OpenJarvis source (server/routes.py, api_routes.py):
 * GET /health, GET /v1/info, GET /v1/models, POST /v1/chat/completions (OpenAI-compatible),
 * POST /v1/speech/transcribe (multipart file), POST /v1/speech/synthesize ({text, voice_id?}) → WAV,
 * auth "Authorization: Bearer <OPENJARVIS_API_KEY>" when the server has a key (then use the gateway).
 */
export const PROVIDER_META = {
  DEMO: {
    label: 'Demo AI (rule-based)', short: 'Demo AI', local: true, cloud: false, connections: ['none'],
    defaultEndpoint: '', defaultModel: 'bellomassi-demo-intents-v1',
    capabilities: ['Business Q&A on prototype data', 'Commands & navigation', 'Charts & tables'],
    description: 'Deterministic intent matching over your permitted data. No language model, nothing leaves the browser.',
  },
  OPENJARVIS: {
    label: 'OpenJarvis (local-first)', short: 'OpenJarvis', local: true, cloud: false, connections: ['direct', 'gateway'],
    defaultEndpoint: 'http://localhost:8000', defaultModel: '',
    capabilities: ['Chat completions (OpenAI-compatible)', 'Speech-to-text (if configured)', 'Text-to-speech (if configured)', 'Model info'],
    description: 'Apache-2.0 local AI framework. Run `jarvis serve`; set OPENJARVIS_CORS_ORIGINS to this app’s origin for direct mode.',
  },
  OLLAMA: {
    label: 'Ollama (local)', short: 'Ollama', local: true, cloud: false, connections: ['direct', 'gateway'],
    defaultEndpoint: 'http://localhost:11434', defaultModel: 'llama3.2',
    capabilities: ['Chat (/api/chat)', 'Model list (/api/tags)'],
    description: 'Local models via Ollama. Set OLLAMA_ORIGINS to this app’s origin for direct mode.',
  },
  GEMINI: {
    label: 'Google Gemini (cloud)', short: 'Gemini', local: false, cloud: true, connections: ['gateway'],
    defaultEndpoint: '', defaultModel: 'gemini-2.0-flash',
    capabilities: ['Chat'], description: 'Cloud provider — gateway only, API key held by the gateway.',
  },
  OPENAI_COMPATIBLE: {
    label: 'OpenAI-compatible (cloud or self-hosted)', short: 'OpenAI-compatible', local: false, cloud: true, connections: ['gateway'],
    defaultEndpoint: '', defaultModel: '',
    capabilities: ['Chat completions'], description: 'Any /v1/chat/completions server — gateway only, key held by the gateway.',
  },
  CUSTOM: {
    label: 'Custom provider (future)', short: 'Custom', local: false, cloud: true, connections: ['gateway'],
    defaultEndpoint: '', defaultModel: '',
    capabilities: ['Defined by the gateway adapter'], description: 'Placeholder for a provider adapter added to the gateway later.',
  },
}

export const AI_STATUS = Object.freeze({
  DEMO: 'DEMO',
  PENDING: 'INTEGRATION_PENDING',
  CONNECTED: 'CONNECTED',
  UNAVAILABLE: 'UNAVAILABLE',
  DISABLED: 'DISABLED',
})

export const AI_STATUS_META = {
  DEMO: { label: 'Demo mode', tone: 'warning', description: 'Rule-based answers from prototype data. No AI model is called.' },
  INTEGRATION_PENDING: { label: 'Integration pending', tone: 'info', description: 'Configured, but no successful response has been received yet.' },
  CONNECTED: { label: 'Connected', tone: 'success', description: 'Verified by a successful health check and model response.' },
  UNAVAILABLE: { label: 'Unavailable', tone: 'danger', description: 'The last connection attempt failed. Demo mode answers meanwhile.' },
  DISABLED: { label: 'Disabled by policy', tone: 'neutral', description: 'Cloud providers are switched off in AI settings.' },
}

export const DATA_SHARING = Object.freeze({
  NONE: 'NONE', // only the question is sent
  SUMMARIES: 'SUMMARIES', // question + permission-filtered tool result summary
})

export const DEFAULT_AI_SETTINGS = {
  provider: AI_PROVIDERS.DEMO,
  connection: 'none',
  endpoint: '',
  model: '',
  temperature: 0.2,
  maxTokens: 700,
  timeoutMs: 20000,
  retries: 1,
  allowCloudProviders: false,
  preferLocal: true,
  dataSharing: DATA_SHARING.SUMMARIES,
  maxContextRows: 15,
  status: AI_STATUS.DEMO,
  lastCheckedAt: null,
  lastError: '',
  modelInfo: null,
  showConfidence: true,
}

export const DEFAULT_JARVIS_SETTINGS = {
  floatingButton: true,
  floatingPosition: 'bottom-right', // bottom-right | bottom-left
  wakeWord: 'jarvis',
  speakResponses: true,
  autoNavigate: true,
  sttEngine: 'browser', // browser | openjarvis
  ttsEngine: 'browser', // browser | openjarvis
  language: 'en-IN',
  voiceURI: '',
  rate: 1,
  volume: 1,
  pitch: 1,
  continuous: false,
}

export const SPEECH_LANGUAGES = [
  { value: 'en-IN', label: 'English (India)' }, { value: 'en-US', label: 'English (US)' }, { value: 'en-GB', label: 'English (UK)' },
  { value: 'hi-IN', label: 'Hindi' }, { value: 'ta-IN', label: 'Tamil' }, { value: 'te-IN', label: 'Telugu' }, { value: 'kn-IN', label: 'Kannada' }, { value: 'ml-IN', label: 'Malayalam' },
]

/* ---------------- Forecasting ---------------- */

export const FORECAST_MODELS = Object.freeze({
  AUTO: 'AUTO',
  MA: 'MA',
  WMA: 'WMA',
  SES: 'SES',
  HOLT: 'HOLT',
  SEASONAL: 'SEASONAL',
})

export const FORECAST_MODEL_META = {
  AUTO: { label: 'Auto (best backtest)', short: 'Auto', description: 'Runs every prototype model on a holdout window and keeps the lowest RMSE.' },
  MA: { label: 'Moving average', short: 'MA', description: 'Mean of the last N periods, projected flat.' },
  WMA: { label: 'Weighted moving average', short: 'WMA', description: 'Recent periods weigh more (weights 1…N), projected flat.' },
  SES: { label: 'Exponential smoothing', short: 'SES', description: 'Simple exponential smoothing (level only).' },
  HOLT: { label: 'Trend projection (Holt)', short: 'Holt', description: 'Double exponential smoothing — level plus linear trend.' },
  SEASONAL: { label: 'Seasonal baseline', short: 'Seasonal', description: 'Average of the same season slot (weekday for daily data) scaled to the recent level.' },
}

export const PROTOTYPE_MODEL_VERSION = '1.0.0'

export const FORECAST_TARGETS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'orders', label: 'Order count' },
  { value: 'quantity', label: 'Product demand (units)' },
]

export const FORECAST_GRANULARITY = [
  { value: 'day', label: 'Daily' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }, { value: 'quarter', label: 'Quarterly' },
]

export const FORECAST_HORIZONS = [7, 14, 30, 60, 90]

export const FORECAST_LEVELS = [
  { value: 'total', label: 'Total business' },
  { value: 'product', label: 'Product' },
  { value: 'hub', label: 'Hub' },
  { value: 'customer', label: 'Customer' },
  { value: 'category', label: 'Category' },
]

/** Minimum history per granularity before a forecast is produced. */
export const MIN_HISTORY = { day: { points: 28, nonZero: 10 }, week: { points: 8, nonZero: 4 }, month: { points: 6, nonZero: 3 }, quarter: { points: 4, nonZero: 2 } }

export const INSUFFICIENT_DATA_MESSAGE = 'Insufficient historical data to generate a reliable forecast.'

export const FORECAST_STATUS = Object.freeze({ COMPLETED: 'COMPLETED', INSUFFICIENT_DATA: 'INSUFFICIENT_DATA', FAILED: 'FAILED' })

export const DEFAULT_FORECAST_SETTINGS = {
  defaultModel: FORECAST_MODELS.AUTO,
  engine: 'PROTOTYPE', // PROTOTYPE (browser) | BACKEND (gateway /ml/forecast)
  includeDemoBaseline: true,
  maWindow: 7,
  sesAlpha: 0.3,
  holtAlpha: 0.3,
  holtBeta: 0.1,
  confidenceLevel: 95,
  historyDays: 180,
  // Predictive inventory
  demandBasis: 'dispatched', // ordered | dispatched | delivered
  lookbackDays: 56,
  forecastHorizonDays: 14,
  defaultLeadTimeDays: 7,
  safetyDays: 3,
  serviceLevel: 95,
  reviewPeriodDays: 14,
  excessCoverageDays: 60,
  slowMovingCoverageDays: 120,
  spikeFactor: 1.6,
  suppliers: [
    { id: 'sup-01', name: 'Coastal Frozen Foods Pvt Ltd', leadTimeDays: 6, minOrderValue: 25000, categories: ['Frozen Food'] },
    { id: 'sup-02', name: 'Southern Dairy Cooperative', leadTimeDays: 4, minOrderValue: 15000, categories: ['Chilled Food'] },
    { id: 'sup-03', name: 'Agro Fresh Processors', leadTimeDays: 8, minOrderValue: 20000, categories: [] },
  ],
  productParams: {}, // { [productId]: { leadTimeDays, moq, packMultiple, supplierId } }
}

export const SERVICE_LEVEL_Z = { 90: 1.2816, 95: 1.6449, 97.5: 1.96, 99: 2.3263 }

export const RISK = Object.freeze({ CRITICAL: 'CRITICAL', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' })
export const RISK_META = {
  CRITICAL: { label: 'Critical', tone: 'danger', score: 100, rank: 0 },
  HIGH: { label: 'High', tone: 'warning', score: 70, rank: 1 },
  MEDIUM: { label: 'Medium', tone: 'info', score: 40, rank: 2 },
  LOW: { label: 'Low', tone: 'success', score: 10, rank: 3 },
}

export const RISK_FLAGS = {
  STOCKOUT: 'Stock-out risk', LOW_STOCK: 'Low stock', EXCESS: 'Excess stock', SLOW: 'Slow-moving', NON_MOVING: 'Non-moving',
  HIGH_DEMAND: 'High demand', SPIKE: 'Demand spike', IMBALANCE: 'Hub imbalance',
}

export const REPLENISHMENT_STATUS = Object.freeze({
  DRAFT: 'DRAFT', SUBMITTED: 'SUBMITTED', APPROVED: 'APPROVED', REJECTED: 'REJECTED', CONVERTED: 'CONVERTED', RECEIVED: 'RECEIVED', CANCELLED: 'CANCELLED',
})
export const REPLENISHMENT_META = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted for approval', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'info' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  CONVERTED: { label: 'Sent to procurement', tone: 'brand' },
  RECEIVED: { label: 'Received', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
}

export const RECOMMENDATION_STATUS = Object.freeze({ OPEN: 'OPEN', IN_DRAFT: 'IN_DRAFT', DISMISSED: 'DISMISSED' })

/* ---------------- Insights ---------------- */

export const INSIGHT_STATUS = Object.freeze({ NEW: 'NEW', REVIEWED: 'REVIEWED', RESOLVED: 'RESOLVED' })
export const INSIGHT_STATUS_META = { NEW: { label: 'New', tone: 'brand' }, REVIEWED: { label: 'Reviewed', tone: 'info' }, RESOLVED: { label: 'Resolved', tone: 'success' } }
export const SEVERITY_META = {
  critical: { label: 'Critical', tone: 'danger', rank: 0 },
  high: { label: 'High', tone: 'warning', rank: 1 },
  medium: { label: 'Medium', tone: 'info', rank: 2 },
  low: { label: 'Low', tone: 'neutral', rank: 3 },
  positive: { label: 'Positive', tone: 'success', rank: 4 },
}

export const INSIGHT_TYPES = {
  SALES_TREND: 'Sales trend',
  INVENTORY_SHORTAGE: 'Inventory shortage',
  UNUSUAL_ORDERS: 'Unusual order activity',
  DELAYED_DELIVERIES: 'Delayed deliveries',
  HIGH_DEMAND: 'High-demand products',
  LOW_PERFORMING: 'Low-performing products',
  CUSTOMER_TREND: 'Customer order trend',
  STOCKOUT_RISK: 'Stock-out risk',
  EXCESS_INVENTORY: 'Excess inventory',
  VEHICLE_DOCS: 'Vehicle document expiry',
  ORDER_BACKLOG: 'Order backlog',
}

/** Activity log cap per collection. */
export const AI_LOG_LIMIT = 500
export const AI_MESSAGE_LIMIT = 2000
export const FORECAST_LIMIT = 60
