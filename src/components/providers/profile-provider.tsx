"use client";

import { createContext, useContext } from "react";

import type { AppRole } from "@/types/auth";

type ProfileContextValue = {
  role: AppRole;
  /** Auth / profile user id — dùng so sánh “không đổi role/status của chính mình”. */
  id: string | null;
};

const ProfileContext = createContext<ProfileContextValue>({
  role: "VIEWER",
  id: null,
});

export function ProfileProvider({
  role,
  id = null,
  children,
}: {
  role: AppRole;
  id?: string | null;
  children: React.ReactNode;
}) {
  return (
    <ProfileContext.Provider value={{ role, id }}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
