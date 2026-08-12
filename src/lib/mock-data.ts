import type {
  CoxResult,
  CoxValidationResult,
  DistributedClusterSnapshot,
  DistributedSubtask,
  ImportCleanRow,
  ImportDetectedTable,
  ImportJobHistory,
  ImportMapping,
  ValidationJobHistory,
  JamTerbangRecord,
  McuRecord,
  Penerbang,
  PsikotesRecord,
  SurvivalPoint,
} from "./types";

export const penerbang: Penerbang[] = [
  { id: "P-001", nrp: "529701", nama: "Mayor Pnb Aditya W.", pangkat: "Mayor", skadron: "Skadron Udara 3", usia: 39, kategoriPesawat: "Tempur", status: "Laik", totalJam: 2380, tanggalMasuk: "2016-02-12", riskScore: 22 },
  { id: "P-002", nrp: "531115", nama: "Kapten Pnb Bagas R.", pangkat: "Kapten", skadron: "Skadron Udara 31", usia: 35, kategoriPesawat: "Angkut", status: "Observasi", totalJam: 1960, tanggalMasuk: "2017-06-03", eventDate: "2025-11-15", riskScore: 48 },
  { id: "P-003", nrp: "522884", nama: "Letkol Pnb Chandra H.", pangkat: "Letkol", skadron: "Skadron Udara 8", usia: 44, kategoriPesawat: "Helikopter", status: "Terbatas", totalJam: 3120, tanggalMasuk: "2016-01-18", eventDate: "2024-04-21", riskScore: 63 },
  { id: "P-004", nrp: "533902", nama: "Kapten Pnb Dimas S.", pangkat: "Kapten", skadron: "Skadron Udara 15", usia: 33, kategoriPesawat: "Tempur", status: "Laik", totalJam: 1715, tanggalMasuk: "2019-08-20", riskScore: 18 },
  { id: "P-005", nrp: "519552", nama: "Kolonel Pnb Eko P.", pangkat: "Kolonel", skadron: "Wing Udara 1", usia: 49, kategoriPesawat: "Angkut", status: "Observasi", totalJam: 4010, tanggalMasuk: "2016-03-05", eventDate: "2026-01-09", riskScore: 57 },
  { id: "P-006", nrp: "536671", nama: "Lettu Pnb Farhan A.", pangkat: "Lettu", skadron: "Skadron Pendidikan 101", usia: 29, kategoriPesawat: "Latih", status: "Laik", totalJam: 820, tanggalMasuk: "2022-02-01", riskScore: 14 },
  { id: "P-007", nrp: "527334", nama: "Mayor Pnb Galih N.", pangkat: "Mayor", skadron: "Skadron Udara 6", usia: 41, kategoriPesawat: "Helikopter", status: "Tidak Laik", totalJam: 2844, tanggalMasuk: "2016-09-13", eventDate: "2023-09-02", riskScore: 79 },
  { id: "P-008", nrp: "532018", nama: "Kapten Pnb Hendra K.", pangkat: "Kapten", skadron: "Skadron Udara 17", usia: 36, kategoriPesawat: "Angkut", status: "Laik", totalJam: 2110, tanggalMasuk: "2018-10-12", riskScore: 26 },
];

export const mcuRecords: McuRecord[] = penerbang.map((pilot, index) => ({
  id: `MCU-${index + 1}`.padStart(6, "0"),
  penerbangId: pilot.id,
  tanggal: `2026-0${(index % 6) + 1}-14`,
  bmi: [23.8, 27.4, 29.1, 22.6, 28.3, 21.9, 30.2, 24.5][index],
  tekananDarah: ["118/76", "132/86", "140/92", "116/74", "136/88", "112/72", "148/94", "122/78"][index],
  kolesterol: [178, 214, 232, 169, 226, 161, 248, 184][index],
  gulaDarah: [88, 102, 116, 84, 108, 82, 124, 91][index],
  vo2max: [46, 39, 36, 49, 35, 51, 32, 44][index],
  catatan: index % 3 === 0 ? "Fit for mission profile." : "Perlu monitoring berkala.",
  status: pilot.status,
}));

