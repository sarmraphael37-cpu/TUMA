import type { ComponentProps } from "react";

import { cn } from "cn";

/** The shared horizontal rhythm for every page section. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10",
        className,
      )}
      {...props}
    />
  );
}
