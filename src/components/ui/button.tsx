"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00162E] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#00162E] text-white hover:bg-[#00162E]/90 shadow-sm active:scale-[0.98]",
        destructive:
          "bg-red-500 text-white hover:bg-red-500/90 shadow-sm active:scale-[0.98]",
        outline:
          "border border-[#e2e8f0] bg-white hover:bg-slate-50 hover:text-[#00162E] shadow-sm active:scale-[0.98]",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm active:scale-[0.98]",
        ghost: "hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]",
        link: "text-[#00162E] underline-offset-4 hover:underline",
        accent:
          "bg-[#005AF1] text-white hover:bg-[#005AF1]/90 shadow-sm active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
