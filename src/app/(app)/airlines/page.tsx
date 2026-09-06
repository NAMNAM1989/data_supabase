import { Suspense } from "react";

import { AirlinesPageClient } from "@/components/airlines/airlines-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function AirlinesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <AirlinesPageClient />
    </Suspense>
  );
}
