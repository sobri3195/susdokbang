USE csakt;

INSERT INTO penerbang (id, nrp, nama, pangkat, skadron, usia, kategori_pesawat, status, total_jam, tanggal_masuk, event_date, risk_score) VALUES
('P-001','529701','Mayor Pnb Aditya W.','Mayor','Skadron Udara 3',39,'Tempur','Laik',2380,'2016-02-12',NULL,22),
('P-002','531115','Kapten Pnb Bagas R.','Kapten','Skadron Udara 31',35,'Angkut','Observasi',1960,'2017-06-03','2025-11-15',48),
('P-003','522884','Letkol Pnb Chandra H.','Letkol','Skadron Udara 8',44,'Helikopter','Terbatas',3120,'2016-01-18','2024-04-21',63)
ON DUPLICATE KEY UPDATE nama = VALUES(nama), status = VALUES(status), risk_score = VALUES(risk_score);

INSERT INTO mcu_records (id, penerbang_id, tanggal, bmi, tekanan_darah, kolesterol, gula_darah, vo2max, catatan, status) VALUES
('MCU-001','P-001','2026-01-14',23.80,'118/76',178,88,46,'Fit for mission profile.','Laik'),
('MCU-002','P-002','2026-02-14',27.40,'132/86',214,102,39,'Perlu monitoring berkala.','Observasi'),
('MCU-003','P-003','2026-03-14',29.10,'140/92',232,116,36,'Evaluasi lanjutan.','Terbatas')
ON DUPLICATE KEY UPDATE bmi = VALUES(bmi), status = VALUES(status);

INSERT INTO psikotes_records (id, penerbang_id, tanggal, stabilitas_emosi, atensi, stress_index, cognitive_load, rekomendasi) VALUES
('PSI-001','P-001','2026-02-08',86,89,22,34,'Sesuai profil tugas.'),
('PSI-002','P-002','2026-03-08',74,77,46,48,'Monitoring workload.'),
('PSI-003','P-003','2026-04-08',67,71,54,55,'Pendampingan psikologi operasional.')
ON DUPLICATE KEY UPDATE stress_index = VALUES(stress_index), rekomendasi = VALUES(rekomendasi);

INSERT INTO jam_terbang_records (id, penerbang_id, tanggal, jenis_pesawat, misi, durasi_jam, malam, instruktur) VALUES
('JT-001','P-001','2026-01-11','F-16 C/D','Combat readiness',2.40,FALSE,TRUE),
('JT-002','P-002','2026-01-18','C-130H','Air logistics',5.60,TRUE,FALSE),
('JT-003','P-003','2026-02-03','H225M','SAR exercise',3.20,FALSE,TRUE)
ON DUPLICATE KEY UPDATE durasi_jam = VALUES(durasi_jam), misi = VALUES(misi);

INSERT INTO import_jobs (id, user_id, filename, filetype, status, total_rows, inserted, updated, skipped, failed) VALUES
('IMP-20260811-001','demo-user','mcu_messy_2016_2026.xlsx','xlsx','committed',148,121,19,8,0),
('IMP-20260810-004','demo-user','catatan_psikologi_naratif.docx','docx','validated',42,0,0,0,3)
ON DUPLICATE KEY UPDATE status = VALUES(status), total_rows = VALUES(total_rows), inserted = VALUES(inserted), updated = VALUES(updated), skipped = VALUES(skipped), failed = VALUES(failed);

INSERT INTO import_row_errors (import_id, row_number, field, raw_value, reason) VALUES
('IMP-20260810-004', 7, 'nrp', '', 'NRP kosong dan nama tidak cukup untuk pencocokan penerbang.'),
('IMP-20260810-004', 12, 'tanggal', '32/13/2024', 'Tanggal tidak dapat diparse.')
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

INSERT INTO mapping_templates (id, nama, entitas_target, mapping_json, created_by) VALUES
('TPL-MCU-DEFAULT','Template MCU LAKESPRA Default','mcu','{"Tgl MCU":"tanggal","TD":"tekanan_darah","Kolestrol":"kolesterol","BMI":"bmi","NRP / Nama":"nrp"}','demo-user'),
('TPL-LOGBOOK-DEFAULT','Template Logbook Campuran','jam_terbang','{"Jenis pswt":"jenis_pesawat","jam total":"durasi_jam","misi mlm":"malam","NRP":"nrp"}','demo-user')
ON DUPLICATE KEY UPDATE mapping_json = VALUES(mapping_json);

