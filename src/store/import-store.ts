import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ImportCleanRow, ImportDetectedTable, ImportMapping, ImportUploadedFile } from "@/lib/types";

type ImportWizardStep = "upload" | "preview" | "mapping" | "validate";

type ImportState = {
  step: ImportWizardStep;
  importId: string | null;
  files: ImportUploadedFile[];
  detectedTables: ImportDetectedTable[];
  mappings: ImportMapping[];
  cleanRows: ImportCleanRow[];
  setStep: (step: ImportWizardStep) => void;
  setImportId: (importId: string | null) => void;
  setFiles: (files: ImportUploadedFile[]) => void;
  setDetectedTables: (tables: ImportDetectedTable[]) => void;
  setMappings: (mappings: ImportMapping[]) => void;
  setCleanRows: (rows: ImportCleanRow[]) => void;
  reset: () => void;
};

const initial = {
  step: "upload" as ImportWizardStep,
  importId: null,
  files: [],
  detectedTables: [],
  mappings: [],
  cleanRows: [],
};

export const useImportStore = create<ImportState>()(
  persist(
    (set) => ({
      ...initial,
      setStep: (step) => set({ step }),
      setImportId: (importId) => set({ importId }),
      setFiles: (files) => set({ files }),
      setDetectedTables: (detectedTables) => set({ detectedTables }),
      setMappings: (mappings) => set({ mappings }),
      setCleanRows: (cleanRows) => set({ cleanRows }),
      reset: () => set(initial),
    }),
    { name: "csakt-import-wizard" },
  ),
);
