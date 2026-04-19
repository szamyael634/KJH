import * as React from "react"
import { cn } from "@/utils/cn"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export { Card }
