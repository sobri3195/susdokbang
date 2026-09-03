# Audit kesiapan modul CSAKT — 3 September 2026

## 1. Ringkasan eksekutif

**Kesimpulan:** repositori ini layak sebagai **prototipe/demo UI**, tetapi **belum layak memproses data operasional atau menjadi dasar keputusan klinis/kelaikan**. Build frontend, lint sintaks PHP, dan kompilasi bytecode Python berhasil. Namun alur utama yang terlihat di browser tidak terhubung ke backend: autentikasi, CRUD, import, analitik, validasi, laporan, pre-assessment, dan console cluster masih memakai state lokal atau data mock.

Temuan terpenting:

1. **P0 — kontrol akses tidak ada di server.** Token dan peran dibuat sendiri di browser; seluruh endpoint backend dapat dibaca/diubah tanpa autentikasi maupun otorisasi.
2. **P0 — hasil statistik tampak valid tetapi sebenarnya konstanta/demo.** Engine mengabaikan hampir seluruh dataset dan mengembalikan HR, p-value, C-index, PH, missingness, bootstrap, dan residual yang tetap. Client PHP bahkan mengubah kegagalan engine menjadi respons mock `success=true`.
3. **P0 — import produksi tidak memiliki lineage data yang utuh.** Hasil parsing hanya dikirim pada respons upload, tidak disimpan; endpoint preview tidak mengembalikan preview; validate memakai baris demo bila payload kosong; commit menerima ulang baris dari client tanpa mengikatnya ke artefak validasi server.
4. **P1 — frontend dan backend berjalan sebagai dua produk terpisah.** `src/lib/api.ts` tersedia, tetapi tidak dipakai modul halaman. Perubahan data hanya masuk `localStorage`/`sessionStorage`.
5. **P1 — orkestrasi federated dapat crash sesudah menyimpan hasil.** Log pada coordinator selalu mengakses `corrected_c_index`, sementara hasil federated tidak mempunyai key itu.
6. **P1 — tidak ada test otomatis.** Tidak ditemukan unit, integration, contract, migration, ataupun end-to-end test untuk sekitar 8.939 baris sumber.
7. **P2 — bundle frontend besar.** Bundle utama minified sekitar 1,28 MB (376 KB gzip) dan Vite memberi peringatan chunk di atas 500 KB.

### Status release yang disarankan

| Target | Keputusan | Syarat minimum |
|---|---|---|
| Demo sidang dengan data sintetis | **GO bersyarat** | Label demo permanen; jangan masukkan PII/PHI; jangan menyatakan hasil sebagai hasil model aktual. |
| Pilot internal dengan data de-identified | **NO-GO** | Tutup seluruh P0 dan P1, tambah test kontrak/API serta observability. |
| Produksi klinis/operasional | **NO-GO keras** | Selain P0/P1: validasi model independen, governance, RBAC, audit trail immutable, privacy/security review, backup/DR, dan acceptance test pengguna. |

## 2. Metode dan cakupan

Audit dilakukan secara statis dan dengan pemeriksaan lokal yang tersedia:

- 84 file sumber TypeScript/TSX, PHP, dan Python; sekitar 8.939 baris.
- Frontend React/Vite, backend REST PHP/MySQL, engine FastAPI, coordinator/worker Redis, schema/seed, Compose, dan dokumentasi.
- Pemeriksaan: build TypeScript/Vite, lint semua PHP, `compileall` Python, validasi Composer, pencarian marker mock/fallback, pemetaan route frontend/API, serta review manual data flow.
- **Belum diuji end-to-end** karena Docker CLI tidak tersedia di lingkungan audit. Tidak ada suite test repo yang dapat dijalankan. Audit dependensi npm juga ditolak registry (HTTP 403), sehingga status CVE belum dapat dinyatakan aman.

Skala prioritas:

- **P0:** dapat menyebabkan akses ilegal, kehilangan/integritas data, atau keputusan klinis/statistik menyesatkan; blocker semua penggunaan nyata.
- **P1:** fungsi inti rusak/tidak tersambung atau reliabilitas produksi rendah; blocker pilot.
- **P2:** gap penting pada kualitas, operasional, dan UX; selesaikan sebelum general availability.
- **P3:** hardening dan maintainability.
- **Polish:** penyempurnaan pengalaman dan konsistensi.

## 3. Temuan P0 — blocker kritis

### P0-01 — autentikasi dan RBAC hanya simulasi client

**Bukti.** `src/store/auth-store.ts` membuat token literal `demo-token-csakt` untuk username apa pun. Login tidak memeriksa password ke server. Penggantian peran juga dilakukan client-side. `src/app/router.tsx` hanya mengecek keberadaan token di Zustand. Di sisi lain, `backend/api/index.php` langsung membuat controller dan melayani GET/POST/PUT/DELETE tanpa middleware autentikasi, permission check, tenant/unit scope, CSRF strategy, atau audit actor.

**Dampak.** Siapa pun yang mencapai gateway dapat membaca, membuat, mengubah, dan menghapus data penerbang/MCU/psikotes/logbook; menjalankan validasi; mengunduh ekspor; dan mengirim job. UI role bukan security boundary.

**Perbaikan wajib.** Implementasikan identity provider/session server atau JWT tervalidasi; middleware auth sebelum routing; matriks izin per peran dan unit; object-level authorization; short-lived credential/rotation; login throttling; logout/revocation; audit actor dari identity yang tervalidasi. Tambahkan negative tests untuk anonymous, wrong-role, cross-unit, expired, forged, dan revoked token.

### P0-02 — statistik dan survival bukan hasil komputasi dataset

**Bukti.** `engine/main.py` menghitung `events` dari panjang dataset dengan minimum 45, tetapi seluruh coefficient, confidence interval, p-value, C-index, Brier score, calibration, Schoenfeld, missingness, bootstrap, dan residual adalah literal tetap. `backend/controllers/AnalyticsController.php` juga mengembalikan hasil hard-coded berlabel `mock-python-service`. Saat cURL/engine gagal, `backend/services/ValidationEngineClient.php` mengembalikan fallback sebagai `success=true`, lalu job disimpan `completed`.

**Dampak.** Dataset kosong atau berbeda dapat menghasilkan kesimpulan yang sama dan terlihat sah. Ini berisiko langsung menyesatkan analisis dan keputusan terkait personel/kesehatan.

**Perbaikan wajib.** Fail closed bila engine gagal; tandai job `failed`; jangan simpan fallback sebagai hasil. Implementasikan pipeline Cox nyata dengan schema input eksplisit, event/time derivation, preprocessing terversi, seed, software/model version, diagnostics, CI, bootstrap, dan provenance. Bedakan endpoint/sample fixture demo secara eksplisit. Tambah golden dataset tests dan review metodologis independen sebelum memunculkan klaim klinis.

### P0-03 — import tidak aman secara integritas dan dapat commit data yang tidak pernah divalidasi server

**Bukti.** `ImportController::upload()` membuat **satu job per file**, tetapi hanya mengembalikan ID job terakhir sementara menggabungkan seluruh tabel. Parsed rows/mapping tidak disimpan. `preview()` hanya mengembalikan pesan, bukan hasil parse. `validate()` memakai `demoRows()` bila `rows` tidak dikirim. `commit()` menerima `rows` langsung dari request dan memanggil `commitRows()` tanpa membuktikan job ada, statusnya sudah validated, row snapshot/hash cocok, atau actor berhak. Mapping endpoint juga tidak memastikan import ID valid.

**Dampak.** UI/API dapat melaporkan preview yang tidak sama dengan isi yang di-commit; client dapat mengganti nilai/status setelah validasi; multi-file kehilangan hubungan job-file; request ulang dapat mengubah data lagi. Audit trail tidak dapat membuktikan sumber data.