export const psikotesRecords: PsikotesRecord[] = penerbang.map((pilot, index) => ({
  id: `PSI-${index + 1}`.padStart(6, "0"),
  penerbangId: pilot.id,
  tanggal: `2026-0${(index % 5) + 2}-08`,
  stabilitasEmosi: [86, 74, 67, 91, 70, 88, 59, 82][index],
  atensi: [89, 77, 71, 93, 73, 90, 62, 85][index],
  stressIndex: [22, 46, 54, 18, 51, 20, 68, 29][index],
  cognitiveLoad: [34, 48, 55, 30, 52, 32, 64, 38][index],
  rekomendasi: index > 4 ? "Pendampingan psikologi operasional." : "Sesuai profil tugas.",
}));

export const jamTerbangRecords: JamTerbangRecord[] = [
  { id: "JT-001", penerbangId: "P-001", tanggal: "2026-01-11", jenisPesawat: "F-16 C/D", misi: "Combat readiness", durasiJam: 2.4, malam: false, instruktur: true },
  { id: "JT-002", penerbangId: "P-002", tanggal: "2026-01-18", jenisPesawat: "C-130H", misi: "Air logistics", durasiJam: 5.6, malam: true, instruktur: false },
  { id: "JT-003", penerbangId: "P-003", tanggal: "2026-02-03", jenisPesawat: "H225M", misi: "SAR exercise", durasiJam: 3.2, malam: false, instruktur: true },
  { id: "JT-004", penerbangId: "P-004", tanggal: "2026-02-19", jenisPesawat: "T-50i", misi: "Tactical intercept", durasiJam: 1.8, malam: false, instruktur: false },
  { id: "JT-005", penerbangId: "P-005", tanggal: "2026-03-06", jenisPesawat: "B737", misi: "VIP transport", durasiJam: 4.1, malam: true, instruktur: true },
  { id: "JT-006", penerbangId: "P-006", tanggal: "2026-03-17", jenisPesawat: "KT-1B", misi: "Basic training", durasiJam: 1.5, malam: false, instruktur: false },
  { id: "JT-007", penerbangId: "P-007", tanggal: "2026-04-10", jenisPesawat: "NAS332", misi: "Tactical lift", durasiJam: 2.9, malam: true, instruktur: true },
  { id: "JT-008", penerbangId: "P-008", tanggal: "2026-04-24", jenisPesawat: "CN-295", misi: "Route qualification", durasiJam: 3.8, malam: false, instruktur: false },
];

export const coxResults: CoxResult[] = [
  { faktor: "Usia > 40 tahun", hazardRatio: 1.82, ciLow: 1.26, ciHigh: 2.64, pValue: 0.002, arah: "Risiko" },
  { faktor: "BMI >= 27", hazardRatio: 1.51, ciLow: 1.08, ciHigh: 2.11, pValue: 0.016, arah: "Risiko" },
  { faktor: "Kolesterol >= 220 mg/dL", hazardRatio: 1.67, ciLow: 1.15, ciHigh: 2.43, pValue: 0.007, arah: "Risiko" },
  { faktor: "Stress index tinggi", hazardRatio: 1.94, ciLow: 1.31, ciHigh: 2.88, pValue: 0.001, arah: "Risiko" },
  { faktor: "VO2max baik", hazardRatio: 0.72, ciLow: 0.54, ciHigh: 0.96, pValue: 0.024, arah: "Protektif" },
  { faktor: "Jam terbang stabil", hazardRatio: 0.81, ciLow: 0.63, ciHigh: 1.04, pValue: 0.098, arah: "Protektif" },
];

export const survivalCurve: SurvivalPoint[] = Array.from({ length: 11 }, (_, index) => {
  const bulan = index * 12;
  return [
    { bulan, group: "Risiko Rendah", survival: Math.max(0.72, 1 - index * 0.024), riskSet: 182 - index * 8 },
    { bulan, group: "Risiko Sedang", survival: Math.max(0.54, 1 - index * 0.043), riskSet: 164 - index * 11 },
    { bulan, group: "Risiko Tinggi", survival: Math.max(0.31, 1 - index * 0.069), riskSet: 96 - index * 9 },
  ];
}).flat();

