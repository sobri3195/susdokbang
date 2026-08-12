import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const users = [
  ["Kolonel Kes Dr. Raka", "Admin", "LAKESPRA"],
  ["Mayor Kes dr. Mira", "Dokter Penerbangan", "MCU"],
  ["Kapten Sus Analis Bima", "Analis", "Data Science"],
];

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Pengaturan Sistem"
        description="Profil operator, preferensi keamanan, manajemen user, role, dan hak akses modul."
        actions={<Button variant="accent"><UserPlus />Tambah User</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>Profil Instansi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Nama Sistem</Label><Input defaultValue="CSAKT" /></div>
            <div className="space-y-2"><Label>Unit Pengelola</Label><Input defaultValue="LAKESPRA TNI AU" /></div>
            <div className="space-y-2">
              <Label>Mode Keamanan</Label>
              <Select defaultValue="audit"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="audit">Audit ketat</SelectItem><SelectItem value="standard">Standar</SelectItem></SelectContent></Select>
            </div>
            <Button><ShieldCheck />Simpan Pengaturan</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Manajemen User & Role</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {users.map(([name, role, unit]) => (
              <div key={name} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="size-5" aria-hidden="true" /></div>
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-muted-foreground">{unit}</p>
                  </div>
                </div>
                <Badge variant={role === "Admin" ? "default" : "secondary"}>{role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