**Perbaikan wajib.** Simpan file hash, parsed tables/rows, mapping version, normalized snapshot, issues, dan actor. Gunakan state machine server (`uploaded → parsed → mapped → validated → committed`) dengan transition atomic dan idempotency key. Commit hanya snapshot tervalidasi berdasarkan ID/hash dari storage server, bukan rows arbitrer dari client. Hilangkan fallback demo dari endpoint produksi dan karantina file bila parser/dependency tidak tersedia.

### P0-04 — data medis/personel tanpa governance dan perlindungan minimum

**Bukti.** Schema menyimpan identitas, status kelaikan, MCU, psikotes, keluhan, obat, dan catatan. Endpoint menyediakan list hingga 500 record dan ekspor CSV, tetapi tidak ada row-level scope, purpose/consent enforcement, retention/deletion policy, field encryption, redaction, access log, atau kontrol download. Error global mengembalikan pesan exception mentah ke caller.

**Dampak.** Kebocoran data sensitif, excessive privilege, dan terbukanya detail database/internal. Persistensi data demo di browser juga dapat tertinggal pada workstation bersama.

**Perbaikan wajib.** Tetapkan klasifikasi data, lawful basis/purpose, least privilege, encryption in transit/at rest, secrets manager, retention, secure deletion, redacted structured logging, export watermark/approval, session inactivity timeout, dan audit access/download. Error publik harus memakai kode generik/correlation ID; detail hanya di log server.

## 4. Temuan P1 — fungsi inti belum bekerja atau tidak reliabel

### P1-01 — seluruh halaman utama memakai mock/local state, bukan API

`src/lib/queries.ts` hanya membungkus mock/Zustand dengan `setTimeout`. `src/lib/api.ts` tidak diimpor halaman mana pun. Dampaknya per modul:

- dashboard, executive, survival, causal, quality gate, validation, history, dan cluster menampilkan fixture;
- CRUD penerbang/MCU/psikotes/jam terbang hanya mengubah `localStorage`;
- login hanya mengubah `sessionStorage`;
- import hanya mensimulasikan delay dan angka commit;
- pre-assessment hanya lokal walau tabel database tersedia;
- refresh lintas browser/user tidak konsisten dengan MySQL.

**Perbaikan.** Buat adapter/API layer typed, satu response envelope, query keys/invalidation yang benar, mutation error states, dan mode eksplisit `demo|server`. Default production harus `server`; jangan diam-diam fallback ke fixture.

### P1-02 — endpoint pre-assessment tidak diimplementasikan

Frontend menyediakan workflow penerbang → petugas → dokter dan schema menyediakan empat tabel terkait, tetapi router/controller/repository backend tidak memiliki route pre-assessment. Tidak ada concurrency/version check, sign-off server, append-only audit event, maupun enforcement transisi status.

**Perbaikan.** Implementasikan episode queue/detail, submit, request revision, verify, doctor review, flag resolution/override, optimistic locking, snapshot hash, dan audit event dalam transaksi. Enforce role dan status transition di server.

### P1-03 — bug crash pada job federated

`distributed/coordinator.py::handle_job()` selalu mencetak `result['corrected_c_index']`. Cabang hasil federated dari `aggregate_results()` tidak membuat key itu, sehingga federated job memicu `KeyError` setelah result Redis ditulis. Karena exception keluar dari loop tanpa boundary per job, coordinator process dapat berhenti dan baru hidup lagi karena restart policy.

**Perbaikan.** Gunakan logging field opsional/berdasarkan type, tangkap exception per job, tulis terminal failure state, dan ack/retry secara eksplisit. Tambahkan unit test kedua tipe result dan integration test worker failure/timeout.

### P1-04 — model queue berisiko mencampur, menduplikasi, dan kehilangan pekerjaan

Coordinator memakai `BLPOP` lalu menunggu semua result pada satu global queue. Result job lain di-pop lalu di-`RPUSH`, menyebabkan churn/starvation saat beberapa job berjalan. `BLPOP` menghapus pesan sebelum pekerjaan selesai; crash coordinator/worker dapat kehilangan message. Retry hanya in-memory/push kembali dan tidak memakai lease/visibility timeout atau deduplication. MySQL subtasks yang dibuat gateway tidak pernah disinkronkan oleh Python workers; status UI database dapat tetap queued.

