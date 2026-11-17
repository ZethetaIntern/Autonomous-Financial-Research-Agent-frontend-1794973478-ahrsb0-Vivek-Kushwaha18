"use client";

import { useEffect } from "react";

export default function AuthTabSync() {
  useEffect(() => {
    let refreshPending = false;

    function handleStorageChange(event: StorageEvent) {
      if (
        event.key !== "zetheta_access_token" ||
        refreshPending
      ) {
        return;
      }

      refreshPending = true;
      window.location.reload();
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return null;
}
