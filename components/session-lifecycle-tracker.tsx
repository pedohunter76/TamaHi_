"use client";

import { useEffect } from "react";

/**
 * Automatically cleans up user queue state (ghost rows in match_queue)
 * when a user closes the browser tab while waiting in queue,
 * while rooms self-destruct after 1 hour.
 */
export function SessionLifecycleTracker() {
  useEffect(() => {
    // When the user closes the tab, send beacon to release their spot in match_queue
    function handleSiteQuit() {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/queue/leave");
      } else {
        void fetch("/api/queue/leave", {
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
