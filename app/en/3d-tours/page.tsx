import DetailPage, { detailMetadata } from "../../site-detail";

export const metadata = detailMetadata("en", "tour");

export default function EnglishTour() {
  return <DetailPage locale="en" page="tour" />;
}
