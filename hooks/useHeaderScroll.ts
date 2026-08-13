"use client";

import { useEffect, useRef, useState } from "react";

// How far the page needs to move in one direction before reacting — this
// is what prevents flicker from tiny scroll jitter (trackpad micro-moves,
// mobile momentum bounce) constantly flipping the bar in and out.
const DIRECTION_THRESHOLD = 12;

// Shared by both TopBar (its own height, for the slide-out spacer) and
// MainHeader (how far it needs to shift down when TopBar reveals itself)
// so the two stay in sync without either needing to measure the other.
export const TOPBAR_HEIGHT_PX = 60;

export function useHeaderScroll() {
  const [scrolled, setScrolled] = useState(false);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const lastDecisionY = useRef(0);

  useEffect(() => {
    lastDecisionY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;

      setScrolled(currentY > 0);

      if (currentY <= 0) {
        // Always show at the very top of the page, regardless of
        // whatever direction the last movement was.
        setTopBarVisible(true);
        lastDecisionY.current = 0;
        return;
      }

      const delta = currentY - lastDecisionY.current;

      if (delta > DIRECTION_THRESHOLD) {
        setTopBarVisible(false);
        lastDecisionY.current = currentY;
      } else if (delta < -DIRECTION_THRESHOLD) {
        setTopBarVisible(true);
        lastDecisionY.current = currentY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { scrolled, topBarVisible };
}