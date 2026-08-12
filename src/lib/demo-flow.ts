import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";

export const demoSidangSteps = [
  {
    label: "Import data dummy",
    path: "/import",
    description: "Preview file dummy XLSX/DOCX, auto-mapping, dan validasi baris import.",
  },
  {
    label: "Validasi data sebelum analitik",
    path: "/analitik/quality-gate",
    description: "Quality gate memeriksa missingness, duplikasi, tanggal, outlier MCU, psikotes, dan jam terbang ekstrem.",
  },
  {
    label: "Validasi Cox",
    path: "/analitik/validasi",
    description: "Uji PH, EPV, missing data, bootstrap, diskriminasi, kalibrasi, dan residual model.",
  },
  {
    label: "Survival analysis",
    path: "/analitik/survival",
    description: "Kurva Kaplan-Meier, tabel hazard ratio, dan forest plot faktor determinan.",
  },
  {
    label: "Detail penerbang",
    path: "/penerbang/P-007",
    description: "Audit trail, explainability, dan export laporan individual untuk flight surgeon.",
  },
  {
    label: "Cluster job terdistribusi",
    path: "/sistem/terdistribusi",
    description: "Topologi node, worker, queue, map-reduce bootstrap, dan fault tolerance.",
  },
] as const;

export function startDemoSidang(navigate: NavigateFunction) {
  toast.success("Mode Demo Sidang dimulai");
  let elapsed = 0;
  demoSidangSteps.forEach((step, index) => {
    elapsed += index === 0 ? 450 : 4400;
    window.setTimeout(() => {
      toast.message(`${index + 1}/${demoSidangSteps.length} - ${step.label}`, {
        description: step.description,
      });
      navigate(step.path);
    }, elapsed);
  });
}