**Perbaikan.** Gunakan Redis Streams consumer groups atau broker dengan ack/visibility timeout; result stream/key per job; idempotent subtask IDs; lease/reaper; dedup result; terminal timeout/cancel; rekonsiliasi Redis↔DB; bounded queue/backpressure; concurrency tests.

### P1-05 — error/fallback layanan dilaporkan sebagai sukses atau metrik palsu

- Validation client mengubah outage menjadi mock sukses.
- Redis push dapat gagal tetapi API tetap HTTP 201 dan job selamanya queued.
- Cluster fallback menampilkan `dead_letter_count=1`, throughput `3.8`, dan p95 `920` sebagai literal.
- Parser tanpa PhpSpreadsheet/PhpWord mengarang preview/24 baris, bukan gagal.

**Perbaikan.** Gunakan health/readiness checks, status `degraded/failed`, typed error code, retry policy, dan telemetry aktual. Fixture hanya boleh aktif melalui flag demo yang jelas dan respons harus membawa `data_origin=synthetic`.

### P1-06 — validasi request hampir tidak ada

Controller mengakses key array langsung dan mengandalkan error MySQL. Tidak ada batas page/search, validation schema, allowed enum/range, referential precheck, payload/file-count limit, atau consistent 400/409/422 mapping. `submitJob()` menerima resamples negatif/besar dan daftar node arbitrer; resource exhaustion mungkin terjadi.

**Perbaikan.** Tambahkan DTO/schema per endpoint, size/range limits, allowlist type/node, pagination, uniqueness conflict handling, dan centralized exception mapping. Jangan bocorkan exception mentah.

### P1-07 — import upload belum memeriksa kegagalan upload secara benar

Kode memeriksa ekstensi dan size, tetapi tidak memeriksa `UPLOAD_ERR_*`, MIME/signature, keberhasilan `move_uploaded_file`, formula/macro/archive-bomb risk, symlink/path lifecycle, cleanup, ataupun virus scan. File hasil upload tidak dihapus dan lokasi storage berada di bawah tree backend.

**Perbaikan.** Validasi status, magic bytes/MIME, zip limits, safe parser mode, AV scan, randomized non-web storage, permission ketat, retention/cleanup, checksum, dan failure handling atomic untuk batch multi-file.

### P1-08 — schema/model analitik tidak menyediakan dataset survival yang dibutuhkan

`ValidationController::datasetFromDb()` hanya mengambil `id`, `nrp`, `usia`, `total_jam`, `risk_score`, dan `status`, sedangkan default model meminta `bulan_observasi`, `event_kelaikan`, BMI, kolesterol, stress, VO2max, dan stabilitas jam terbang. Tidak ada join/feature derivation, censoring definition, index date, repeated-measure policy, atau missing-value semantics.

**Perbaikan.** Definisikan analytical dataset contract dan materialization pipeline terversi. Tambahkan temporal leakage checks, cohort inclusion/exclusion, censoring, competing risk decision, dan reproducible data snapshot.

## 5. Temuan P2 — kualitas dan operasional

### P2-01 — nol test dan tidak ada CI quality gate

Tidak ditemukan file test/spec. Script npm hanya dev/build/preview/typecheck; tidak ada lint, unit, coverage, e2e, PHP static analysis, migration test, Python lint/typecheck, SAST, secret scan, SBOM, atau dependency scan yang diwajibkan CI.

**Target minimum.** Unit test normalizer/fuzzy mapper/repository service; contract test response; integration test MariaDB/Redis/FastAPI; Playwright alur kritis; golden statistical tests; CI build+lint+test+security. Tetapkan coverage berbasis risiko, bukan sekadar persentase global.

### P2-02 — format respons API tidak konsisten

