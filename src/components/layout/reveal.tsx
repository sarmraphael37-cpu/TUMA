"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "cn";

type RevealProps = ComponentProps<"div"> & {
  /** Delay in milliseconds before the transition starts. */
  delay?: number;
  /** Distance in pixels the element travels while fading in. */
  distance?: number;
};

/**
 * Fades and lifts content into view the first time it enters the viewport.
 * Content is always present in the DOM for SEO and screen readers.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 20,
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none",
        className,
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : `translate3d(0, ${distance}px, 0)`,
        transitionDelay: `${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
