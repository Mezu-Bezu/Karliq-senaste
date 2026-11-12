import Home, { homeMetadata } from "../site-home";

export const metadata = homeMetadata("en");

export default function EnglishHome() {
  return <Home locale="en" />;
}