Sebagian endpoint memakai `{data: ...}`, sebagian `Response::ok()` yang membungkus lagi menjadi `{success,data,error}`, dan frontend interceptor mencari `response.data.message` padahal error `Response::fail()` berada di `error.message`. Error UI berpotensi hanya menampilkan pesan generik Axios.

**Perbaikan.** Standarkan envelope, pagination metadata, error code/details/correlation ID, dan generate TypeScript client dari OpenAPI.

### P2-03 — operasi CRUD tidak aman terhadap overwrite/lost update

Update mengganti seluruh record tanpa version/ETag dan tidak membedakan record tidak ditemukan (sering kembali `data:null` dengan 200). Delete tidak meminta alasan/audit dan cascade dapat menghapus seluruh data terkait penerbang. Tidak ada soft delete atau approval untuk data klinis.

**Perbaikan.** Optimistic concurrency, 404/409 yang benar, immutable revision/audit, policy archive/void alih-alih hard delete untuk rekam medis, dan transaction boundary lintas aggregate.

### P2-04 — import normalization terlalu permisif

Angka yang tidak dapat dibaca menjadi `0`, tetapi hanya BMI/tanggal/tekanan darah yang divalidasi. Status tidak dikenal menjadi `Laik` (default berbahaya). NRP hanya menghapus whitespace. Tekanan darah hanya format, bukan range. Tidak ada validasi usia, kolesterol, gula, VO2max, skor psikologi, durasi, enum pesawat, future date, duplicate, atau cross-field consistency.

**Perbaikan.** Gunakan `null + issue`, jangan default aman-palsu. Tambah domain ranges yang dikonfigurasi dan terversi, severity, duplicate key policy, referential resolution queue, serta human confirmation untuk ambiguous mapping.

### P2-05 — deteksi header dan DOCX belum memenuhi klaim UI

Header spreadsheet dipilih dari baris dengan teks unik terbanyak; ini mudah memilih judul/catatan. `rows_detected` menghitung semua baris setelah header termasuk footer/kosong. Parser DOCX hanya mengambil top-level element dengan `getText`, menetapkan header psikotes tetap, dan tidak benar-benar mengekstrak record/tabel nested. Fallback membuat data sintetis tanpa failure signal.

**Perbaikan.** Fixture regression dari seluruh format nyata; structural table extraction; confidence calibration; blank/subtotal/footer filtering; merged-cell handling; explicit unsupported constructs; provenance cell/sheet/page/paragraph.

### P2-06 — performa frontend dan data access

Build menghasilkan satu chunk utama sekitar 1,28 MB. Semua halaman diimpor eager oleh router. List penerbang backend tidak dipaginasi dan data module fixed limit 500 tanpa cursor/metadata. Chart/table besar akan membebani browser.

**Perbaikan.** Lazy route imports, vendor/chart chunking, bundle budget; server-side pagination/filter/sort; virtualization untuk tabel panjang; cache policy dan cancellation pada query.

### P2-07 — observability dan lifecycle job tidak cukup

Tidak ada structured log/correlation ID, metrics nyata, trace, alert, `/health` gateway, `/ready` dependency checks, job cancellation, retry visibility, poison-message inspection, atau retention. Worker heartbeat dibaca tanpa TTL/staleness check sehingga worker mati dapat tetap tampak online.

**Perbaikan.** JSON logs dengan trace/job/import IDs, RED metrics, heartbeat stale threshold, dashboards/alerts, runbook, retention/purge, and admin replay with authorization.

### P2-08 — supply chain/deployment belum terkunci

Image memakai tag mutable (`mariadb:11`, `redis:7-alpine`), dependency npm/composer/Python memakai rentang versi; Composer lock tidak ditemukan. Konfigurasi Compose memuat password statis demo dan membuka database/Redis ke host. Audit npm belum berhasil karena registry 403.

**Perbaikan.** Lock semua dependency, pin image digest, non-root/read-only containers, internal-only DB/Redis network, secrets, resource limits, image scan/SBOM/signing, backup restore drill, dan dependency audit di CI yang punya registry access.

## 6. P3 — hardening dan maintainability

