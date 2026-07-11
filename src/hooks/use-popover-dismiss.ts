"use client";

import { useEffect } from "react";

export function usePopoverDismiss(
  open: boolean,
  onClose: () => void,
  rootRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    const timer = window.setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleClick);
    };
  }, [open, onClose, rootRef]);
}
