import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Boxes, Database, GitMerge, Network, PlayCircle, Plus, PowerOff, RefreshCcw, Server, ShieldCheck, Terminal, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryFns } from "@/lib/queries";
import type { ClusterNodeStatus, DistributedClusterSnapshot, DistributedWorker } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

const statusVariant: Record<ClusterNodeStatus, "success" | "warning" | "danger" | "secondary" | "info"> = {
  online: "success",
  busy: "info",
  degraded: "warning",
  offline: "danger",
};

export function DistributedSystemPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["distributed-cluster"],
    queryFn: queryFns.distributedCluster,
    refetchInterval: 7000,
  });

  const demoMutation = useMutation({
    mutationFn: async (action: "run" | "kill" | "scale") => {
      await new Promise((resolve) => window.setTimeout(resolve, 850));
      return action;
    },
    onSuccess: (action) => {
      const message = {
        run: "Job bootstrap terdistribusi dikirim ke queue.",
        kill: "Simulasi worker timeout aktif. Subtask akan retry ke worker lain.",
        scale: "Worker baru ditambahkan ke simulasi cluster.",
      }[action];
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["distributed-cluster"] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32" />)}</div>
        <Skeleton className="h-[34rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bukti arsitektur terdistribusi"
        title="Cluster & Jobs CSAKT"
        description="Dashboard observability untuk gateway PHP, broker Redis, coordinator, worker Python, job queue, map-reduce bootstrap, fault tolerance, dan federated aggregation."
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCcw className={isFetching ? "animate-spin" : ""} />Refresh</Button>
            <Button variant="accent" onClick={() => demoMutation.mutate("run")} disabled={demoMutation.isPending}><PlayCircle />Jalankan Bootstrap</Button>
          </>
        }
      />

      <ClusterSummary snapshot={data} />
      <DemoPanel onAction={(action) => demoMutation.mutate(action)} loading={demoMutation.isPending} />
      <Topology snapshot={data} />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <QueueMetrics snapshot={data} />
        <Benchmark snapshot={data} />
      </div>

      <WorkerTable workers={data.workers} />
      <JobsPanel snapshot={data} />
      <JobConsole snapshot={data} />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <FederatedPanel snapshot={data} />
        <DistributionLogs snapshot={data} />
      </div>

      <Card className="border-l-4 border-l-accent">
        <CardContent className="p-5">
          <p className="font-bold">Narasi Otomatis Siap Kutip KTI</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.narrative}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ClusterSummary({ snapshot }: { snapshot: DistributedClusterSnapshot }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Worker Aktif" value={formatNumber(snapshot.activeWorkers)} delta="Competing consumers Python" icon={Server} tone="success" />
      <StatCard label="Queue Length" value={formatNumber(snapshot.queueLength)} delta={`${snapshot.deadLetterCount} dead-letter`} icon={Boxes} tone={snapshot.queueLength > 10 ? "warning" : "accent"} />
      <StatCard label="Throughput" value={`${snapshot.throughput.toFixed(1)}/d`} delta="Job per detik" icon={Zap} tone="primary" />
      <StatCard label="P95 Latency" value={`${snapshot.p95LatencyMs} ms`} delta="Gateway -> result store" icon={Activity} tone={snapshot.p95LatencyMs > 1200 ? "warning" : "success"} />
    </div>
  );
}

function DemoPanel({ onAction, loading }: { onAction: (action: "run" | "kill" | "scale") => void; loading: boolean }) {
  return (
    <Card className="aero-panel">
      <CardContent className="grid gap-3 p-4 md:grid-cols-3">
        <Button variant="outline" onClick={() => onAction("run")} disabled={loading}><PlayCircle />Jalankan bootstrap terdistribusi</Button>
        <Button variant="outline" onClick={() => onAction("kill")} disabled={loading}><PowerOff />Matikan 1 worker</Button>
        <Button variant="outline" onClick={() => onAction("scale")} disabled={loading}><Plus />Tambah worker</Button>
      </CardContent>
    </Card>
  );
}