export const yearlyTrend = [
  { year: "2016", laik: 93, observasi: 12, event: 4 },
  { year: "2017", laik: 101, observasi: 16, event: 6 },
  { year: "2018", laik: 118, observasi: 17, event: 7 },
  { year: "2019", laik: 126, observasi: 19, event: 9 },
  { year: "2020", laik: 132, observasi: 23, event: 12 },
  { year: "2021", laik: 139, observasi: 21, event: 10 },
  { year: "2022", laik: 146, observasi: 25, event: 14 },
  { year: "2023", laik: 151, observasi: 29, event: 17 },
  { year: "2024", laik: 157, observasi: 31, event: 19 },
  { year: "2025", laik: 162, observasi: 34, event: 21 },
  { year: "2026", laik: 168, observasi: 28, event: 13 },
];

export const importDetectedTables: ImportDetectedTable[] = [
  {
    id: "tbl-mcu-1",
    sourceName: "mcu_messy_2016_2026.xlsx",
    sheetName: "LAKESPRA MCU",
    entity: "mcu",
    confidence: 92,
    headerRow: 5,
    rowsDetected: 148,
    rawPreview: [
      ["LOGO LAKESPRA", "", "", "", ""],
      ["REKAP PEMERIKSAAN KESEHATAN PENERBANG", "", "", "", ""],
      ["periode", "2016 s.d 2026", "", "", ""],
      ["", "", "", "", ""],
      ["No", "NRP / Nama", "Tgl MCU", "TD", "Kolestrol", "BMI"],
      ["1", "529701 - Mayor Pnb Aditya W.", "12 Maret 2016", "120/80", "178 mg/dL", "23,8"],
      ["2", "531115 - Kapten Pnb Bagas R.", "03/06/17", "132 / 86", "214", "27.4"],
    ],
  },
  {
    id: "tbl-psiko-1",
    sourceName: "catatan_psikologi_naratif.docx",
    entity: "psikotes",
    confidence: 86,
    headerRow: 1,
    rowsDetected: 42,
    rawPreview: [
      ["Paragraf", "Entitas terdeteksi", "Nilai"],
      ["NRP: 522884, nama Letkol Pnb Chandra H.; stress index 54; rekomendasi pendampingan.", "nrp,nama,stress_index,rekomendasi", "522884; Chandra H.; 54"],
      ["Pemeriksaan 21 April 2024 menunjukkan atensi 71 dan stabilitas emosi 67.", "tanggal,atensi,stabilitas_emosi", "2024-04-21; 71; 67"],
    ],
  },
  {
    id: "tbl-jam-1",
    sourceName: "logbook_campuran.xls",
    sheetName: "Sheet2",
    entity: "jam_terbang",
    confidence: 78,
    headerRow: 3,
    rowsDetected: 231,
    rawPreview: [
      ["rekap jam terbang", "", "", ""],
      ["subtotal triwulan - jangan import", "", "", ""],
      ["NRP", "Jenis pswt", "jam total", "misi mlm"],
      ["529701", "F-16 C/D", "2,4 jam", "tidak"],
      ["531115", "C-130H", "5.6", "ya"],
    ],
  },
];

export const importMappings: ImportMapping[] = [
  { id: "map-1", tableId: "tbl-mcu-1", sourceColumn: "NRP / Nama", targetField: "nrp,nama", confidence: 91, required: true },
  { id: "map-2", tableId: "tbl-mcu-1", sourceColumn: "Tgl MCU", targetField: "tanggal", confidence: 96, required: true },
  { id: "map-3", tableId: "tbl-mcu-1", sourceColumn: "TD", targetField: "tekanan_darah", confidence: 89 },
  { id: "map-4", tableId: "tbl-mcu-1", sourceColumn: "Kolestrol", targetField: "kolesterol", confidence: 82 },
  { id: "map-5", tableId: "tbl-mcu-1", sourceColumn: "BMI", targetField: "bmi", confidence: 98 },
  { id: "map-6", tableId: "tbl-psiko-1", sourceColumn: "stress index", targetField: "stress_index", confidence: 95 },
  { id: "map-7", tableId: "tbl-psiko-1", sourceColumn: "rekomendasi", targetField: "rekomendasi", confidence: 88 },
  { id: "map-8", tableId: "tbl-jam-1", sourceColumn: "Jenis pswt", targetField: "jenis_pesawat", confidence: 73 },
  { id: "map-9", tableId: "tbl-jam-1", sourceColumn: "jam total", targetField: "durasi_jam", confidence: 90 },
  { id: "map-10", tableId: "tbl-jam-1", sourceColumn: "misi mlm", targetField: "malam", confidence: 68 },
];

