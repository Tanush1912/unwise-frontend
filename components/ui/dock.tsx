"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

const dockVariants = cva(
  "mx-auto flex h-16 items-end gap-2 rounded-2xl border-2 border-black bg-background/80 backdrop-blur-sm p-2"
)

export interface DockProps extends VariantProps<typeof dockVariants> {
  magnification?: number
  distance?: number
  children?: React.ReactNode
  className?: string
}

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ className, magnification = 60, distance = 140, children }, ref) => {
    const mouseX = useMotionValue(Number.NaN)

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        mouseX.set(e.clientX)
      }
      const handleMouseLeave = () => {
        mouseX.set(Number.NaN)
      }

      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseleave", handleMouseLeave)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseleave", handleMouseLeave)
      }
    }, [mouseX])

    return (
      <motion.div
        ref={ref}
        className={cn(dockVariants(), className)}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return (
              <DockIconWrapper mouseX={mouseX} magnification={magnification} distance={distance}>
                {child}
              </DockIconWrapper>
            )
          }
          return child
        })}
      </motion.div>
    )
  }
)
Dock.displayName = "Dock"

interface DockIconWrapperProps {
  mouseX: ReturnType<typeof useMotionValue<number>>
  magnification: number
  distance: number
  children: React.ReactElement
}

const DockIconWrapper = ({ mouseX, magnification, distance, children }: DockIconWrapperProps) => {
  const ref = React.useRef<HTMLDivElement>(null)

  const distanceValue = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthTransform = useTransform(
    distanceValue,
    [-distance, 0, distance],
    [40, magnification, 40]
  )

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="flex aspect-square cursor-pointer items-center justify-center rounded-full"
    >
      {children}
    </motion.div>
  )
}

export { Dock, dockVariants }
