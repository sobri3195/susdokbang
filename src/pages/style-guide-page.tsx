import { Activity, Bell, CheckCircle2, Info, Moon, Save, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function StyleGuidePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Internal style guide"
        title="Design System CSAKT"
        description="Token warna, komponen UI, state visual, dan density layout yang dipakai konsisten di seluruh aplikasi."
      />
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Primary", "bg-primary text-primary-foreground"],
          ["Accent", "bg-accent text-accent-foreground"],
          ["Success", "bg-success text-white"],
          ["Warning", "bg-warning text-slate-950"],
        ].map(([label, cls]) => (
          <div key={label} className={`rounded-xl p-5 ${cls}`}>
            <p className="text-sm font-bold">{label}</p>
            <p className="mt-8 text-xs">WCAG-aware token</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Controls</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button><Save />Primary</Button>
              <Button variant="accent"><Bell />Accent</Button>
              <Button variant="outline"><Search />Outline</Button>
              <Button variant="ghost" size="icon" aria-label="Tema"><Moon /></Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="style-input">Field input</Label>
              <Input id="style-input" placeholder="Label jelas dan focus ring terlihat" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge><Badge variant="success">Laik</Badge><Badge variant="warning">Observasi</Badge><Badge variant="danger">Tidak Laik</Badge><Badge variant="info">Info</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>States</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="loading">
              <TabsList><TabsTrigger value="loading">Loading</TabsTrigger><TabsTrigger value="empty">Empty</TabsTrigger><TabsTrigger value="success">Success</TabsTrigger></TabsList>
              <TabsContent value="loading" className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-20 w-full" /></TabsContent>
              <TabsContent value="empty" className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Data belum tersedia untuk filter aktif.</TabsContent>
              <TabsContent value="success" className="flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="size-4" />Operasi berhasil dan tercatat.</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Contoh KPI" value="168" delta="Tabular number" icon={Activity} tone="primary" />
        <StatCard label="Alert" value="28" delta="Visual warning" icon={Info} tone="warning" />
        <StatCard label="Sukses" value="92%" delta="Kontras AA" icon={CheckCircle2} tone="success" />
      </div>
    </div>
  );
}
