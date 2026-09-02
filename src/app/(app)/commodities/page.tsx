import { Suspense } from "react";

import { CommoditiesPageClient } from "@/components/commodities/commodities-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommoditiesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <CommoditiesPageClient />
    </Suspense>
  );
}
