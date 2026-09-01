"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Car,
  MapPin,
  Package,
  Search,
  Users,
  UsersRound,
} from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/hooks/use-global-search";
import type { SearchEntity } from "@/lib/search/global-search";

const ENTITY_LABELS: Record<SearchEntity, string> = {
  customer: "Customers",
  party: "Parties",
  driver: "Drivers",
  vehicle: "Vehicles",
  commodity: "Commodities",
  destination: "Destinations",
};

const ENTITY_ICONS: Record<SearchEntity, React.ComponentType<{ className?: string }>> = {
  customer: Building2,
  party: UsersRound,
  driver: Users,
  vehicle: Car,
  commodity: Package,
  destination: MapPin,
};

export function GlobalSearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data, isFetching } = useGlobalSearch(query, open);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const grouped = data?.grouped;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden w-full max-w-xl items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-left text-sm text-muted-foreground md:flex"
      >
        <Search className="size-4" />
        <span className="flex-1">Tìm customers, party, driver, vehicle...</span>
        <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Global Search" description="Tìm kiếm cross-entity">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nhập ít nhất 2 ký tự..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.trim().length < 2 ? (
              <CommandEmpty>Nhập ít nhất 2 ký tự để tìm</CommandEmpty>
            ) : isFetching ? (
              <CommandEmpty>Đang tìm...</CommandEmpty>
            ) : !data?.results.length ? (
              <CommandEmpty>Không có kết quả</CommandEmpty>
            ) : (
              (Object.keys(ENTITY_LABELS) as SearchEntity[]).map((entity, index) => {
                const items = grouped?.[entity] ?? [];
                if (!items.length) return null;
                const Icon = ENTITY_ICONS[entity];
                return (
                  <div key={entity}>
                    {index > 0 ? <CommandSeparator /> : null}
                    <CommandGroup heading={ENTITY_LABELS[entity]}>
                      {items.map((item) => (
                        <CommandItem
                          key={`${item.entity}-${item.id}`}
                          value={`${item.title} ${item.subtitle ?? ""}`}
                          onSelect={() => handleSelect(item.href)}
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{item.title}</span>
                            {item.subtitle ? (
                              <span className="truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            ) : null}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                );
              })
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
