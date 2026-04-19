import * as React from "react"
import { cn } from "@/utils/cn"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive"
    size?: "sm" | "md" | "lg" | "icon"
  }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800",
    link: "text-indigo-600 underline-offset-4 hover:underline",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  }

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
    icon: "h-10 w-10 p-2",
  }

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
