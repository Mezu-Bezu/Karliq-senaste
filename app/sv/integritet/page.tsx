import DetailPage, { detailMetadata } from "../../site-detail";

export const metadata = detailMetadata("sv", "privacy");

export default function SwedishPrivacy() {
  return <DetailPage locale="sv" page="privacy" />;
}
