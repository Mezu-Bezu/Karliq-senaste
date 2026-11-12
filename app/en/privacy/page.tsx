import DetailPage, { detailMetadata } from "../../site-detail";

export const metadata = detailMetadata("en", "privacy");

export default function EnglishPrivacy() {
  return <DetailPage locale="en" page="privacy" />;
}
