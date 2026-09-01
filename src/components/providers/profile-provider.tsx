"use client";

import { createContext, useContext } from "react";

import type { AppRole } from "@/types/auth";

type ProfileContextValue = {
  role: AppRole;
};

const ProfileContext = createContext<ProfileContextValue>({ role: "VIEWER" });

export function ProfileProvider({
  role,
  children,
}: {
  role: AppRole;
  children: React.ReactNode;
}) {
  return <ProfileContext.Provider value={{ role }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
