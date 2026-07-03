import type { Metadata } from "next";
import PrivacyPage from "./PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy — How Printable Handles Your Documents",
  description:
    "The honest, technical story of what happens to your file: direct-to-encrypted-cloud upload, automated printing with no human access, deletion on completion, and a 4-hour maximum retention for everything.",
};

export default function Page() {
  return <PrivacyPage />;
}