export const importCleanRows: ImportCleanRow[] = [
  { id: "row-1", entity: "mcu", status: "valid", values: { nrp: "529701", nama: "Mayor Pnb Aditya W.", tanggal: "2016-03-12", tekanan_darah: "120/80", sys: 120, dia: 80, kolesterol: 178, bmi: 23.8 }, issues: [] },
  { id: "row-2", entity: "mcu", status: "warning", values: { nrp: "531115", nama: "Kapten Pnb Bagas R.", tanggal: "2017-06-03", tekanan_darah: "132/86", kolesterol: 214, bmi: 27.4 }, issues: [{ field: "bmi", rawValue: "27.4", reason: "Di atas ambang ideal, tetap valid untuk import." }] },
  { id: "row-3", entity: "psikotes", status: "valid", values: { nrp: "522884", nama: "Letkol Pnb Chandra H.", tanggal: "2024-04-21", stress_index: 54, atensi: 71, stabilitas_emosi: 67 }, issues: [] },
  { id: "row-4", entity: "jam_terbang", status: "error", values: { nrp: "", jenis_pesawat: "CN-295", durasi_jam: 3.8, malam: "tidak" }, issues: [{ field: "nrp", rawValue: "", reason: "NRP kosong dan nama tidak cukup untuk pencocokan penerbang." }] },
];

export const importHistory: ImportJobHistory[] = [
  { id: "IMP-20260811-001", filename: "mcu_messy_2016_2026.xlsx", filetype: "xlsx", status: "committed", totalRows: 148, inserted: 121, updated: 19, skipped: 8, failed: 0, createdAt: "2026-08-11T08:20:00Z", user: "Kolonel Kes Dr. Raka" },
  { id: "IMP-20260810-004", filename: "catatan_psikologi_naratif.docx", filetype: "docx", status: "validated", totalRows: 42, inserted: 0, updated: 0, skipped: 0, failed: 3, createdAt: "2026-08-10T13:40:00Z", user: "Mayor Kes dr. Mira" },
  { id: "IMP-20260809-002", filename: "logbook_campuran.xls", filetype: "xls", status: "committed", totalRows: 231, inserted: 206, updated: 12, skipped: 9, failed: 4, createdAt: "2026-08-09T04:15:00Z", user: "Kapten Sus Analis Bima" },
];

