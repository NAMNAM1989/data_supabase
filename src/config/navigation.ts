import {
  Building2,
  Car,
  ClipboardList,
  Database,
  FileInput,
  FileOutput,
  GitMerge,
  LayoutDashboard,
  MapPin,
  Package,
  Search,
  Settings,
  Shield,
  Truck,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const mainNavigation: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "MASTER DATA",
    items: [
      { title: "Customers", href: "/customers", icon: Building2 },
      { title: "Parties", href: "/parties", icon: UsersRound },
      { title: "Commodities", href: "/commodities", icon: Package },
    ],
  },
  {
    label: "TRANSPORT",
    items: [
      { title: "Drivers", href: "/drivers", icon: Users },
      { title: "Vehicles", href: "/vehicles", icon: Car },
      { title: "Driver ↔ Vehicle", href: "/driver-vehicles", icon: Truck },
    ],
  },
  {
    label: "REFERENCE",
    items: [{ title: "Destinations", href: "/destinations", icon: MapPin }],
  },
  {
    label: "DATA TOOLS",
    items: [
      { title: "Import", href: "/import", icon: FileInput },
      { title: "Export", href: "/export", icon: FileOutput },
      { title: "Duplicate Center", href: "/duplicates", icon: GitMerge },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Audit Logs", href: "/audit-logs", icon: ClipboardList },
      { title: "Users", href: "/users", icon: Shield },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const appBrand = {
  name: "NAM NAM DATA",
  tagline: "Master Data Management",
  icon: Database,
  searchPlaceholder: "Tìm customers, party, driver, vehicle...",
  searchIcon: Search,
};
