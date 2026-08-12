import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock3, FileCheck2, HeartPulse, ShieldCheck, Stethoscope, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PreAssessment, PreAssessmentStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";

const statusMeta: Record<PreAssessmentStatus, { label: string; variant: "secondary" | "warning" | "info" | "success" }> = {
  draft: { label: "Draf penerbang", variant: "secondary" },
  submitted: { label: "Menunggu verifikasi", variant: "warning" },
  needs_revision: { label: "Perlu dilengkapi", variant: "warning" },
  verified: { label: "Menunggu dokter", variant: "info" },
  reviewed: { label: "Ditinjau dokter", variant: "success" },
};

export function PreAssessmentPage() {
  const assessments = useDataStore((state) => state.preAssessments);
  const pilots = useDataStore((state) => state.penerbang);
  const upsert = useDataStore((state) => state.upsertPreAssessment);
  const user = useAuthStore((state) => state.user);
  const [selectedId, setSelectedId] = useState(assessments[0]?.id ?? "");
  const [filter, setFilter] = useState("all");
  const selected = assessments.find((item) => item.id === selectedId) ?? assessments[0];
  const visible = useMemo(() => assessments.filter((item) => filter === "all" || item.status === filter), [assessments, filter]);

  const totals = {
    submitted: assessments.filter((item) => item.status === "submitted").length,
    verified: assessments.filter((item) => item.status === "verified").length,
    flagged: assessments.filter((item) => item.flags.length > 0).length,
    reviewed: assessments.filter((item) => item.status === "reviewed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Model C — Hybrid"
        title="Pre-Assessment Pemeriksaan"
        description="Penerbang mengisi informasi awal, petugas memverifikasi kelengkapan, lalu dokter meninjau flag dan menetapkan rencana pemeriksaan. Hasil triase bukan keputusan kelaikan."
        actions={<Button variant="accent" onClick={() => createDraft(pilots[0]?.id, upsert, setSelectedId)}><ClipboardCheck />Buat pre-assessment</Button>}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Menunggu petugas" value={totals.submitted} icon={UserCheck} tone="text-amber-600" />
        <Metric label="Menunggu dokter" value={totals.verified} icon={Stethoscope} tone="text-sky-600" />
        <Metric label="Memiliki flag" value={totals.flagged} icon={AlertTriangle} tone="text-destructive" />
        <Metric label="Selesai ditinjau" value={totals.reviewed} icon={CheckCircle2} tone="text-success" />
      </div>

      <WorkflowBanner />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.45fr]">
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div><CardTitle>Antrean episode</CardTitle><CardDescription>Pilih episode untuk melanjutkan tahap aktif.</CardDescription></div>
              <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="all">Semua</SelectItem><SelectItem value="submitted">Verifikasi</SelectItem><SelectItem value="verified">Review dokter</SelectItem><SelectItem value="reviewed">Selesai</SelectItem>
              </SelectContent></Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {visible.map((item) => {
              const pilot = pilots.find((candidate) => candidate.id === item.penerbangId);
              return <button key={item.id} onClick={() => setSelectedId(item.id)} className={cn("w-full rounded-xl border p-4 text-left transition hover:border-accent/60", selected?.id === item.id && "border-accent bg-accent/5 ring-1 ring-accent/30")}>
                <div className="flex items-center justify-between gap-2"><span className="font-bold">{pilot?.nama ?? item.penerbangId}</span><Badge variant={statusMeta[item.status].variant}>{statusMeta[item.status].label}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{pilot?.nrp} · {item.examinationType} · {formatDate(item.plannedDate)}</p>
                <div className="mt-3 flex items-center gap-2 text-xs"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-accent" style={{ width: `${item.completion}%` }} /></span><span className="tabular font-semibold">{item.completion}%</span></div>
              </button>;
            })}
          </CardContent>
        </Card>

        {selected ? <EpisodeWorkspace key={selected.id} assessment={selected} onSave={upsert} currentUser={user?.name ?? "Petugas CSAKT"} /> : null}
      </div>
    </div>
  );
}

