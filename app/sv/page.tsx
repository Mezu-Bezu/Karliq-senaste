import Home, { homeMetadata } from "../site-home";

export const metadata = homeMetadata("sv");

export default function SwedishHome() {
  return <Home locale="sv" />;
}
