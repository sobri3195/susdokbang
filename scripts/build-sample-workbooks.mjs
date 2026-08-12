import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.resolve(".");
const outDir = path.join(root, "samples");
await fs.mkdir(outDir, { recursive: true });

async function buildMcuWorkbook() {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add("LAKESPRA MCU");
  sheet.showGridLines = false;
  sheet.getRange("A1:F1").merge();
  sheet.getRange("A1").values = [["LOGO LAKESPRA - REKAP PEMERIKSAAN KESEHATAN PENERBANG"]];
  sheet.getRange("A2:F2").merge();
  sheet.getRange("A2").values = [["Periode 2016 s.d 2026 - ada merged cells, catatan kaki, dan header typo"]];
  sheet.getRange("A4:F11").values = [
    ["", "", "", "", "", ""],
    ["No", "NRP / Nama", "Tgl MCU", "TD", "Kolestrol", "BMI"],
    [1, "529701 - Mayor Pnb Aditya W.", "12 Maret 2016", "120/80", "178 mg/dL", "23,8"],
    [2, "531115 - Kapten Pnb Bagas R.", "03/06/17", "132 / 86", "214", "27.4"],
    ["subtotal", "", "", "", "", ""],
    [3, "522884 - Letkol Pnb Chandra H.", "2018-11-08", "140/92", "232 mg/dL", "29,1"],
    ["Catatan kaki: nilai kolestrol belum semuanya tervalidasi", "", "", "", "", ""],
    [4, "527334 - Mayor Pnb Galih N.", "32/13/2024", "120-80", "abc", "300"],
  ];
  sheet.getRange("A1:F2").format = { fill: "#E8EEF5", font: { bold: true, color: "#0B2545" } };
  sheet.getRange("A5:F5").format = { fill: "#0F3A66", font: { bold: true, color: "#FFFFFF" } };
  sheet.getRange("A5:F11").format.borders = { preset: "outside", style: "thin", color: "#CBD5E1" };
  sheet.getRange("C6:C9").format.numberFormat = "yyyy-mm-dd";
  sheet.getRange("A:F").format.autofitColumns();
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(path.join(outDir, "mcu_messy_2016_2026.xlsx"));
}

async function buildLogbookWorkbook() {
  const workbook = Workbook.create();
  const first = workbook.worksheets.add("Cover");
  first.getRange("A1:D1").merge();
  first.getRange("A1").values = [["REKAP LOGBOOK CAMPURAN - sheet data ada di Sheet2"]];
  first.getRange("A3:D4").values = [
    ["dibuat oleh", "operator", "", ""],
    ["catatan", "file ini sengaja tidak konsisten", "", ""],
  ];

  const sheet = workbook.worksheets.add("Sheet2");
  sheet.getRange("A1:D1").merge();
  sheet.getRange("A1").values = [["rekap jam terbang"]];
  sheet.getRange("A2:D8").values = [
    ["subtotal triwulan - jangan import", "", "", ""],
    ["NRP", "Jenis pswt", "jam total", "misi mlm"],
    ["529701", "F-16 C/D", "2,4 jam", "tidak"],
    ["531115", "C-130H", "5.6", "ya"],
    ["", "CN-295", "3,8 jam", "tidak"],
    ["527334", "NAS332", "dua jam", "Y"],
    ["footer", "sumber: logbook manual", "", ""],
  ];
  sheet.getRange("A3:D3").format = { fill: "#155E75", font: { bold: true, color: "#FFFFFF" } };
  sheet.getRange("A:D").format.autofitColumns();
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(path.join(outDir, "logbook_campuran.xlsx"));
}

await buildMcuWorkbook();
await buildLogbookWorkbook();
console.log("sample workbooks created");