INSERT INTO validation_jobs (id, user_id, model_spec_json, status, ph_status, epv_value, c_index) VALUES
('VAL-20260811-001','demo-user','{"time_column":"bulan_observasi","event_column":"event_kelaikan","covariates":["usia_gt_40","bmi_gt_27","kolesterol_gt_220","stress_tinggi","vo2max_baik","jam_terbang_stabil"]}','completed','warning',7.50,0.780),
('VAL-20260808-003','demo-user','{"time_column":"bulan_observasi","event_column":"event_kelaikan","covariates":["usia_gt_40","bmi_gt_27","stress_tinggi"]}','completed','pass',9.20,0.740)
ON DUPLICATE KEY UPDATE status = VALUES(status), ph_status = VALUES(ph_status), epv_value = VALUES(epv_value), c_index = VALUES(c_index);

INSERT INTO validation_results (id, job_id, jenis, hasil_json, kesimpulan, level) VALUES
('VR-SEED-PH','VAL-20260811-001','ph','{"global_schoenfeld_p":0.118,"status":"warning"}','Uji global Schoenfeld masih terpenuhi, namun stress index perlu model time-varying sebagai sensitivitas.','warning'),
('VR-SEED-FIT','VAL-20260811-001','fit','{"c_index":0.78,"epv":7.5}','C-index baik dan EPV kategori hati-hati.','warning'),
('VR-SEED-MISSING','VAL-20260811-001','missing','{"missing_percent":6.8,"little_p":0.031}','Missingness moderat dan tidak sepenuhnya MCAR.','warning')
ON DUPLICATE KEY UPDATE hasil_json = VALUES(hasil_json), kesimpulan = VALUES(kesimpulan), level = VALUES(level);

INSERT INTO workers (id, hostname, role, status, current_task, queue_name, cpu_load, memory_mb) VALUES
('gateway-php-1','csakt-gateway','gateway','online','orchestrate_jobs','-',18,192),
('redis-1','csakt-redis','broker','online','queue:cox.bootstrap','cox.bootstrap',11,84),
('coordinator-1','csakt-coordinator','coordinator','busy','reduce_bootstrap','cox.results',44,256),
('worker-1','csakt-worker-1','worker','busy','bootstrap chunk 901-1000','cox.bootstrap',71,612),
('worker-2','csakt-worker-2','worker','busy','MICE chain 4','cox.missing',64,544),
('worker-3','csakt-worker-3','worker','degraded','retry PH residual chunk','cox.ph',92,702),
('worker-4','csakt-worker-4','worker','busy','bootstrap chunk 701-800','cox.bootstrap',69,588),
('mysql-1','csakt-mysql','database','online','persist_results','-',23,890)
ON DUPLICATE KEY UPDATE status = VALUES(status), current_task = VALUES(current_task), queue_name = VALUES(queue_name), cpu_load = VALUES(cpu_load), memory_mb = VALUES(memory_mb);

INSERT INTO jobs (id, type, payload_json, status, total_subtasks, completed_subtasks, failed_subtasks, progress, result_json) VALUES
('JOB-BOOT-20260811-001','bootstrap_validation','{"resamples":1000,"chunk_size":100}','running',12,10,1,83.00,'{"corrected_c_index":0.75,"speedup":3.42,"single_node_seconds":312,"distributed_seconds":91}'),
('JOB-FED-20260811-002','federated_aggregation','{"nodes":4}','completed',4,4,0,100.00,'{"raw_data_shared":false,"events":45,"rows":608}')
ON DUPLICATE KEY UPDATE status = VALUES(status), completed_subtasks = VALUES(completed_subtasks), failed_subtasks = VALUES(failed_subtasks), progress = VALUES(progress), result_json = VALUES(result_json);

INSERT INTO subtasks (id, job_id, worker_id, status, task_type, hasil_json, attempt, mulai, selesai) VALUES
('ST-SEED-001','JOB-BOOT-20260811-001','worker-1','completed','bootstrap_chunk_100','{"c_index":0.76}',1,'2026-08-11 09:10:04','2026-08-11 09:10:25'),
('ST-SEED-002','JOB-BOOT-20260811-001','worker-2','completed','bootstrap_chunk_100','{"c_index":0.74}',1,'2026-08-11 09:10:05','2026-08-11 09:10:27'),
('ST-SEED-003','JOB-BOOT-20260811-001','worker-3','retrying','bootstrap_chunk_100','{"reason":"heartbeat timeout"}',2,'2026-08-11 09:11:16',NULL),
('ST-SEED-004','JOB-BOOT-20260811-001','worker-4','completed','bootstrap_chunk_100','{"c_index":0.75}',2,'2026-08-11 09:11:18','2026-08-11 09:11:42')
ON DUPLICATE KEY UPDATE status = VALUES(status), worker_id = VALUES(worker_id), hasil_json = VALUES(hasil_json), attempt = VALUES(attempt);
