import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jamTerbangRecords, mcuRecords, penerbang, psikotesRecords } from "@/lib/mock-data";
import type { JamTerbangRecord, McuRecord, Penerbang, PreAssessment, PsikotesRecord } from "@/lib/types";

const initialPreAssessments: PreAssessment[] = [
  {
    id: "PA-2026-0812-01", penerbangId: "P-001", examinationType: "Berkala", plannedDate: "2026-08-15",
    status: "submitted", completion: 100, complaints: "Sakit kepala ringan setelah dua penerbangan malam.",
    medications: "Tidak ada", sleepHours: 5, fatigue: true, wellbeingConcern: false, documentsComplete: true,
    consent: true, priority: "review", flags: ["Tidur kurang dari 6 jam", "Fatigue setelah tugas malam"],
    pilotSubmittedAt: "2026-08-12T07:45:00Z", updatedAt: "2026-08-12T07:45:00Z",
  },
  {
    id: "PA-2026-0811-04", penerbangId: "P-003", examinationType: "Kembali bertugas", plannedDate: "2026-08-14",
    status: "verified", completion: 100, complaints: "Tidak ada keluhan aktif.", medications: "Vitamin harian",
    sleepHours: 7, fatigue: false, wellbeingConcern: false, documentsComplete: true, consent: true, priority: "normal",
    flags: [], pilotSubmittedAt: "2026-08-11T10:10:00Z", officerName: "Sertu Kes Nadia",
    officerNote: "Identitas, surat rujukan, dan daftar obat telah dicocokkan.", officerVerifiedAt: "2026-08-11T13:20:00Z",
    updatedAt: "2026-08-11T13:20:00Z",
  },
];

type DataState = {
  penerbang: Penerbang[];
  mcu: McuRecord[];
  psikotes: PsikotesRecord[];
  jamTerbang: JamTerbangRecord[];
  preAssessments: PreAssessment[];
  upsertPenerbang: (row: Penerbang) => void;
  deletePenerbang: (id: string) => void;
  upsertMcu: (row: McuRecord) => void;
  deleteMcu: (id: string) => void;
  upsertPsikotes: (row: PsikotesRecord) => void;
  deletePsikotes: (id: string) => void;
  upsertJamTerbang: (row: JamTerbangRecord) => void;
  deleteJamTerbang: (id: string) => void;
  upsertPreAssessment: (row: PreAssessment) => void;
  resetDemoData: () => void;
};

function upsertById<T extends { id: string }>(rows: T[], row: T) {
  return rows.some((item) => item.id === row.id)
    ? rows.map((item) => (item.id === row.id ? row : item))
    : [row, ...rows];
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      penerbang,
      mcu: mcuRecords,
      psikotes: psikotesRecords,
      jamTerbang: jamTerbangRecords,
      preAssessments: initialPreAssessments,
      upsertPenerbang: (row) => set((state) => ({ penerbang: upsertById(state.penerbang, row) })),
      deletePenerbang: (id) =>
        set((state) => ({
          penerbang: state.penerbang.filter((item) => item.id !== id),
          mcu: state.mcu.filter((item) => item.penerbangId !== id),
          psikotes: state.psikotes.filter((item) => item.penerbangId !== id),
          jamTerbang: state.jamTerbang.filter((item) => item.penerbangId !== id),
        })),
      upsertMcu: (row) => set((state) => ({ mcu: upsertById(state.mcu, row) })),
      deleteMcu: (id) => set((state) => ({ mcu: state.mcu.filter((item) => item.id !== id) })),
      upsertPsikotes: (row) => set((state) => ({ psikotes: upsertById(state.psikotes, row) })),
      deletePsikotes: (id) => set((state) => ({ psikotes: state.psikotes.filter((item) => item.id !== id) })),
      upsertJamTerbang: (row) => set((state) => ({ jamTerbang: upsertById(state.jamTerbang, row) })),
      deleteJamTerbang: (id) => set((state) => ({ jamTerbang: state.jamTerbang.filter((item) => item.id !== id) })),
      upsertPreAssessment: (row) => set((state) => ({ preAssessments: upsertById(state.preAssessments, row) })),
      resetDemoData: () => set({ penerbang, mcu: mcuRecords, psikotes: psikotesRecords, jamTerbang: jamTerbangRecords, preAssessments: initialPreAssessments }),
    }),
    { name: "csakt-demo-data" },
  ),
);
