/**
 * LucideIcon Helper Component
 * 
 * Wraps Lucide icons to work around React types conflicts in pnpm workspaces.
 * Use this component instead of directly using Lucide icons as JSX components.
 * 
 * @example
 * ```tsx
 * import { Upload } from "lucide-react";
 * import { LucideIcon } from "@/lib/lucide-icon";
 * 
 * <LucideIcon Icon={Upload} size={20} className="text-blue-500" />
 * ```
 */

import React from "react";
import type { LucideIcon as LucideIconType } from "lucide-react";

interface LucideIconProps extends React.ComponentProps<"svg"> {
  Icon: LucideIconType;
  size?: number;
  className?: string;
}

/**
 * Renders a Lucide icon component, bypassing React types conflicts
 */
export function LucideIcon({ Icon, size, className, ...props }: LucideIconProps) {
  return React.createElement(Icon as any, {
    size,
    className,
    ...props,
  });
}
