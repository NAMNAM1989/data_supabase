import { stringSimilarity } from "@/lib/text/similarity";

export type DuplicateEntity =
  | "customer"
  | "party"
  | "driver"
  | "vehicle"
  | "commodity"
  | "destination";

export type DuplicateRecord = {
  id: string;
  label: string;
  meta?: string;
};

export type DuplicateGroup = {
  entity: DuplicateEntity;
  matchKey: string;
  matchType: "exact" | "fuzzy";
  records: DuplicateRecord[];
};

export function findExactDuplicateGroups<T extends { id: string; label: string; meta?: string }>(
  entity: DuplicateEntity,
  records: T[],
  keyFn: (record: T) => string | null | undefined,
  matchKeyLabel?: string,
): DuplicateGroup[] {
  const buckets = new Map<string, T[]>();

  for (const record of records) {
    const key = keyFn(record)?.trim();
    if (!key) continue;
    const normalized = key.toLowerCase();
    const bucket = buckets.get(normalized) ?? [];
    bucket.push(record);
    buckets.set(normalized, bucket);
  }

  return [...buckets.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({
      entity,
      matchKey: matchKeyLabel ? `${matchKeyLabel}: ${key}` : key,
      matchType: "exact" as const,
      records: items.map((item) => ({
        id: item.id,
        label: item.label,
        meta: item.meta,
      })),
    }));
}

export function findFuzzyDuplicateGroups<T extends { id: string; label: string; meta?: string }>(
  entity: DuplicateEntity,
  records: T[],
  threshold = 0.85,
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    if (visited.has(records[i].id)) continue;

    const cluster = [records[i]];
    for (let j = i + 1; j < records.length; j++) {
      if (visited.has(records[j].id)) continue;
      const score = stringSimilarity(records[i].label, records[j].label);
      if (score >= threshold) {
        cluster.push(records[j]);
        visited.add(records[j].id);
      }
    }

    if (cluster.length > 1) {
      cluster.forEach((item) => visited.add(item.id));
      groups.push({
        entity,
        matchKey: `Tên tương tự (${Math.round(threshold * 100)}%+)`,
        matchType: "fuzzy",
        records: cluster.map((item) => ({
          id: item.id,
          label: item.label,
          meta: item.meta,
        })),
      });
    }
  }

  return groups;
}
