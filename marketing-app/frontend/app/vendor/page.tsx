import type { Metadata } from "next";
import VendorPage from "./VendorPage";

export const metadata: Metadata = {
  title: "Printable Vendor — Complete Operating Software for Print Shops",
  description:
    "The Windows app that runs your print shop: orders chime in and print themselves, printer health and exact toner levels are watched live, cash is one keystroke, and revenue reports export to CSV. Install, paste your setup key, done.",
};

export default function Page() {
  return <VendorPage />;
}