1. **Pisahkan demo dari production.** Fixture, tombol simulasi kill/scale, angka observability, dan fallback mock harus dikompilasi/di-deploy terpisah atau dilindungi feature flag server.
2. **Hilangkan reflection ke private DB.** `ValidationController` mengambil koneksi repository via `ReflectionClass`; buat `AnalyticalDatasetRepository` eksplisit agar mudah diuji dan tidak menembus encapsulation.
3. **Standarkan naming/serialization.** Frontend camelCase, database snake_case, dan parser memakai campuran keduanya. Gunakan mapper boundary dan contract tests.
4. **Migrasi database.** Satu `schema.sql` `CREATE TABLE IF NOT EXISTS` tidak menangani perubahan schema/version/rollback. Gunakan migration tool dan schema compatibility checks.
5. **Timezone dan clock.** Campuran `date`, `gmdate`, browser local time, dan timestamp DB dapat mengubah tanggal klinis/job. Definisikan UTC untuk instant dan timezone fasilitas untuk date/display.
6. **Idempotency dan collision.** ID berbasis timestamp/random cukup untuk demo, tetapi mutation/import/job perlu idempotency key dan uniqueness semantics yang jelas.
7. **Accessibility QA.** Tambah automated axe dan keyboard/screen-reader checks untuk dialog, dropdown, chart alternative, live status, focus restoration, drag-and-drop, serta table caption/header association.
8. **Dokumentasi operasi.** Tambah environment matrix, API contract, backup/restore, incident response, data correction, model release, rollback, dan disaster recovery runbook.

## 7. Polish — setelah correctness dan security

1. Tampilkan badge global **Demo / Synthetic Data** dan sumber data pada setiap kartu/ekspor.
2. Pertahankan filter di URL, sediakan clear-all, saved view yang nyata, dan empty/error/retry state konsisten.
3. Tambahkan upload progress aktual, cancel, per-file status, checksum, estimasi durasi, dan resumable/retry flow.
4. Mapping perlu bulk action, deteksi target ganda, required-field indicator, undo, preview transform, dan alasan confidence.
5. Validation perlu drill-down dari issue ke source cell dan alur koreksi/revalidate tanpa upload ulang.
6. Ekspor perlu escaping CSV yang konsisten, formula-injection protection, locale/timezone, metadata snapshot/model version, dan signed audit footer.
7. Chart perlu tooltip/legend/unit yang konsisten, tabel alternatif, uncertainty/CI yang jelas, serta tidak memakai warna sebagai satu-satunya status.
8. Console distributed harus membedakan command simulasi vs tindakan cluster nyata dan meminta konfirmasi/otorisasi untuk operasi destruktif.
9. Tambahkan skeleton/error boundary per route dan graceful offline/timeout state.
10. Sinkronkan README dengan kenyataan implementasi: tandai modul mock, dependency opsional yang menyebabkan synthetic fallback, dan batasan non-produksi.

## 8. Matriks kesiapan per modul

| Modul | UI | Backend | Data nyata | Risiko utama | Prioritas |
|---|---|---|---|---|---|
| Login/session/RBAC | Demo | Tidak ada | Tidak | Bypass total | P0 |
| Dashboard & eksekutif | Ada | Tidak terhubung | Tidak | Angka fixture dianggap aktual | P0/P1 |
| Master penerbang | CRUD lokal | CRUD PHP ada | Tidak terhubung | Unauthorized CRUD/lost update | P0/P1 |
| MCU | CRUD lokal | CRUD PHP ada | Tidak terhubung | Data medis tanpa access control | P0/P1 |
| Psikotes | CRUD lokal | CRUD PHP ada | Tidak terhubung | Data sensitif & scoring semu | P0/P1 |
| Jam terbang | CRUD lokal | CRUD PHP ada | Tidak terhubung | Konsistensi paparan/model | P1 |
| Pre-assessment | Workflow lokal | Hanya schema | Tidak | Sign-off/audit tidak sah | P1 |
| Import cerdas | Simulasi | Parsial | Tidak end-to-end | Commit tak terikat validasi | P0 |
| Quality gate | Kalkulasi fixture/client | Tidak ada | Tidak | Gate tidak melindungi pipeline | P1 |
| Survival/Cox | Visual lengkap | Mock | Tidak | Hasil statistik menyesatkan | P0 |
| Validasi Cox | Visual lengkap | Endpoint + mock engine | Tidak | Outage menjadi sukses | P0 |
| Kausal | Presentasi | Tidak ada | Tidak | Klaim analitik tanpa estimasi | P0/P1 |
| Laporan/ekspor | CSV/print parsial | Export validasi saja | Tidak | Leakage/formula injection/provenance | P1/P2 |
| Distributed system | Simulasi | Parsial | Demo deterministik | Crash/lost message/fake metrics | P1 |
| Pengaturan | UI | Tidak ada persistence server | Tidak | Ekspektasi konfigurasi palsu | P2 |