function Topology({ snapshot }: { snapshot: DistributedClusterSnapshot }) {
  const ordered = ["gateway", "broker", "coordinator", "worker", "database", "monitor"];
  const nodes = [...snapshot.workers].sort((a, b) => ordered.indexOf(a.role) - ordered.indexOf(b.role));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Topologi Node</CardTitle>
        <CardDescription>{"Komunikasi jaringan: React -> PHP Gateway -> Redis Queue -> Python Workers -> Coordinator -> MySQL Result Store."}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {nodes.map((node) => (
            <div key={node.id} className="relative rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {node.role === "database" ? <Database className="size-5" /> : node.role === "coordinator" ? <GitMerge className="size-5" /> : <Network className="size-5" />}
                  </div>
                  <div>
                    <p className="font-bold">{node.id}</p>
                    <p className="text-xs text-muted-foreground">{node.hostname}</p>
                  </div>
                </div>
                <StatusBadge status={node.status} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{node.currentTask}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Metric label="CPU" value={`${node.cpuLoad}%`} />
                <Metric label="RAM" value={`${node.memoryMb} MB`} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QueueMetrics({ snapshot }: { snapshot: DistributedClusterSnapshot }) {
  return (
    <ChartCard title="Antrian & Throughput" description="Polling metrik cluster: panjang queue, job/detik, dan latency.">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={snapshot.metrics}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="queueLength" name="Queue" fill="#155e75" radius={[5, 5, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="jobsPerSecond" name="Jobs/detik" stroke="#0f766e" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="latencyMs" name="Latency ms" stroke="#d97706" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function Benchmark({ snapshot }: { snapshot: DistributedClusterSnapshot }) {
  return (
    <ChartCard title="Benchmark Speedup" description="Waktu bootstrap 1000 resample saat jumlah worker diskalakan.">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={snapshot.benchmark}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="workers" tickFormatter={(value) => `${value} worker`} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="seconds" name="Detik" radius={[5, 5, 0, 0]} fill="#155e75" />
            <Bar dataKey="speedup" name="Speedup x" radius={[5, 5, 0, 0]} fill="#0f766e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function WorkerTable({ workers }: { workers: DistributedWorker[] }) {
  return (
    <DataTable
      data={workers}
      searchPlaceholder="Cari worker, host, queue..."
      columns={[
        { accessorKey: "id", header: "Worker ID", cell: ({ row }) => <span className="font-semibold">{row.original.id}</span> },
        { accessorKey: "hostname", header: "Host" },
        { accessorKey: "role", header: "Role", cell: ({ row }) => <Badge variant="secondary">{row.original.role}</Badge> },
        { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
        { accessorKey: "currentTask", header: "Task" },
        { accessorKey: "queue", header: "Queue" },
        { accessorKey: "cpuLoad", header: "CPU", cell: ({ row }) => <span className="tabular">{row.original.cpuLoad}%</span> },
        { accessorKey: "heartbeat", header: "Heartbeat", cell: ({ row }) => <span className="text-xs">{row.original.heartbeat.slice(11, 19)}</span> },
      ]}
    />
  );
}

function JobsPanel({ snapshot }: { snapshot: DistributedClusterSnapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Job Terdistribusi</CardTitle>
        <CardDescription>Progress subtask, retry, dan distribusi worker untuk map-reduce bootstrap.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {snapshot.jobs.map((job) => (
          <div key={job.id} className="rounded-xl border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-bold">{job.id}</p>
                <p className="text-sm text-muted-foreground">{job.resultSummary}</p>
              </div>
              <Badge variant={job.status === "completed" ? "success" : job.status === "running" ? "info" : "warning"}>{job.status}</Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${job.progress}%` }} />
            </div>
            <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
              <Metric label="Progress" value={`${job.progress}%`} />
              <Metric label="Subtask" value={`${job.completedSubtasks}/${job.totalSubtasks}`} />
              <Metric label="Speedup" value={`${job.speedup.toFixed(2)}x`} />
              <Metric label="Waktu" value={`${job.distributedSeconds}s vs ${job.singleNodeSeconds}s`} />
            </div>
            {job.subtasks.length ? (
              <div className="mt-4 overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Subtask</TableHead><TableHead>Worker</TableHead><TableHead>Status</TableHead><TableHead>Attempt</TableHead><TableHead>Durasi</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.subtasks.slice(0, 8).map((subtask) => (
                      <TableRow key={subtask.id}>
                        <TableCell className="font-semibold">{subtask.id}</TableCell>
                        <TableCell>{subtask.workerId}</TableCell>
                        <TableCell><Badge variant={subtask.status === "completed" ? "success" : subtask.status === "retrying" ? "warning" : "info"}>{subtask.status}</Badge></TableCell>
                        <TableCell>{subtask.attempt}</TableCell>
                        <TableCell className="tabular">{Math.round(subtask.durationMs / 1000)}s</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FederatedPanel({ snapshot }: { snapshot: DistributedClusterSnapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Federated Aggregation</CardTitle>
        <CardDescription>Simulasi multi-satuan: node skadron mengirim sufficient statistics, bukan raw data medis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshot.federated.map((node) => (
          <div key={node.node} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{node.skadron}</p>
                <p className="text-xs text-muted-foreground">{node.node}</p>
              </div>
              <Badge variant={node.sharedRawData ? "danger" : "success"}>{node.sharedRawData ? "raw shared" : "privacy-safe"}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <Metric label="Rows" value={formatNumber(node.localRows)} />
              <Metric label="Events" value={formatNumber(node.events)} />
              <Metric label="Stats" value={node.sufficientStats} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function JobConsole({ snapshot }: { snapshot: DistributedClusterSnapshot }) {
  const baseLogs = useMemo(() => buildConsoleLogs(snapshot), [snapshot]);
  const [logs, setLogs] = useState(baseLogs.slice(0, 8));
  const [paused, setPaused] = useState(false);
  const indexRef = useRef(8);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLogs(baseLogs.slice(0, 8));
    indexRef.current = 8;
  }, [baseLogs]);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => {
      setLogs((current) => {
        const next = baseLogs[indexRef.current % baseLogs.length];
        indexRef.current += 1;
        return [...current.slice(-13), next];
      });
    }, 1800);
    return () => window.clearInterval(timer);
  }, [baseLogs, paused]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [logs]);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Terminal className="size-5 text-primary" />Job Console Real-Time</CardTitle>
            <CardDescription>Polling log lifecycle: job dibuat, subtask dibagi, worker claim, retry, dan reduce selesai.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</Button>
            <Button variant="outline" onClick={() => setLogs(baseLogs.slice(0, 8))}>Reset</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100 shadow-inner">
          {logs.map((log, index) => (
            <div key={`${log.time}-${log.message}-${index}`} className="grid gap-2 py-1 md:grid-cols-[4.5rem_7rem_1fr]">
              <span className="text-slate-400">{log.time}</span>
              <span className={cn("font-bold", log.level === "error" ? "text-red-300" : log.level === "warn" ? "text-amber-300" : "text-cyan-200")}>[{log.level.toUpperCase()}]</span>
              <span className="break-words">{log.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  );
}

function buildConsoleLogs(snapshot: DistributedClusterSnapshot) {
  const job = snapshot.jobs[0];
  const subtasks = job?.subtasks ?? [];
  return [
    { time: "09:10:00", level: "info" as const, message: `gateway accepted POST /api/jobs type=${job?.type ?? "bootstrap_validation"}` },
    { time: "09:10:01", level: "info" as const, message: `job ${job?.id ?? "JOB-BOOT"} persisted to MySQL and pushed to Redis csakt:jobs` },
    { time: "09:10:02", level: "info" as const, message: `coordinator split ${job?.totalSubtasks ?? 12} subtasks for map-reduce bootstrap` },
    ...subtasks.slice(0, 6).map((subtask, index) => ({
      time: `09:10:${String(4 + index).padStart(2, "0")}`,
      level: "info" as const,
      message: `${subtask.workerId} claimed ${subtask.id} attempt=${subtask.attempt} task=${subtask.taskType}`,
    })),
    ...snapshot.logs.map((log) => ({
      time: log.timestamp,
      level: log.event === "timeout" ? "error" as const : log.event === "retry" ? "warn" as const : "info" as const,
      message: `${log.workerId} ${log.event}: ${log.detail}`,
    })),
    { time: "09:12:45", level: "info" as const, message: "coordinator reduce partial C-index, optimism, and worker distribution" },
    { time: "09:12:47", level: "info" as const, message: "result cached to Redis and prepared for GET /api/jobs/{id}/result" },
  ];
}

function DistributionLogs({ snapshot }: { snapshot: DistributedClusterSnapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Distribusi & Fault Tolerance</CardTitle>
        <CardDescription>Bukti subtask diproses worker berbeda, retry, dan reduce.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshot.logs.map((log) => (
          <div key={`${log.timestamp}-${log.workerId}-${log.event}`} className="flex gap-3 rounded-xl border p-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-xs font-bold">{log.timestamp}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={log.event === "timeout" ? "danger" : log.event === "retry" ? "warning" : "secondary"}>{log.event}</Badge>
                <span className="text-sm font-semibold">{log.workerId}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{log.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: ClusterNodeStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/45 p-2">
      <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
      <p className="tabular mt-1 font-bold">{value}</p>
    </div>
  );
}
