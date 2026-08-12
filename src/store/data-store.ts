import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jamTerbangRecords, mcuRecords, penerbang, psikotesRecords } from "@/lib/mock-data";
import type { JamTerbangRecord, McuRecord, Penerbang, PsikotesRecord } from "@/lib/types";

type DataState = {
  penerbang: Penerbang[];
  mcu: McuRecord[];
  psikotes: PsikotesRecord[];
  jamTerbang: JamTerbangRecord[];
  upsertPenerbang: (row: Penerbang) => void;
  deletePenerbang: (id: string) => void;
  upsertMcu: (row: McuRecord) => void;
  deleteMcu: (id: string) => void;
  upsertPsikotes: (row: PsikotesRecord) => void;
  deletePsikotes: (id: string) => void;
  upsertJamTerbang: (row: JamTerbangRecord) => void;
  deleteJamTerbang: (id: string) => void;
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
      resetDemoData: () => set({ penerbang, mcu: mcuRecords, psikotes: psikotesRecords, jamTerbang: jamTerbangRecords }),
    }),
    { name: "csakt-demo-data" },
  ),
);
