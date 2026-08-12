import { Link } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="max-w-lg text-center">
        <CardContent className="p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-accent/12 text-accent">
            <Radar className="size-7" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">Halaman tidak ditemukan</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Rute yang diminta tidak tersedia di modul CSAKT.</p>
          <Button className="mt-5" asChild><Link to="/dashboard">Kembali ke Dashboard</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
