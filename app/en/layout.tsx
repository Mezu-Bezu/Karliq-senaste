import SiteLayout from "../site-layout";

export { metadata, viewport } from "../site-layout";

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout locale="en">{children}</SiteLayout>;
}
