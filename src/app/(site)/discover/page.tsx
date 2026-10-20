import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { DiscoverView } from "./discover-view";

export const metadata: Metadata = {
  title: "Browse All Vape Products — Full Catalog",
  description:
    "Browse the full VAPETIVE range — sealed disposables, refillable pod systems, salt-nic e-liquids, advanced vape kits and accessories from the UAE's leading vape brands. Filter, sort and search the complete UAE range.",
  ...canonical("/discover"),
};

export default function DiscoverPage() {
  return <DiscoverView />;
}
