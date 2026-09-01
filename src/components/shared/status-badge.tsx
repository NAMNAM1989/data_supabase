import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/types/database";

type RecordStatus = Tables<"customers">["status"];

const STATUS_LABELS: Record<RecordStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

const STATUS_VARIANT: Record<RecordStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  ARCHIVED: "outline",
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
