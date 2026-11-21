"use client";

import type { AnchorHTMLAttributes } from "react";

// A link with nowhere to go yet (single-page brief): real <a href="#"> semantics, styling and focus,
// but clicking doesn't jump to the top. Lets server components (footer) stay server-rendered.
export default function DeadLink({ onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href="#"
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    />
  );
}
