import { permanentRedirect } from "next/navigation";

/* The site now lives at the root — keep old /landing links working. */
export default function LandingRedirect() {
  permanentRedirect("/");
}
