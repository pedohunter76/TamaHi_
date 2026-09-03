"use client";

import { useEffect } from "react";

/**
 * Automatically cleans up user state (room memberships & queue positions)
 * when a user closes the browser tab or quits the site, and ensures fresh
 * state when returning from a closed session.
 */
export function SessionLifecycleTracker() {
  useEffect(() => {
    // sessionStorage is scoped to the browser tab lifecycle and is destroyed
    // when the tab is closed, but preserved across reloads (F5).
    const isAlive = sessionStorage.getItem("tamahi_session_alive");

    if (!isAlive) {
      // User opened a fresh tab after quitting: purge any orphaned room/queue rows
      void fetch("/api/user/quit", {
        method: "POST",
      }).catch(() => {});

      sessionStorage.setItem("tamahi_session_alive", "1");
    }

    // When the user closes the tab or navigates away from the site
    function handleSiteQuit() {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/user/quit");
      } else {
        void fetch("/api/user/quit", {
          method: "POST",
          keepalive: true,
        }).catch(() => {});
      }
    }

    window.addEventListener("pagehide", handleSiteQuit);

    return () => {
      window.removeEventListener("pagehide", handleSiteQuit);
    };
  }, []);

  return null;
}
