import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-gray-800 border-2 border-black",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 border-2 border-black focus-visible:ring-destructive/20",
        outline:
          "border-2 border-black bg-background hover:bg-gray-100 text-black",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-black",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3 min-h-[44px]",
        sm: "h-9 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5 min-h-[44px]",
        lg: "h-12 rounded-xl px-6 has-[>svg]:px-4 min-h-[44px]",
        icon: "size-10 min-h-[44px] min-w-[44px]",
        "icon-sm": "size-9 min-h-[44px] min-w-[44px]",
        "icon-lg": "size-12 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
