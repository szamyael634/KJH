import * as React from "react"
import { cn } from "@/utils/cn"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { size?: "sm" | "md" }
>(({ className, type, size = "md", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        size === "sm" ? "h-9 text-xs" : "h-12 text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
