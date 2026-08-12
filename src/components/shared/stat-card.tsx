import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning" | "danger";
};

const toneMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/12 text-accent",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-amber-700 dark:text-amber-300",
  danger: "bg-destructive/12 text-destructive",
};

export function StatCard({ label, value, delta, icon: Icon, tone = "primary" }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="tabular mt-2 text-3xl font-extrabold">{value}</p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">{delta}</p>
        </div>
        <div className={cn("flex size-12 items-center justify-center rounded-xl", toneMap[tone])}>
          <Icon className="size-6" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
