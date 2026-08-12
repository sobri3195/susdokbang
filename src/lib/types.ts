export type KelaikanStatus = "Laik" | "Observasi" | "Terbatas" | "Tidak Laik";

export type Penerbang = {
  id: string;
  nrp: string;
  nama: string;
  pangkat: string;
  skadron: string;
  usia: number;
  kategoriPesawat: "Tempur" | "Angkut" | "Helikopter" | "Latih";
  status: KelaikanStatus;
  totalJam: number;
  tanggalMasuk: string;
  eventDate?: string;
  riskScore: number;
};

export type McuRecord = {
  id: string;
  penerbangId: string;
  tanggal: string;
  bmi: number;
  tekananDarah: string;
  kolesterol: number;
  gulaDarah: number;
  vo2max: number;
  catatan: string;
  status: KelaikanStatus;
};

export type PsikotesRecord = {
  id: string;
  penerbangId: string;
  tanggal: string;
  stabilitasEmosi: number;
  atensi: number;
  stressIndex: number;
  cognitiveLoad: number;
  rekomendasi: string;
};

export type JamTerbangRecord = {
  id: string;
  penerbangId: string;
  tanggal: string;
  jenisPesawat: string;
  misi: string;
  durasiJam: number;
  malam: boolean;
  instruktur: boolean;
};

export type CoxResult = {
  faktor: string;
  hazardRatio: number;
  ciLow: number;
  ciHigh: number;
  pValue: number;
  arah: "Protektif" | "Risiko";
};

export type SurvivalPoint = {
  bulan: number;
  survival: number;
  riskSet: number;
  group: string;
};

export type ImportEntity = "penerbang" | "mcu" | "psikotes" | "jam_terbang";

export type ImportFileKind = "xls" | "xlsx" | "docx";

export type ImportUploadedFile = {
  id: string;
  name: string;
  size: number;
  type: ImportFileKind;
  status: "queued" | "parsing" | "parsed" | "error";
  progress: number;
};

export type ImportDetectedTable = {
  id: string;
  sourceName: string;
  sheetName?: string;
  entity: ImportEntity;
  confidence: number;
  headerRow: number;
  rowsDetected: number;
  rawPreview: string[][];
};

export type ImportMapping = {
  id: string;
  tableId: string;
  sourceColumn: string;
  targetField: string;
  confidence: number;
  required?: boolean;
};

export type ImportCleanRow = {
  id: string;
  entity: ImportEntity;
  status: "valid" | "warning" | "error";
  values: Record<string, string | number>;
  issues: Array<{ field: string; rawValue: string; reason: string }>;
};

export type ImportJobHistory = {
  id: string;
  filename: string;
  filetype: ImportFileKind;
  status: "parsed" | "validated" | "committed" | "failed";
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  createdAt: string;
  user: string;
};

export type ValidationLevel = "pass" | "warning" | "fail";

export type CoxValidationCovariate = {
  covariate: string;
  chiSquare: number;
  pValue: number;
  timeInteractionP: number;
  status: ValidationLevel;
  recommendation: string;
};

export type ResidualPoint = {
  time: number;
  value: number;
  trend: number;
  covariate: string;
};

export type LmlPoint = {
  time: number;
  lowRisk: number;
  highRisk: number;
};

export type MissingVariable = {
  variable: string;
  missingPercent: number;
  mechanism: "MCAR" | "MAR" | "MNAR indikatif";
  action: string;
};

export type MissingHeatmapCell = {
  row: string;
  variable: string;
  missing: boolean;
};

export type ImputationComparison = {
  covariate: string;
  completeCaseHr: number;
  miceHr: number;
  deltaPercent: number;
  conclusion: string;
};

export type VifResult = {
  variable: string;
  vif: number;
  status: ValidationLevel;
};

export type AucPoint = {
  year: number;
  auc: number;
  ciLow: number;
  ciHigh: number;
};

export type CalibrationPoint = {
  predicted: number;
  observed: number;
  group: string;
};

export type BootstrapMetric = {
  metric: string;
  apparent: number;
  optimism: number;
  corrected: number;
  interpretation: string;
};

