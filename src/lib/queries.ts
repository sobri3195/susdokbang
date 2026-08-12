import {
  coxResults,
  coxValidationResult,
  distributedClusterSnapshot,
  importCleanRows,
  importDetectedTables,
  importHistory,
  importMappings,
  jamTerbangRecords,
  mcuRecords,
  penerbang,
  psikotesRecords,
  survivalCurve,
  validationHistory,
  yearlyTrend,
} from "@/lib/mock-data";
import { useDataStore } from "@/store/data-store";

const delayed = async <T,>(value: T, ms = 280): Promise<T> =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });

export const queryFns = {
  dashboard: () => delayed({ penerbang: useDataStore.getState().penerbang, yearlyTrend, coxResults, survivalCurve }),
  penerbang: () => delayed(useDataStore.getState().penerbang),
  mcu: () => delayed(useDataStore.getState().mcu),
  psikotes: () => delayed(useDataStore.getState().psikotes),
  jamTerbang: () => delayed(useDataStore.getState().jamTerbang),
  survival: () => delayed({ coxResults, survivalCurve }),
  importPreview: () => delayed({ detectedTables: importDetectedTables, mappings: importMappings }),
  importValidate: () => delayed({ rows: importCleanRows }),
  importHistory: () => delayed(importHistory),
  validationResult: () => delayed(coxValidationResult),
  validationHistory: () => delayed(validationHistory),
  distributedCluster: () => delayed(distributedClusterSnapshot, 450),
};