## 9. Rencana remediasi bertahap

### Fase 0 — containment (segera, sebelum demo dengan pihak luar)

- Pasang banner demo/synthetic; nonaktifkan deployment publik dan jangan masukkan data nyata.
- Hapus/disable fallback yang melaporkan synthetic result sebagai sukses.
- Lindungi gateway minimal dengan network restriction sampai auth server tersedia.
- Perbaiki crash federated dan pesan error publik.

**Exit criteria:** tidak ada jalur yang dapat salah dianggap hasil produksi; gateway tidak anonymous dari jaringan tak tepercaya.

### Fase 1 — P0 closure

- AuthN/AuthZ/RBAC + audit actor.
- Import state machine, server snapshot, idempotent commit, secure upload.
- Analytical dataset contract dan engine statistik nyata tervalidasi.
- Privacy/security controls dan error handling.

**Exit criteria:** threat model disetujui; test unauthorized lulus; golden dataset statistik lulus; import source-to-row lineage dapat dibuktikan.

### Fase 2 — integrasi fungsi inti

- Hubungkan seluruh query/mutation frontend ke API typed.
- Implementasikan pre-assessment backend dan transition enforcement.
- Queue reliable + DB reconciliation + cancellation/retry.
- Standard response/error/OpenAPI.

**Exit criteria:** E2E happy/error paths lulus terhadap stack Compose tanpa mock tersembunyi.

### Fase 3 — quality/operations

- CI test matrix, migrations, observability, backup/restore, security scan.
- Pagination/performance/code splitting.
- Model/data governance, release/versioning, monitoring drift/calibration.

**Exit criteria:** SLO/runbook/DR diuji; pilot de-identified mendapat sign-off engineering, security, statistik, dan klinis.

### Fase 4 — polish dan acceptance

- Accessibility, source-aware UX, import correction flow, export safety, chart clarity.
- UAT berbasis peran dan training/operator documentation.

**Exit criteria:** usability/accessibility acceptance dan tidak ada P0/P1 terbuka.

## 10. Definition of done yang direkomendasikan

Sebuah modul baru boleh diberi status “berfungsi” bila:

1. UI menggunakan API produksi (bukan fixture tersembunyi) dan menyajikan loading/empty/error/retry.
2. Endpoint terautentikasi, terotorisasi per object/unit, tervalidasi, idempotent bila perlu, dan diaudit.
3. Data mempunyai provenance, version, concurrency policy, retention, dan correction flow.
4. Unit + contract + integration + E2E test untuk happy path dan kegagalan kritis tersedia di CI.
5. Metrics/log/trace dan runbook operasional tersedia tanpa mengekspos PII/PHI.
6. Untuk analitik: dataset/model/version/seed/assumption/uncertainty tercatat dan hasil diuji terhadap golden reference.
7. Dokumentasi menyebut batasan dan mode demo secara jujur.

Dengan definition tersebut, **belum ada modul data/analitik yang end-to-end production-ready saat audit ini**; kekuatan repositori saat ini adalah kelengkapan prototipe antarmuka dan baseline arsitektur, bukan correctness atau operational readiness.
