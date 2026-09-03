import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TamaHi! — FEU Group Chat",
    short_name: "TamaHi!",
    description: "Ephemeral randomized group chats for FEU students.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f5",
    theme_color: "#006633",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
