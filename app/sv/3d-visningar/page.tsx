import DetailPage, { detailMetadata } from "../../site-detail";

export const metadata = detailMetadata("sv", "tour");

export default function SwedishTour() {
  return <DetailPage locale="sv" page="tour" />;
}
