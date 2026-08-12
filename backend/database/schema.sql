CREATE DATABASE IF NOT EXISTS csakt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE csakt;

CREATE TABLE IF NOT EXISTS penerbang (
  id VARCHAR(24) PRIMARY KEY,
  nrp VARCHAR(32) NOT NULL UNIQUE,
  nama VARCHAR(160) NOT NULL,
  pangkat VARCHAR(64) NOT NULL,
  skadron VARCHAR(120) NOT NULL,
  usia INT NOT NULL,
  kategori_pesawat ENUM('Tempur','Angkut','Helikopter','Latih') NOT NULL,
  status ENUM('Laik','Observasi','Terbatas','Tidak Laik') NOT NULL DEFAULT 'Laik',
  total_jam DECIMAL(10,2) NOT NULL DEFAULT 0,
  tanggal_masuk DATE NOT NULL,
  event_date DATE NULL,
  risk_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mcu_records (
  id VARCHAR(32) PRIMARY KEY,
  penerbang_id VARCHAR(24) NOT NULL,
  tanggal DATE NOT NULL,
  bmi DECIMAL(5,2) NOT NULL,
  tekanan_darah VARCHAR(16) NOT NULL,
  kolesterol INT NOT NULL,
  gula_darah INT NOT NULL,
  vo2max INT NOT NULL,
  catatan TEXT NULL,
  status ENUM('Laik','Observasi','Terbatas','Tidak Laik') NOT NULL,
  FOREIGN KEY (penerbang_id) REFERENCES penerbang(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS psikotes_records (
  id VARCHAR(32) PRIMARY KEY,
  penerbang_id VARCHAR(24) NOT NULL,
  tanggal DATE NOT NULL,
  stabilitas_emosi INT NOT NULL,
  atensi INT NOT NULL,
  stress_index INT NOT NULL,
  cognitive_load INT NOT NULL,
  rekomendasi TEXT NULL,
  FOREIGN KEY (penerbang_id) REFERENCES penerbang(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jam_terbang_records (
  id VARCHAR(32) PRIMARY KEY,
  penerbang_id VARCHAR(24) NOT NULL,
  tanggal DATE NOT NULL,
  jenis_pesawat VARCHAR(64) NOT NULL,
  misi VARCHAR(160) NOT NULL,
  durasi_jam DECIMAL(6,2) NOT NULL,
  malam BOOLEAN NOT NULL DEFAULT FALSE,
  instruktur BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (penerbang_id) REFERENCES penerbang(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS examination_episodes (
  id VARCHAR(64) PRIMARY KEY,
  penerbang_id VARCHAR(24) NOT NULL,
  examination_type ENUM('Berkala','Pasca-sakit','Kembali bertugas','Keluhan khusus') NOT NULL,
  planned_date DATE NOT NULL,
  status ENUM('draft','submitted','needs_revision','verified','reviewed') NOT NULL DEFAULT 'draft',
  priority ENUM('normal','review','high') NOT NULL DEFAULT 'normal',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (penerbang_id) REFERENCES penerbang(id) ON DELETE RESTRICT,
  INDEX idx_examination_episode_queue (status, planned_date),
  INDEX idx_examination_episode_pilot (penerbang_id, planned_date)
);

CREATE TABLE IF NOT EXISTS pre_assessments (
  id VARCHAR(64) PRIMARY KEY,
  episode_id VARCHAR(64) NOT NULL UNIQUE,
  questionnaire_version VARCHAR(32) NOT NULL,
  answers_json JSON NOT NULL,
  completion_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  consent_at TIMESTAMP NULL,
  pilot_submitted_at TIMESTAMP NULL,
  officer_name VARCHAR(160) NULL,
  officer_note TEXT NULL,
  officer_verified_at TIMESTAMP NULL,
  doctor_name VARCHAR(160) NULL,
  doctor_plan TEXT NULL,
  doctor_reviewed_at TIMESTAMP NULL,
  revision_note TEXT NULL,
  snapshot_hash CHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (episode_id) REFERENCES examination_episodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pre_assessment_flags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pre_assessment_id VARCHAR(64) NOT NULL,
  rule_code VARCHAR(80) NOT NULL,
  rule_version VARCHAR(32) NOT NULL,
  severity ENUM('review','high') NOT NULL,
  explanation TEXT NOT NULL,
  status ENUM('open','resolved','overridden') NOT NULL DEFAULT 'open',
  resolved_by VARCHAR(64) NULL,
  resolved_at TIMESTAMP NULL,
  resolution_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pre_assessment_id) REFERENCES pre_assessments(id) ON DELETE CASCADE,
  INDEX idx_pre_assessment_flag_queue (status, severity)
);

CREATE TABLE IF NOT EXISTS examination_audit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  episode_id VARCHAR(64) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  actor_role VARCHAR(64) NOT NULL,
  action VARCHAR(80) NOT NULL,
  detail_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (episode_id) REFERENCES examination_episodes(id) ON DELETE CASCADE,
  INDEX idx_examination_audit_timeline (episode_id, created_at)
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  filetype ENUM('xls','xlsx','docx') NOT NULL,
  status ENUM('queued','parsed','validated','committed','failed') NOT NULL DEFAULT 'queued',
  total_rows INT NOT NULL DEFAULT 0,
  inserted INT NOT NULL DEFAULT 0,
  updated INT NOT NULL DEFAULT 0,
  skipped INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_row_errors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  import_id VARCHAR(64) NOT NULL,
  row_number INT NOT NULL,
  field VARCHAR(128) NOT NULL,
  raw_value TEXT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES import_jobs(id) ON DELETE CASCADE,
  INDEX idx_import_row_errors_import_id (import_id)
);

CREATE TABLE IF NOT EXISTS mapping_templates (
  id VARCHAR(64) PRIMARY KEY,
  nama VARCHAR(160) NOT NULL,
  entitas_target ENUM('penerbang','mcu','psikotes','jam_terbang') NOT NULL,
  mapping_json JSON NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS validation_jobs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  model_spec_json JSON NOT NULL,
  status ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  ph_status ENUM('pass','warning','fail') NOT NULL DEFAULT 'warning',
  epv_value DECIMAL(8,2) NOT NULL DEFAULT 0,
  c_index DECIMAL(6,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS validation_results (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL,
  jenis ENUM('fit','ph','missing','epv','calibration','bootstrap','residuals') NOT NULL,
  hasil_json JSON NOT NULL,
  kesimpulan TEXT NOT NULL,
  level ENUM('pass','warning','fail') NOT NULL DEFAULT 'warning',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES validation_jobs(id) ON DELETE CASCADE,
  INDEX idx_validation_results_job_id (job_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(80) NOT NULL,
  payload_json JSON NOT NULL,
  status ENUM('queued','running','completed','failed','retrying') NOT NULL DEFAULT 'queued',
  total_subtasks INT NOT NULL DEFAULT 0,
  completed_subtasks INT NOT NULL DEFAULT 0,
  failed_subtasks INT NOT NULL DEFAULT 0,
  progress DECIMAL(5,2) NOT NULL DEFAULT 0,
  result_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subtasks (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL,
  worker_id VARCHAR(64) NOT NULL,
  status ENUM('queued','running','completed','failed','retrying') NOT NULL DEFAULT 'queued',
  task_type VARCHAR(100) NOT NULL,
  hasil_json JSON NOT NULL,
  attempt INT NOT NULL DEFAULT 1,
  mulai TIMESTAMP NULL,
  selesai TIMESTAMP NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_subtasks_job_id (job_id),
  INDEX idx_subtasks_worker_id (worker_id)
);

CREATE TABLE IF NOT EXISTS workers (
  id VARCHAR(64) PRIMARY KEY,
  hostname VARCHAR(160) NOT NULL,
  role ENUM('gateway','broker','coordinator','worker','database','monitor') NOT NULL,
  status ENUM('online','busy','degraded','offline') NOT NULL DEFAULT 'online',
  current_task VARCHAR(255) NULL,
  queue_name VARCHAR(120) NULL,
  last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cpu_load DECIMAL(5,2) NOT NULL DEFAULT 0,
  memory_mb INT NOT NULL DEFAULT 0
);
