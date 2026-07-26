import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Karliq",
    short_name: "Karliq",
    description: "Digital design, motion, smart automation, AI och utveckling från Karliq i Jönköpings län.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8ff",
    theme_color: "#7c3aed",
    icons: [{ src: "/karliq-icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