function WorkflowBanner() {
  const steps = [
    { label: "Penerbang mengisi", icon: ClipboardCheck, text: "Keluhan, obat, tidur, fatigue, dokumen & persetujuan" },
    { label: "Petugas verifikasi", icon: UserCheck, text: "Cocokkan identitas, bukti, kelengkapan & klarifikasi" },
    { label: "Dokter meninjau", icon: Stethoscope, text: "Tinjau flag, beri rencana dan lanjutkan pemeriksaan" },
  ];
  return <Card className="aero-panel overflow-hidden"><CardContent className="grid gap-3 p-4 md:grid-cols-3">
    {steps.map((step, index) => <div key={step.label} className="relative rounded-xl border bg-card/80 p-4">
      <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-accent/12 font-bold text-accent">{index + 1}</span><step.icon className="size-5 text-accent" /><p className="font-bold">{step.label}</p></div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.text}</p>
    </div>)}
  </CardContent></Card>;
}

function EpisodeWorkspace({ assessment, onSave, currentUser }: { assessment: PreAssessment; onSave: (row: PreAssessment) => void; currentUser: string }) {
  const pilot = useDataStore((state) => state.penerbang.find((item) => item.id === assessment.penerbangId));
  const [officerNote, setOfficerNote] = useState(assessment.officerNote ?? "");
  const [doctorPlan, setDoctorPlan] = useState(assessment.doctorPlan ?? "");
  const [revisionNote, setRevisionNote] = useState(assessment.revisionNote ?? "");
  const [pilotAnswers, setPilotAnswers] = useState({
    complaints: assessment.complaints,
    medications: assessment.medications,
    sleepHours: assessment.sleepHours,
    fatigue: assessment.fatigue,
    wellbeingConcern: assessment.wellbeingConcern,
    documentsComplete: assessment.documentsComplete,
    consent: assessment.consent,
  });

  const save = (patch: Partial<PreAssessment>, message: string) => {
    onSave({ ...assessment, ...patch, updatedAt: new Date().toISOString() });
    toast.success(message);
  };

  return <div className="space-y-5">
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle>{pilot?.nama} <span className="font-normal text-muted-foreground">· {pilot?.nrp}</span></CardTitle><CardDescription>{assessment.id} · {assessment.examinationType} · Rencana {formatDate(assessment.plannedDate)}</CardDescription></div>
          <div className="flex gap-2"><Badge variant={assessment.priority === "high" ? "danger" : assessment.priority === "review" ? "warning" : "success"}>{assessment.priority === "normal" ? "Prioritas normal" : assessment.priority === "review" ? "Perlu review" : "Prioritas tinggi"}</Badge><Badge variant={statusMeta[assessment.status].variant}>{statusMeta[assessment.status].label}</Badge></div>
        </div>
      </CardHeader>
      <CardContent><StageTracker status={assessment.status} /></CardContent>
    </Card>

    {assessment.status === "draft" || assessment.status === "needs_revision" ? <Card className="border-accent/40">
      <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-accent" />Tahap 1 · Diisi penerbang</CardTitle><CardDescription>Jawaban adalah self-report dan akan dikunci saat dikirim untuk verifikasi.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {assessment.revisionNote ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Perlu dilengkapi:</strong> {assessment.revisionNote}</div> : null}
        <div className="space-y-2"><Label htmlFor="pilot-complaints">Keluhan atau perubahan kesehatan sejak pemeriksaan terakhir</Label><textarea id="pilot-complaints" value={pilotAnswers.complaints} onChange={(e) => setPilotAnswers({ ...pilotAnswers, complaints: e.target.value })} className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Tuliskan keluhan, kapan mulai, dan dampaknya. Isi 'Tidak ada' bila tidak ada keluhan." /></div>
        <div className="space-y-2"><Label htmlFor="pilot-medication">Obat atau suplemen aktif</Label><Input id="pilot-medication" value={pilotAnswers.medications} onChange={(e) => setPilotAnswers({ ...pilotAnswers, medications: e.target.value })} placeholder="Nama, dosis, frekuensi; atau Tidak ada" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="sleep-hours">Durasi tidur terakhir (jam)</Label><Input id="sleep-hours" type="number" min="0" max="24" value={pilotAnswers.sleepHours || ""} onChange={(e) => setPilotAnswers({ ...pilotAnswers, sleepHours: Number(e.target.value) })} /></div>
          <div className="grid grid-cols-2 gap-2"><Toggle label="Merasa fatigue" active={pilotAnswers.fatigue} onClick={() => setPilotAnswers({ ...pilotAnswers, fatigue: !pilotAnswers.fatigue })} /><Toggle label="Perlu dukungan privat" active={pilotAnswers.wellbeingConcern} onClick={() => setPilotAnswers({ ...pilotAnswers, wellbeingConcern: !pilotAnswers.wellbeingConcern })} /></div></div>
        <div className="grid gap-2 sm:grid-cols-2"><Toggle label="Dokumen dinyatakan lengkap" active={pilotAnswers.documentsComplete} onClick={() => setPilotAnswers({ ...pilotAnswers, documentsComplete: !pilotAnswers.documentsComplete })} /><Toggle label="Setuju data dipakai untuk pemeriksaan" active={pilotAnswers.consent} onClick={() => setPilotAnswers({ ...pilotAnswers, consent: !pilotAnswers.consent })} /></div>
        <div className="flex justify-end"><Button disabled={!pilotAnswers.complaints.trim() || !pilotAnswers.medications.trim() || !pilotAnswers.sleepHours || !pilotAnswers.consent} onClick={() => {
          const flags = [pilotAnswers.sleepHours < 6 ? "Tidur kurang dari 6 jam" : "", pilotAnswers.fatigue ? "Fatigue dilaporkan" : "", pilotAnswers.wellbeingConcern ? "Meminta percakapan privat" : "", !pilotAnswers.documentsComplete ? "Dokumen belum lengkap" : ""].filter(Boolean);
          save({ ...pilotAnswers, status: "submitted", completion: 100, flags, priority: flags.length ? "review" : "normal", pilotSubmittedAt: new Date().toISOString(), revisionNote: undefined }, "Pre-assessment dikirim kepada petugas");
        }}><ClipboardCheck />Kirim & kunci jawaban</Button></div>
      </CardContent>
    </Card> : null}

    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="size-5 text-accent" />Ringkasan penerbang</CardTitle><CardDescription>Self-report terkunci setelah dikirim; revisi tercatat sebagai versi baru.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Answer label="Keluhan / perubahan kesehatan" value={assessment.complaints || "Tidak diisi"} wide />
          <Answer label="Obat & suplemen" value={assessment.medications || "Tidak diisi"} />
          <Answer label="Tidur terakhir" value={`${assessment.sleepHours} jam`} />
          <Answer label="Fatigue" value={assessment.fatigue ? "Dilaporkan" : "Tidak dilaporkan"} />
          <Answer label="Kekhawatiran kesejahteraan" value={assessment.wellbeingConcern ? "Perlu percakapan privat" : "Tidak dilaporkan"} />
          <Answer label="Dokumen" value={assessment.documentsComplete ? "Dinyatakan lengkap" : "Belum lengkap"} />
          <Answer label="Persetujuan" value={assessment.consent ? "Diberikan" : "Belum diberikan"} />
          <Answer label="Dikirim" value={assessment.pilotSubmittedAt ? new Date(assessment.pilotSubmittedAt).toLocaleString("id-ID") : "Belum dikirim"} />
        </CardContent>
      </Card>

      <Card className={assessment.flags.length ? "border-amber-300 dark:border-amber-800" : ""}>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-warning" />Flag yang dapat dijelaskan</CardTitle><CardDescription>Flag membantu prioritas review dan tidak menentukan kelaikan.</CardDescription></CardHeader>
        <CardContent className="space-y-3">{assessment.flags.length ? assessment.flags.map((flag) => <div key={flag} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{flag}</div>) : <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success"><CheckCircle2 />Tidak ada flag otomatis.</div>}</CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="size-5 text-accent" />Tahap 2 · Verifikasi petugas</CardTitle><CardDescription>Petugas memverifikasi kelengkapan; tidak membuat keputusan klinis.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3"><Check label="Identitas cocok" done={assessment.status === "verified" || assessment.status === "reviewed"} /><Check label="Dokumen diperiksa" done={assessment.documentsComplete} /><Check label="Jawaban terbaca" done={assessment.completion === 100} /></div>
        <div className="space-y-2"><Label htmlFor="officer-note">Catatan verifikasi</Label><textarea id="officer-note" value={officerNote} onChange={(e) => setOfficerNote(e.target.value)} className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Tuliskan hasil pencocokan dokumen atau klarifikasi administratif." /></div>
        <div className="flex flex-wrap justify-end gap-2">
          <Input className="max-w-sm" value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="Alasan bila meminta perbaikan" />
          <Button variant="outline" disabled={!revisionNote || assessment.status === "reviewed"} onClick={() => save({ status: "needs_revision", revisionNote }, "Dikembalikan kepada penerbang untuk dilengkapi")}>Minta dilengkapi</Button>
          <Button disabled={assessment.status !== "submitted" && assessment.status !== "needs_revision"} onClick={() => save({ status: "verified", officerName: currentUser, officerNote, officerVerifiedAt: new Date().toISOString(), revisionNote: undefined }, "Pre-assessment diverifikasi petugas") }><FileCheck2 />Verifikasi & teruskan</Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="size-5 text-accent" />Tahap 3 · Review dokter</CardTitle><CardDescription>Dokter mengonfirmasi flag dan menetapkan rencana pemeriksaan; keputusan kelaikan tetap dibuat setelah pemeriksaan.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="doctor-plan">Rencana pemeriksaan / klarifikasi klinis</Label><textarea id="doctor-plan" value={doctorPlan} onChange={(e) => setDoctorPlan(e.target.value)} className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Contoh: klarifikasi pola tidur, pemeriksaan tanda vital, dan review jadwal tugas." /></div>
        {assessment.officerName ? <p className="rounded-lg bg-muted/50 p-3 text-sm"><strong>Diverifikasi oleh {assessment.officerName}:</strong> {assessment.officerNote || "Tidak ada catatan tambahan."}</p> : null}
        <div className="flex justify-end"><Button variant="accent" disabled={assessment.status !== "verified" || !doctorPlan.trim()} onClick={() => save({ status: "reviewed", doctorName: currentUser, doctorPlan, doctorReviewedAt: new Date().toISOString() }, "Review dokter tersimpan; episode siap dilanjutkan ke pemeriksaan") }><ShieldCheck />Tandatangani review</Button></div>
      </CardContent>
    </Card>
  </div>;
}

function StageTracker({ status }: { status: PreAssessmentStatus }) {
  const reached = status === "reviewed" ? 3 : status === "verified" ? 2 : 1;
  return <div className="grid grid-cols-3 gap-2">{["Diisi penerbang", "Diverifikasi petugas", "Ditinjau dokter"].map((label, index) => <div key={label} className={cn("rounded-lg border p-3 text-center text-xs font-semibold", index < reached ? "border-accent bg-accent/10 text-accent" : "text-muted-foreground")}><span className="mb-1 block text-base">{index < reached ? "✓" : index + 1}</span>{label}</div>)}</div>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Clock3; tone: string }) { return <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div><Icon className={cn("size-6", tone)} /></CardContent></Card>; }