export const coxValidationResult: CoxValidationResult = {
  jobId: "VAL-20260811-001",
  modelName: "Cox kelaikan terbang v1.0",
  generatedAt: "2026-08-11T09:10:00Z",
  overallStatus: "warning",
  summary: {
    phStatus: "warning",
    globalSchoenfeldP: 0.118,
    epv: 7.5,
    epvStatus: "warning",
    events: 45,
    parameters: 6,
    cIndex: 0.78,
    cIndexCiLow: 0.72,
    cIndexCiHigh: 0.84,
    missingPercent: 6.8,
    brierScore: 0.142,
    calibrationSlope: 0.91,
  },
  interpretations: {
    ph: "Uji global Schoenfeld p = 0,118 (> 0,05) menunjukkan asumsi proportional hazards secara global masih terpenuhi. Namun kovariat stress index menunjukkan sinyal pelanggaran ringan sehingga disarankan uji model dengan koefisien time-varying atau stratifikasi sensitivitas.",
    missing: "Proporsi missing total 6,8% berada pada tingkat moderat. Little's MCAR p = 0,031 mengindikasikan missingness tidak sepenuhnya acak; pembanding MICE perlu dilaporkan bersama complete-case analysis.",
    epv: "Jumlah event = 45 dan parameter = 6 menghasilkan EPV = 7,5. Kategori hati-hati; model masih dapat dipakai untuk eksplorasi terkontrol, tetapi disarankan penalized Cox atau reduksi kovariat untuk analisis konfirmatori.",
    discrimination: "C-index = 0,78 (CI 95% 0,72-0,84) menunjukkan kemampuan diskriminasi baik. AUC time-dependent stabil pada horizon 1-5 tahun, dengan Brier score 0,142 yang masih dapat diterima.",
    bootstrap: "Bootstrap internal menunjukkan optimism C-index 0,03 dan corrected C-index 0,75. Calibration slope 0,91 menandakan overfitting ringan namun belum berat.",
    residuals: "Residual martingale tidak menunjukkan pola nonlinier ekstrem, tetapi observasi P-007 memiliki DFBETA tinggi dan perlu review klinis-operasional sebelum finalisasi model.",
  },
  ph: {
    covariates: [
      { covariate: "Usia > 40 tahun", chiSquare: 2.11, pValue: 0.146, timeInteractionP: 0.184, status: "pass", recommendation: "Tidak perlu koreksi PH khusus." },
      { covariate: "BMI >= 27", chiSquare: 1.72, pValue: 0.189, timeInteractionP: 0.221, status: "pass", recommendation: "Pertahankan sebagai kovariat tetap." },
      { covariate: "Kolesterol >= 220", chiSquare: 3.04, pValue: 0.081, timeInteractionP: 0.097, status: "warning", recommendation: "Laporkan sensitivitas atau gunakan spline waktu bila diperlukan." },
      { covariate: "Stress index tinggi", chiSquare: 5.52, pValue: 0.019, timeInteractionP: 0.027, status: "fail", recommendation: "Pertimbangkan time-varying coefficient atau stratifikasi." },
      { covariate: "VO2max baik", chiSquare: 0.84, pValue: 0.361, timeInteractionP: 0.408, status: "pass", recommendation: "Efek protektif stabil terhadap waktu." },
      { covariate: "Jam terbang stabil", chiSquare: 2.58, pValue: 0.108, timeInteractionP: 0.132, status: "warning", recommendation: "Monitor pada horizon > 72 bulan." },
    ],
    residuals: Array.from({ length: 13 }, (_, index) => {
      const time = index * 10;
      return [
        { time, covariate: "Stress index tinggi", value: Math.sin(index / 2) * 0.18 + index * 0.018 - 0.08, trend: index * 0.018 - 0.05 },
        { time, covariate: "BMI >= 27", value: Math.cos(index / 2) * 0.11 - index * 0.002 + 0.02, trend: 0.015 - index * 0.002 },
      ];
    }).flat(),
    lml: Array.from({ length: 10 }, (_, index) => ({
      time: (index + 1) * 12,
      lowRisk: -2.8 + index * 0.22,
      highRisk: -2.05 + index * 0.25 + (index > 6 ? index * 0.035 : 0),
    })),
  },
  missing: {
    littlePValue: 0.031,
    variables: [
      { variable: "VO2max", missingPercent: 12.4, mechanism: "MAR", action: "Gunakan MICE dan laporkan pooled HR." },
      { variable: "Kolesterol", missingPercent: 8.7, mechanism: "MAR", action: "Imputasi berdasarkan usia, BMI, dan status MCU." },
      { variable: "Stress index", missingPercent: 5.2, mechanism: "MCAR", action: "Complete-case masih wajar sebagai pembanding." },
      { variable: "Jam malam", missingPercent: 3.1, mechanism: "MNAR indikatif", action: "Review sumber logbook dan lakukan sensitivity analysis." },
    ],
    heatmap: Array.from({ length: 12 }, (_, rowIndex) =>
      ["VO2max", "Kolesterol", "Stress index", "Jam malam", "BMI"].map((variable, colIndex) => ({
        row: `R${rowIndex + 1}`,
        variable,
        missing: (rowIndex + colIndex * 2) % 7 === 0 || (variable === "VO2max" && rowIndex % 5 === 0),
      })),
    ).flat(),
    comparison: [
      { covariate: "Usia > 40 tahun", completeCaseHr: 1.86, miceHr: 1.82, deltaPercent: -2.2, conclusion: "Stabil" },
      { covariate: "BMI >= 27", completeCaseHr: 1.58, miceHr: 1.51, deltaPercent: -4.4, conclusion: "Stabil" },
      { covariate: "Kolesterol >= 220", completeCaseHr: 1.81, miceHr: 1.67, deltaPercent: -7.7, conclusion: "Sensitif ringan" },
      { covariate: "Stress index tinggi", completeCaseHr: 2.13, miceHr: 1.94, deltaPercent: -8.9, conclusion: "Sensitif ringan" },
    ],
  },
  epv: {
    recommendation: "EPV 7,5 menuntut pelaporan kehati-hatian. Untuk sidang akademik, jalankan model penalized Cox dan bandingkan koefisien utama.",
    vif: [
      { variable: "Usia", vif: 1.8, status: "pass" },
      { variable: "BMI", vif: 2.4, status: "pass" },
      { variable: "Kolesterol", vif: 3.1, status: "warning" },
      { variable: "Stress index", vif: 2.7, status: "pass" },
      { variable: "Jam terbang", vif: 4.8, status: "warning" },
      { variable: "VO2max", vif: 2.2, status: "pass" },
    ],
  },
  discrimination: {
    auc: [
      { year: 1, auc: 0.76, ciLow: 0.69, ciHigh: 0.83 },
      { year: 3, auc: 0.79, ciLow: 0.73, ciHigh: 0.85 },
      { year: 5, auc: 0.77, ciLow: 0.70, ciHigh: 0.84 },
    ],
    calibration: [
      { group: "Q1", predicted: 0.91, observed: 0.93 },
      { group: "Q2", predicted: 0.84, observed: 0.82 },
      { group: "Q3", predicted: 0.76, observed: 0.74 },
      { group: "Q4", predicted: 0.62, observed: 0.59 },
      { group: "Q5", predicted: 0.48, observed: 0.52 },
    ],
  },
  bootstrap: {
    metrics: [
      { metric: "C-index", apparent: 0.78, optimism: 0.03, corrected: 0.75, interpretation: "Diskriminasi tetap baik setelah koreksi optimism." },
      { metric: "Calibration slope", apparent: 0.96, optimism: 0.05, corrected: 0.91, interpretation: "Overfitting ringan, perlu shrinkage bila model final." },
      { metric: "Brier score", apparent: 0.142, optimism: -0.006, corrected: 0.148, interpretation: "Error prediksi masih dapat diterima." },
    ],
  },
  residuals: {
    points: penerbang.flatMap((pilot, index) => [
      { pilotId: pilot.id, time: 12 + index * 10, martingale: -0.42 + index * 0.12, deviance: -0.82 + index * 0.21, dfbeta: 0.03 + index * 0.025, covariate: "Stress index" },
      { pilotId: pilot.id, time: 18 + index * 8, martingale: 0.36 - index * 0.08, deviance: 0.68 - index * 0.13, dfbeta: 0.04 + index * 0.018, covariate: "BMI" },
    ]),
    influential: [
      { pilotId: "P-007", name: "Mayor Pnb Galih N.", dfbetaMax: 0.31, driver: "Stress index tinggi + event dini", action: "Review data psikotes dan tanggal event." },
      { pilotId: "P-003", name: "Letkol Pnb Chandra H.", dfbetaMax: 0.24, driver: "Kolesterol dan BMI tinggi", action: "Cek konsistensi MCU longitudinal." },
      { pilotId: "P-005", name: "Kolonel Pnb Eko P.", dfbetaMax: 0.19, driver: "Jam terbang sangat tinggi", action: "Analisis sensitivitas tanpa observasi ini." },
    ],
  },
};

