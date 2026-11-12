import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Karliq",
    short_name: "Karliq",
    description: "Automation och webbutveckling för företag.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8ff",
    theme_color: "#7c3aed",
    icons: [{ src: "/karliq-icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
