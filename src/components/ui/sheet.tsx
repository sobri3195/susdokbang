import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetPortal = SheetPrimitive.Portal;

export function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: "left" | "right" }) {
  return (
    <SheetPortal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/55 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <SheetPrimitive.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-80 max-w-[88vw] flex-col border bg-card shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "left" ? "left-0" : "right-0",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-md opacity-70 transition-opacity hover:opacity-100">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Tutup menu</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
);

export const SheetTitle = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title className={cn("text-base font-bold", className)} {...props} />
);
