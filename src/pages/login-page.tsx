import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, Lock, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  function onSubmit(values: LoginValues) {
    login(values.username);
    toast.success("Autentikasi berhasil");
    const requestedPath = (location.state as { from?: string } | null)?.from;
    navigate(requestedPath?.startsWith("/") ? requestedPath : "/dashboard", { replace: true });
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative flex min-h-[42rem] items-center overflow-hidden bg-primary px-6 py-12 text-primary-foreground lg:px-16">
        <div className="absolute inset-0 opacity-18 [background-image:linear-gradient(hsl(var(--primary-foreground)/.26)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary-foreground)/.26)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative max-w-3xl">
          <div className="mb-8 flex size-16 items-center justify-center rounded-xl bg-primary-foreground/10">
            <ShieldCheck className="size-9" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-cyan-100">CSAKT LAKESPRA</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-normal md:text-6xl">
            Analitik kelaikan terbang berbasis kausal dan survival.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cyan-50/88">
            Integrasi Medical Check-Up, psikotes, dan jam terbang 2016-2026 untuk mendukung keputusan aeromedis yang telusur, konsisten, dan siap diaudit.
          </p>
          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Cox Regression", "Kaplan-Meier", "DAG Kausal"].map((item) => (
              <div key={item} className="rounded-xl border border-white/18 bg-white/8 p-4">
                <Activity className="mb-3 size-5 text-cyan-200" aria-hidden="true" />
                <p className="text-sm font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Masuk Sistem</CardTitle>
            <CardDescription>Masukkan kredensial operator untuk memulai sesi demo di perangkat ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" autoComplete="username" {...form.register("username")} />
                <p className="min-h-5 text-xs text-destructive">{form.formState.errors.username?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
                <p className="min-h-5 text-xs text-destructive">{form.formState.errors.password?.message}</p>
              </div>
              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                <Lock />
                Masuk
              </Button>
              <p className="text-center text-xs leading-5 text-muted-foreground">
                Mode demonstrasi: autentikasi server wajib diaktifkan sebelum penggunaan dengan data operasional.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
