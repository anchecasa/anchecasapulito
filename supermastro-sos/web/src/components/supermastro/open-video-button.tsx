"use client";

import type { ReactNode } from "react";
import { OPEN_VIDEO_EVENT } from "@/components/supermastro/home-entry";

/** Apre la fotocamera della home (HomeEntry) senza cambiare pagina. */
export function OpenVideoButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.scrollTo({ top: 0 });
        window.dispatchEvent(new Event(OPEN_VIDEO_EVENT));
      }}
    >
      {children}
    </button>
  );
}
