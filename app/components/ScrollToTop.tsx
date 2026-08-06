"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Start every page at the top.
 *
 * Next's own scroll restoration keeps the previous offset when it thinks the
 * new page is already in view, which is why opening a job from halfway down
 * the board used to drop you into the middle of the listing.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // The dashboard scrolls inside its own <main>, not the window.
    document
      .querySelectorAll<HTMLElement>("[data-scroll-container]")
      .forEach((el) => el.scrollTo({ top: 0, behavior: "auto" }));
  }, [pathname]);

  return null;
}
