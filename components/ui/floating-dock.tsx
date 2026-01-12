import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
  activePath,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  desktopClassName?: string;
  mobileClassName?: string;
  activePath?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} activePath={activePath} />
      <FloatingDockMobile items={items} className={mobileClassName} activePath={activePath} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
  activePath,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
  activePath?: string;
}) => {
  return (
    <div className={cn("flex md:hidden h-16 flex-row items-center justify-center gap-3 rounded-2xl bg-white border-2 border-black px-3 py-2 shadow-lg", className)}>
      {items.map((item) => {
        const isActive = activePath === item.href || (item.href === "/" && activePath === "/");
        return (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90",
              isActive
                ? "bg-black border-black"
                : "bg-white border-black active:bg-gray-100"
            )}
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={cn("h-5 w-5", isActive && "text-white")}
            >
              {item.icon}
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
  activePath,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
  activePath?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden md:flex h-16 flex-row items-center justify-center gap-4 rounded-2xl bg-white border-2 border-black px-4 py-3 shadow-lg",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} activePath={activePath} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  activePath,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  activePath?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isActive = activePath === href || (href === "/" && activePath === "/");

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full border-2 transition-colors",
          isActive
            ? "bg-black border-black"
            : "bg-white border-black hover:bg-gray-100"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border-2 border-black bg-white px-2 py-0.5 text-xs whitespace-pre text-black font-semibold z-50"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className={cn(
            "flex items-center justify-center *:w-full *:h-full",
            isActive ? "*:text-white" : "*:text-black"
          )}
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
