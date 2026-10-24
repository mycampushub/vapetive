import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { DiscoverView } from "./discover-view";

export const metadata: Metadata = {
  title: "Browse All Heat-Not-Burn Sticks — Full Catalog",
  description:
    "Browse the full VAPETIVE range — heat-not-burn tobacco sticks made for IQOS ILUMA across multi-origin, Indonesia and Japan lines. Filter, sort and search the complete UAE range.",
  ...canonical("/discover"),
};

export default function DiscoverPage() {
  return <DiscoverView />;
}