export const validationHistory: ValidationJobHistory[] = [
  { id: "VAL-20260811-001", modelName: "Cox kelaikan terbang v1.0", status: "completed", phStatus: "warning", epvValue: 7.5, cIndex: 0.78, createdAt: "2026-08-11T09:10:00Z", user: "Kolonel Kes Dr. Raka" },
  { id: "VAL-20260808-003", modelName: "Cox complete-case 2021-2026", status: "completed", phStatus: "pass", epvValue: 9.2, cIndex: 0.74, createdAt: "2026-08-08T07:45:00Z", user: "Kapten Sus Analis Bima" },
  { id: "VAL-20260802-002", modelName: "Cox high-risk tempur", status: "completed", phStatus: "fail", epvValue: 4.6, cIndex: 0.81, createdAt: "2026-08-02T11:30:00Z", user: "Mayor Kes dr. Mira" },
];

const distributedSubtasks: DistributedSubtask[] = Array.from({ length: 12 }, (_, index) => {
  const worker = `worker-${(index % 4) + 1}`;
  return {
    id: `ST-${String(index + 1).padStart(3, "0")}`,
    jobId: "JOB-BOOT-20260811-001",
    workerId: worker,
    status: index === 7 ? "retrying" : index < 10 ? "completed" : "running",
    taskType: "bootstrap_chunk_100",
    startedAt: `2026-08-11T09:${String(10 + index).padStart(2, "0")}:00Z`,
    finishedAt: index < 10 ? `2026-08-11T09:${String(10 + index).padStart(2, "0")}:21Z` : undefined,
    durationMs: 18400 + index * 820,
    attempt: index === 7 ? 2 : 1,
  };
});

