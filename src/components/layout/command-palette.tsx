import { Command } from "cmdk";
import { IdCard, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllNavItems } from "@/app/nav.config";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);
  const pilots = useDataStore((state) => state.penerbang);
  const items = useMemo(() => getAllNavItems(role), [role]);
  const canOpenPilotDetail = role === "Admin" || role === "Analis" || role === "Dokter Penerbangan";

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || event.key === "/") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-10 min-w-72 items-center gap-2 rounded-md border bg-background px-3 text-left text-sm text-muted-foreground shadow-sm md:flex"
      >
        <Search className="size-4" aria-hidden="true" />
        Cari modul, NRP, nama...
        <span className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[11px] font-semibold">Ctrl K</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm md:hidden"
        aria-label="Buka command palette"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0">
          <Command className="overflow-hidden rounded-xl bg-card">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
              <Command.Input asChild>
                <Input className="h-12 border-0 shadow-none focus-visible:ring-0" placeholder="Ketik modul, NRP, atau nama penerbang..." />
              </Command.Input>
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada modul atau penerbang yang cocok.</Command.Empty>
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Modul</div>
              {items.map((item) => (
                <Command.Item
                  key={item.path}
                  value={`${item.label} ${item.path}`}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-muted"
                  onSelect={() => {
                    navigate(item.path);
                    setOpen(false);
                  }}
                >
                  <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {item.label}
                </Command.Item>
              ))}
              {canOpenPilotDetail ? (
                <>
                  <div className="mt-2 border-t px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Penerbang</div>
                  {pilots.map((pilot) => (
                    <Command.Item
                      key={pilot.id}
                      value={`${pilot.nrp} ${pilot.nama} ${pilot.pangkat} ${pilot.skadron} ${pilot.status}`}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-muted"
                      onSelect={() => {
                        navigate(`/penerbang/${pilot.id}`);
                        setOpen(false);
                      }}
                    >
                      <IdCard className="size-4 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{pilot.nrp} - {pilot.nama}</p>
                        <p className="truncate text-xs text-muted-foreground">{pilot.pangkat} | {pilot.skadron}</p>
                      </div>
                      <Badge variant={pilot.riskScore >= 55 ? "danger" : "secondary"}>Risk {pilot.riskScore}</Badge>
                    </Command.Item>
                  ))}
                </>
              ) : null}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
