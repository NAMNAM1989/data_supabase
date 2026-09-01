export const APP_SETTINGS = {
  appName: "NAM NAM DATA",
  companyName: "Nam Nam Logistics",
  version: "0.1.0",
  defaultLocale: "vi-VN",
  defaultPageSize: 25,
  auditRetentionDays: 365,
  allowViewerExport: true,
} as const;

export type AppSettings = typeof APP_SETTINGS;