export type ResidualDiagnosticPoint = {
  pilotId: string;
  time: number;
  martingale: number;
  deviance: number;
  dfbeta: number;
  covariate: string;
};

export type InfluentialObservation = {
  pilotId: string;
  name: string;
  dfbetaMax: number;
  driver: string;
  action: string;
};

export type CoxValidationResult = {
  jobId: string;
  modelName: string;
  generatedAt: string;
  overallStatus: ValidationLevel;
  summary: {
    phStatus: ValidationLevel;
    globalSchoenfeldP: number;
    epv: number;
    epvStatus: ValidationLevel;
    events: number;
    parameters: number;
    cIndex: number;
    cIndexCiLow: number;
    cIndexCiHigh: number;
    missingPercent: number;
    brierScore: number;
    calibrationSlope: number;
  };
  interpretations: Record<string, string>;
  ph: {
    covariates: CoxValidationCovariate[];
    residuals: ResidualPoint[];
    lml: LmlPoint[];
  };
  missing: {
    variables: MissingVariable[];
    heatmap: MissingHeatmapCell[];
    littlePValue: number;
    comparison: ImputationComparison[];
  };
  epv: {
    vif: VifResult[];
    recommendation: string;
  };
  discrimination: {
    auc: AucPoint[];
    calibration: CalibrationPoint[];
  };
  bootstrap: {
    metrics: BootstrapMetric[];
  };
  residuals: {
    points: ResidualDiagnosticPoint[];
    influential: InfluentialObservation[];
  };
};

export type ValidationJobHistory = {
  id: string;
  modelName: string;
  status: "queued" | "running" | "completed" | "failed";
  phStatus: ValidationLevel;
  epvValue: number;
  cIndex: number;
  createdAt: string;
  user: string;
};

export type ClusterNodeStatus = "online" | "busy" | "degraded" | "offline";

export type DistributedWorker = {
  id: string;
  hostname: string;
  role: "gateway" | "broker" | "coordinator" | "worker" | "database" | "monitor";
  status: ClusterNodeStatus;
  currentTask: string;
  queue: string;
  heartbeat: string;
  cpuLoad: number;
  memoryMb: number;
};

export type DistributedJobStatus = "queued" | "running" | "completed" | "failed" | "retrying";

export type DistributedSubtask = {
  id: string;
  jobId: string;
  workerId: string;
  status: DistributedJobStatus;
  taskType: string;
  startedAt: string;
  finishedAt?: string;
  durationMs: number;
  attempt: number;
};

export type DistributedJob = {
  id: string;
  type: "bootstrap_validation" | "federated_aggregation" | "ph_test";
  status: DistributedJobStatus;
  totalSubtasks: number;
  completedSubtasks: number;
  failedSubtasks: number;
  progress: number;
  startedAt: string;
  finishedAt?: string;
  speedup: number;
  singleNodeSeconds: number;
  distributedSeconds: number;
  resultSummary: string;
  subtasks: DistributedSubtask[];
};

export type ClusterMetricPoint = {
  time: string;
  queueLength: number;
  jobsPerSecond: number;
  latencyMs: number;
};

export type SpeedupBenchmark = {
  workers: number;
  seconds: number;
  speedup: number;
  efficiency: number;
};

export type DistributionLog = {
  timestamp: string;
  workerId: string;
  event: string;
  detail: string;
};

export type FederatedNodeStat = {
  node: string;
  skadron: string;
  localRows: number;
  events: number;
  sufficientStats: string;
  sharedRawData: boolean;
};

export type DistributedClusterSnapshot = {
  generatedAt: string;
  queueLength: number;
  deadLetterCount: number;
  activeWorkers: number;
  throughput: number;
  p95LatencyMs: number;
  workers: DistributedWorker[];
  jobs: DistributedJob[];
  metrics: ClusterMetricPoint[];
  benchmark: SpeedupBenchmark[];
  logs: DistributionLog[];
  federated: FederatedNodeStat[];
  narrative: string;
};
