import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        sage: "bg-sage-dark text-white hover:bg-sage-accessible focus-visible:ring-sage/50",
        rose: "bg-dusty-rose-accessible text-white hover:bg-dusty-rose-accessible/90 focus-visible:ring-dusty-rose/50",
        terracotta: "bg-terracotta text-white hover:bg-terracotta/90 focus-visible:ring-terracotta/50",
      },
      size: {
        default: "h-11 px-4 py-2 min-h-[44px]",
        sm: "h-10 rounded-md px-3 min-h-[40px]",
        lg: "h-12 rounded-md px-8 min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
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

// Memoized Button component to prevent unnecessary re-renders when props haven't changed
const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
      // Memoize the component type selection
      const Comp = React.useMemo(() => asChild ? Slot : "button", [asChild])
      
      // Memoize className computation to avoid recalculation on every render
      const computedClassName = React.useMemo(
        () => cn(buttonVariants({ variant, size, className })),
        [variant, size, className]
      )
      
      return (
        <Comp
          className={computedClassName}
          ref={ref}
          {...props}
        />
      )
    }
  )
)

Button.displayName = "Button"

export { Button, buttonVariants }