import { useCallback, useEffect, useRef, useState } from "react";

export function useHorizontalScroll() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
  }, []);

  const scrollLeft = () => {
    ref.current?.scrollBy({ left: -320, behavior: "smooth" });
    setTimeout(update, 200);
  };

  const scrollRight = () => {
    ref.current?.scrollBy({ left: 320, behavior: "smooth" });
    setTimeout(update, 200);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;

    el.addEventListener("scroll", update);
    return () => el.removeEventListener("scroll", update);
  }, [update]);

  return { ref, canLeft, canRight, scrollLeft, scrollRight };
}