export const distributedClusterSnapshot: DistributedClusterSnapshot = {
  generatedAt: "2026-08-11T09:26:00Z",
  queueLength: 6,
  deadLetterCount: 1,
  activeWorkers: 4,
  throughput: 3.8,
  p95LatencyMs: 920,
  workers: [
    { id: "gateway-php-1", hostname: "csakt-gateway", role: "gateway", status: "online", currentTask: "orchestrate_jobs", queue: "-", heartbeat: "2026-08-11T09:26:00Z", cpuLoad: 18, memoryMb: 192 },
    { id: "redis-1", hostname: "csakt-redis", role: "broker", status: "online", currentTask: "queue:cox.bootstrap", queue: "cox.bootstrap", heartbeat: "2026-08-11T09:26:00Z", cpuLoad: 11, memoryMb: 84 },
    { id: "coordinator-1", hostname: "csakt-coordinator", role: "coordinator", status: "busy", currentTask: "reduce_bootstrap", queue: "cox.results", heartbeat: "2026-08-11T09:25:58Z", cpuLoad: 44, memoryMb: 256 },
    { id: "worker-1", hostname: "csakt-worker-1", role: "worker", status: "busy", currentTask: "bootstrap chunk 901-1000", queue: "cox.bootstrap", heartbeat: "2026-08-11T09:25:59Z", cpuLoad: 71, memoryMb: 612 },
    { id: "worker-2", hostname: "csakt-worker-2", role: "worker", status: "busy", currentTask: "MICE chain 4", queue: "cox.missing", heartbeat: "2026-08-11T09:25:57Z", cpuLoad: 64, memoryMb: 544 },
    { id: "worker-3", hostname: "csakt-worker-3", role: "worker", status: "degraded", currentTask: "retry PH residual chunk", queue: "cox.ph", heartbeat: "2026-08-11T09:25:30Z", cpuLoad: 92, memoryMb: 702 },
    { id: "worker-4", hostname: "csakt-worker-4", role: "worker", status: "busy", currentTask: "bootstrap chunk 701-800", queue: "cox.bootstrap", heartbeat: "2026-08-11T09:25:58Z", cpuLoad: 69, memoryMb: 588 },
    { id: "mysql-1", hostname: "csakt-mysql", role: "database", status: "online", currentTask: "persist_results", queue: "-", heartbeat: "2026-08-11T09:26:00Z", cpuLoad: 23, memoryMb: 890 },
  ],
  jobs: [
    {
      id: "JOB-BOOT-20260811-001",
      type: "bootstrap_validation",
      status: "running",
      totalSubtasks: 12,
      completedSubtasks: 10,
      failedSubtasks: 1,
      progress: 83,
      startedAt: "2026-08-11T09:10:00Z",
      speedup: 3.42,
      singleNodeSeconds: 312,
      distributedSeconds: 91,
      resultSummary: "Optimism-corrected C-index sementara 0,75; 1 subtask retry karena worker-3 timeout.",
      subtasks: distributedSubtasks,
    },
    {
      id: "JOB-FED-20260811-002",
      type: "federated_aggregation",
      status: "completed",
      totalSubtasks: 4,
      completedSubtasks: 4,
      failedSubtasks: 0,
      progress: 100,
      startedAt: "2026-08-11T08:50:00Z",
      finishedAt: "2026-08-11T08:51:34Z",
      speedup: 2.1,
      singleNodeSeconds: 74,
      distributedSeconds: 35,
      resultSummary: "Agregasi sufficient statistics dari 4 skadron selesai tanpa memindahkan raw data medis.",
      subtasks: [],
    },
  ],
  metrics: [
    { time: "09:20", queueLength: 18, jobsPerSecond: 1.9, latencyMs: 1320 },
    { time: "09:21", queueLength: 15, jobsPerSecond: 2.4, latencyMs: 1180 },
    { time: "09:22", queueLength: 11, jobsPerSecond: 3.1, latencyMs: 1010 },
    { time: "09:23", queueLength: 9, jobsPerSecond: 3.5, latencyMs: 970 },
    { time: "09:24", queueLength: 7, jobsPerSecond: 3.6, latencyMs: 940 },
    { time: "09:25", queueLength: 6, jobsPerSecond: 3.8, latencyMs: 920 },
  ],
  benchmark: [
    { workers: 1, seconds: 312, speedup: 1, efficiency: 1 },
    { workers: 2, seconds: 166, speedup: 1.88, efficiency: 0.94 },
    { workers: 4, seconds: 91, speedup: 3.42, efficiency: 0.86 },
    { workers: 8, seconds: 58, speedup: 5.38, efficiency: 0.67 },
  ],
  logs: [
    { timestamp: "09:10:01", workerId: "coordinator-1", event: "split", detail: "Bootstrap 1000 resample dibagi menjadi 10 chunk x 100." },
    { timestamp: "09:10:04", workerId: "worker-1", event: "claim", detail: "Mengambil subtask ST-001 dari queue cox.bootstrap." },
    { timestamp: "09:10:05", workerId: "worker-2", event: "claim", detail: "Mengambil subtask ST-002 dari queue cox.bootstrap." },
    { timestamp: "09:11:16", workerId: "worker-3", event: "timeout", detail: "Heartbeat terlambat; subtask ST-008 dikembalikan ke queue." },
    { timestamp: "09:11:18", workerId: "worker-4", event: "retry", detail: "ST-008 di-claim ulang attempt=2." },
    { timestamp: "09:12:45", workerId: "coordinator-1", event: "reduce", detail: "Menggabungkan C-index partial dan menghitung optimism." },
  ],
  federated: [
    { node: "node-skadron-3", skadron: "Skadron Udara 3", localRows: 184, events: 14, sufficientStats: "X'X, X'y, event_count", sharedRawData: false },
    { node: "node-skadron-31", skadron: "Skadron Udara 31", localRows: 206, events: 17, sufficientStats: "X'X, X'y, event_count", sharedRawData: false },
    { node: "node-skadron-8", skadron: "Skadron Udara 8", localRows: 96, events: 9, sufficientStats: "X'X, X'y, event_count", sharedRawData: false },
    { node: "node-wing-1", skadron: "Wing Udara 1", localRows: 122, events: 5, sufficientStats: "X'X, X'y, event_count", sharedRawData: false },
  ],
  narrative: "CSAKT memenuhi definisi sub-sistem AI terdistribusi karena gateway PHP hanya berperan sebagai orkestrator, sedangkan komputasi Cox dibagi menjadi subtask melalui Redis queue dan diproses paralel oleh banyak worker Python. Coordinator melakukan reduce terhadap hasil parsial bootstrap dan federated aggregation menggabungkan sufficient statistics dari node skadron tanpa memindahkan raw data medis. Fault tolerance dibuktikan oleh retry ST-008 saat worker-3 timeout dan job tetap berjalan melalui worker lain.",
};
