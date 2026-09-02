import { Suspense } from "react";

import { DestinationsPageClient } from "@/components/destinations/destinations-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function DestinationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <DestinationsPageClient />
    </Suspense>
  );
}
