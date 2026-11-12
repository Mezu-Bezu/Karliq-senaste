import SiteLayout from "../site-layout";

export { metadata, viewport } from "../site-layout";

export default function SwedishLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout locale="sv">{children}</SiteLayout>;
}