function Answer({ label, value, wide }: { label: string; value: string; wide?: boolean }) { return <div className={cn("rounded-lg bg-muted/45 p-3", wide && "sm:col-span-2")}><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium leading-5">{value}</p></div>; }
function Check({ label, done }: { label: string; done: boolean }) { return <div className={cn("flex items-center gap-2 rounded-lg border p-3 text-sm font-semibold", done && "border-success/30 bg-success/5 text-success")}>{done ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}{label}</div>; }
function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={cn("flex min-h-12 items-center gap-2 rounded-lg border p-3 text-left text-xs font-semibold", active && "border-accent bg-accent/10 text-accent")}>{active ? <CheckCircle2 className="size-4 shrink-0" /> : <span className="size-4 shrink-0 rounded border" />}{label}</button>; }

function createDraft(penerbangId: string | undefined, upsert: (row: PreAssessment) => void, select: (id: string) => void) {
  if (!penerbangId) return;
  const id = `PA-${Date.now()}`;
  upsert({ id, penerbangId, examinationType: "Berkala", plannedDate: new Date().toISOString().slice(0, 10), status: "draft", completion: 35, complaints: "", medications: "", sleepHours: 0, fatigue: false, wellbeingConcern: false, documentsComplete: false, consent: false, priority: "normal", flags: [], updatedAt: new Date().toISOString() });
  select(id);
  toast.success("Draf pre-assessment dibuat");
}
