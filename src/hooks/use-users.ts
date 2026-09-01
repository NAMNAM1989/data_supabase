"use client";

import { useQuery } from "@tanstack/react-query";

import { listUsersAction } from "@/app/(app)/users/actions";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const result = await listUsersAction();
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });
}
