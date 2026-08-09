import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 320);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <svg viewBox="0 0 24 24" className="back-to-top-icon" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 4.5a1 1 0 0 1 .707.293l6 6a1 1 0 0 1-1.414 1.414L13 7.914V19a1 1 0 1 1-2 0V7.914l-4.293 4.293a1 1 0 0 1-1.414-1.414l6-6A1 1 0 0 1 12 4.5"
        />
      </svg>
    </button>
  );
}
