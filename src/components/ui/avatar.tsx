import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export const Avatar = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />
);

export const AvatarImage = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>) => (
  <AvatarPrimitive.Image className={cn("aspect-square size-full", className)} {...props} />
);

export const AvatarFallback = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback className={cn("flex size-full items-center justify-center rounded-full bg-muted text-sm font-bold", className)} {...props} />
);
