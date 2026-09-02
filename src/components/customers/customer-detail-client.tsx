"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archiveCustomerAction,
  linkCommodityAction,
  linkDriverPreferenceAction,
  linkPartyAction,
  linkVehiclePreferenceAction,
  restoreCustomerAction,
  setDefaultCommodityAction,
  setDefaultDriverPreferenceAction,
  setDefaultPartyAction,
  setDefaultVehiclePreferenceAction,
  unlinkCommodityAction,
  unlinkDriverPreferenceAction,
  unlinkPartyAction,
  unlinkVehiclePreferenceAction,
  updateCommodityRelationAction,
  updateCustomerAction,
  updateDriverPreferenceAction,
  updatePartyRelationAction,
  updateVehiclePreferenceAction,
} from "@/app/(app)/customers/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { DetailEditHint, EditRowButton } from "@/components/shared/edit-row-actions";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCustomer,
  useCustomerCommodities,
  useCustomerConsignees,
  useCustomerDrivers,
  useCustomerShippers,
  useCustomerVehicles,
} from "@/hooks/use-customers";
import { useCommodities } from "@/hooks/use-commodities";
import { useDestinations } from "@/hooks/use-destinations";
import { useDrivers } from "@/hooks/use-drivers";
import { useParties } from "@/hooks/use-parties";
import { useVehicles } from "@/hooks/use-vehicles";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import { CUSTOMER_TYPES } from "@/lib/validation/customer";
import type { Tables } from "@/types/database";

type CustomerDetailClientProps = {
  customerId: string;
};

type CustomerRecord = Tables<"customers">;

export function CustomerDetailClient({ customerId }: CustomerDetailClientProps) {
  const { role } = useProfile();
  const { data: customer, isLoading, refetch } = useCustomer(customerId);
  const shippers = useCustomerShippers(customerId);
  const consignees = useCustomerConsignees(customerId);
  const commodities = useCustomerCommodities(customerId);
  const preferredDrivers = useCustomerDrivers(customerId);
  const preferredVehicles = useCustomerVehicles(customerId);
  const [saving, setSaving] = useState(false);
  const [customerType, setCustomerType] = useState<string>("");
  const [status, setStatus] = useState<string>("ACTIVE");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return <p className="text-muted-foreground">Không tìm thấy customer.</p>;
  }

  const record: CustomerRecord = customer;
  const formCustomerType = customerType || record.customer_type || "DIRECT_SHIPPER";
  const formStatus = status || record.status;

  async function handleUpdate(formData: FormData) {
    setSaving(true);
    const result = await updateCustomerAction(customerId, {
      code: formData.get("code"),
      name: formData.get("name"),
      short_name: formData.get("short_name"),
      customer_type: formCustomerType,
      tax_code: formData.get("tax_code"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      notes: formData.get("notes"),
      status: formStatus as CustomerRecord["status"],
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã cập nhật");
    refetch();
  }

  async function handleArchive() {
    const result =
      record.status === "ARCHIVED"
        ? await restoreCustomerAction(customerId)
        : await archiveCustomerAction(customerId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(record.status === "ARCHIVED" ? "Đã restore" : "Đã archive");
    refetch();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Customers
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{record.name}</h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{record.code}</p>
        </div>
        {canPerform(role, "archive") ? (
          <Button variant="outline" onClick={handleArchive}>
            {record.status === "ARCHIVED" ? "Restore" : "Archive"}
          </Button>
        ) : null}
      </div>

      <DetailEditHint canEdit={canWrite(role)} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shippers">Shippers</TabsTrigger>
          <TabsTrigger value="consignees">Consignees</TabsTrigger>
          <TabsTrigger value="commodities">Commodities</TabsTrigger>
          <TabsTrigger value="drivers">Preferred Drivers</TabsTrigger>
          <TabsTrigger value="vehicles">Preferred Vehicles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin Customer</CardTitle>
            </CardHeader>
            <CardContent>
              {canWrite(role) ? (
                <form action={handleUpdate} className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="code">Code</Label>
                    <Input id="code" name="code" defaultValue={record.code} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Type</Label>
                    <Select
                      value={formCustomerType}
                      onValueChange={(v) => setCustomerType(v ?? "DIRECT_SHIPPER")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOMER_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" defaultValue={record.name} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="short_name">Short Name</Label>
                    <Input id="short_name" name="short_name" defaultValue={record.short_name ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Status</Label>
                    <Select value={formStatus} onValueChange={(v) => setStatus(v ?? "ACTIVE")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                        <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tax_code">Tax Code</Label>
                    <Input id="tax_code" name="tax_code" defaultValue={record.tax_code ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" defaultValue={record.phone ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" defaultValue={record.email ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" defaultValue={record.address ?? ""} rows={2} />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" defaultValue={record.notes ?? ""} rows={3} />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-3 md:grid-cols-2">
                  <DetailItem label="Code" value={record.code} />
                  <DetailItem label="Type" value={record.customer_type} />
                  <DetailItem label="Tax Code" value={record.tax_code} />
                  <DetailItem label="Phone" value={record.phone} />
                  <DetailItem label="Email" value={record.email} />
                  <DetailItem label="Address" value={record.address} className="md:col-span-2" />
                  <DetailItem label="Notes" value={record.notes} className="md:col-span-2" />
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shippers">
          <PartyRelationTab
            customerId={customerId}
            role="SHIPPER"
            rows={shippers.data ?? []}
            loading={shippers.isLoading}
            canEdit={canWrite(role)}
            onChanged={() => shippers.refetch()}
          />
        </TabsContent>

        <TabsContent value="consignees">
          <PartyRelationTab
            customerId={customerId}
            role="CONSIGNEE"
            rows={consignees.data ?? []}
            loading={consignees.isLoading}
            canEdit={canWrite(role)}
            onChanged={() => consignees.refetch()}
          />
        </TabsContent>

        <TabsContent value="commodities">
          <CommodityRelationTab
            customerId={customerId}
            rows={commodities.data ?? []}
            loading={commodities.isLoading}
            canEdit={canWrite(role)}
            onChanged={() => commodities.refetch()}
          />
        </TabsContent>

        <TabsContent value="drivers">
          <DriverPreferenceTab
            customerId={customerId}
            rows={preferredDrivers.data ?? []}
            loading={preferredDrivers.isLoading}
            canEdit={canWrite(role)}
            onChanged={() => preferredDrivers.refetch()}
          />
        </TabsContent>

        <TabsContent value="vehicles">
          <VehiclePreferenceTab
            customerId={customerId}
            rows={preferredVehicles.data ?? []}
            loading={preferredVehicles.isLoading}
            canEdit={canWrite(role)}
            onChanged={() => preferredVehicles.refetch()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

function PartyRelationTab({
  customerId,
  role,
  rows,
  loading,
  canEdit,
  onChanged,
}: {
  customerId: string;
  role: "SHIPPER" | "CONSIGNEE";
  rows: Array<{
    id: string;
    is_default: boolean;
    party: { id: string; name: string; address: string | null };
    destination: { id: string; iata_code: string } | null;
  }>;
  loading: boolean;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const parties = useParties();
  const destinations = useDestinations();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [partyId, setPartyId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<(typeof rows)[number] | null>(null);
  const [editPartyId, setEditPartyId] = useState("");
  const [editDestinationId, setEditDestinationId] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  function openEdit(row: (typeof rows)[number]) {
    setEditRow(row);
    setEditPartyId(row.party.id);
    setEditDestinationId(row.destination?.id ?? "");
    setEditIsDefault(row.is_default);
  }

  async function handleLink(formData: FormData) {
    setSaving(true);
    const result = await linkPartyAction({
      customer_id: customerId,
      role,
      party_id: mode === "existing" ? partyId : undefined,
      destination_id: role === "CONSIGNEE" && destinationId ? destinationId : null,
      new_party:
        mode === "new"
          ? {
              name: String(formData.get("party_name") ?? ""),
              address: String(formData.get("party_address") ?? ""),
              phone: String(formData.get("party_phone") ?? ""),
              email: String(formData.get("party_email") ?? ""),
            }
          : undefined,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã thêm party");
    setOpen(false);
    onChanged();
  }

  async function handleUpdate() {
    if (!editRow || !editPartyId) {
      toast.error("Chọn party");
      return;
    }
    setEditSaving(true);
    const result = await updatePartyRelationAction({
      relation_id: editRow.id,
      customer_id: customerId,
      party_id: editPartyId,
      destination_id: role === "CONSIGNEE" && editDestinationId ? editDestinationId : null,
      is_default: editIsDefault,
    });
    setEditSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã cập nhật liên kết");
    setEditRow(null);
    onChanged();
  }

  async function handleUnlink(relationId: string, name: string) {
    if (!confirm(`Gỡ liên kết party "${name}"?`)) return;
    const result = await unlinkPartyAction(relationId, customerId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gỡ liên kết");
      onChanged();
    }
  }

  async function handleSetDefault(relationId: string) {
    const result = await setDefaultPartyAction(relationId, customerId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã đặt mặc định");
      onChanged();
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{role === "SHIPPER" ? "Shippers" : "Consignees"}</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              Add {role === "SHIPPER" ? "Shipper" : "Consignee"}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm {role}</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>
                  Chọn có sẵn
                </Button>
                <Button type="button" size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>
                  Tạo mới
                </Button>
              </div>
              <form action={handleLink} className="flex flex-col gap-3">
                {mode === "existing" ? (
                  <div className="flex flex-col gap-2">
                    <Label>Party</Label>
                    <Select value={partyId} onValueChange={(v) => setPartyId(v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn party" />
                      </SelectTrigger>
                      <SelectContent>
                        {(parties.data ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="party_name">Party Name *</Label>
                      <Input id="party_name" name="party_name" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="party_address">Address</Label>
                      <Textarea id="party_address" name="party_address" rows={2} />
                    </div>
                  </>
                )}
                {role === "CONSIGNEE" ? (
                  <div className="flex flex-col gap-2">
                    <Label>Destination</Label>
                    <Select value={destinationId} onValueChange={(v) => setDestinationId(v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn IATA (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {(destinations.data ?? []).map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.iata_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Party</TableHead>
              {role === "CONSIGNEE" ? <TableHead>Destination</TableHead> : null}
              <TableHead>Default</TableHead>
              {canEdit ? <TableHead className="w-40">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.party.name}</div>
                    <div className="text-xs text-muted-foreground">{row.party.address}</div>
                  </TableCell>
                  {role === "CONSIGNEE" ? (
                    <TableCell>{row.destination?.iata_code ?? "—"}</TableCell>
                  ) : null}
                  <TableCell>{row.is_default ? "Yes" : "—"}</TableCell>
                  {canEdit ? (
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <EditRowButton label={row.party.name} onClick={() => openEdit(row)} />
                        <IconActionButton
                          label="Đặt mặc định"
                          tooltip="Đặt mặc định"
                          onClick={() => handleSetDefault(row.id)}
                        >
                          <Star />
                        </IconActionButton>
                        <IconActionButton
                          label={`Gỡ liên kết ${row.party.name}`}
                          tooltip={`Gỡ liên kết ${row.party.name}`}
                          onClick={() => handleUnlink(row.id, row.party.name)}
                        >
                          <Trash2 />
                        </IconActionButton>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={Boolean(editRow)} onOpenChange={(next) => !next && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa liên kết {editRow?.party.name}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label>Party</Label>
                <Select value={editPartyId} onValueChange={(v) => setEditPartyId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn party" />
                  </SelectTrigger>
                  <SelectContent>
                    {(parties.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {role === "CONSIGNEE" ? (
                <div className="flex flex-col gap-2">
                  <Label>Destination</Label>
                  <Select
                    value={editDestinationId}
                    onValueChange={(v) => setEditDestinationId(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn IATA (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(destinations.data ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.iata_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editIsDefault}
                  onChange={(e) => setEditIsDefault(e.target.checked)}
                />
                Mặc định
              </label>
              <div className="flex gap-2">
                <Button type="button" onClick={handleUpdate} disabled={editSaving}>
                  {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditRow(null)} disabled={editSaving}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CommodityRelationTab({
  customerId,
  rows,
  loading,
  canEdit,
  onChanged,
}: {
  customerId: string;
  rows: Array<{
    id: string;
    is_default: boolean;
    custom_description: string | null;
    commodity: { id: string; name: string; code: string | null };
  }>;
  loading: boolean;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const allCommodities = useCommodities();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [commodityId, setCommodityId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<(typeof rows)[number] | null>(null);
  const [editCommodityId, setEditCommodityId] = useState("");
  const [editCustomDescription, setEditCustomDescription] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  function openEdit(row: (typeof rows)[number]) {
    setEditRow(row);
    setEditCommodityId(row.commodity.id);
    setEditCustomDescription(row.custom_description ?? "");
    setEditIsDefault(row.is_default);
  }

  async function handleLink(formData: FormData) {
    setSaving(true);
    const result = await linkCommodityAction({
      customer_id: customerId,
      commodity_id: mode === "existing" ? commodityId : undefined,
      custom_description: String(formData.get("custom_description") ?? "") || undefined,
      new_commodity:
        mode === "new"
          ? {
              name: String(formData.get("commodity_name") ?? ""),
              code: String(formData.get("commodity_code") ?? ""),
            }
          : undefined,
    });
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã thêm commodity");
      setOpen(false);
      onChanged();
    }
  }

  async function handleUpdate() {
    if (!editRow || !editCommodityId) {
      toast.error("Chọn commodity");
      return;
    }
    setEditSaving(true);
    const result = await updateCommodityRelationAction({
      relation_id: editRow.id,
      customer_id: customerId,
      commodity_id: editCommodityId,
      custom_description: editCustomDescription || null,
      is_default: editIsDefault,
    });
    setEditSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã cập nhật commodity");
    setEditRow(null);
    onChanged();
  }

  async function handleUnlink(relationId: string, name: string) {
    if (!confirm(`Gỡ liên kết commodity "${name}"?`)) return;
    const result = await unlinkCommodityAction(relationId, customerId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gỡ liên kết");
      onChanged();
    }
  }

  async function handleSetDefault(relationId: string) {
    const result = await setDefaultCommodityAction(relationId, customerId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã đặt mặc định");
      onChanged();
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Commodities</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>Add Commodity</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm Commodity</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>
                  Chọn có sẵn
                </Button>
                <Button type="button" size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>
                  Tạo mới
                </Button>
              </div>
              <form action={handleLink} className="flex flex-col gap-3">
                {mode === "existing" ? (
                  <div className="flex flex-col gap-2">
                    <Label>Commodity</Label>
                    <Select value={commodityId} onValueChange={(v) => setCommodityId(v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn commodity" />
                      </SelectTrigger>
                      <SelectContent>
                        {(allCommodities.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code ? `${c.code} — ` : ""}
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="commodity_name">Name *</Label>
                      <Input id="commodity_name" name="commodity_name" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="commodity_code">Code</Label>
                      <Input id="commodity_code" name="commodity_code" />
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="custom_description">Custom Description</Label>
                  <Input id="custom_description" name="custom_description" />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commodity</TableHead>
              <TableHead>Custom Description</TableHead>
              <TableHead>Default</TableHead>
              {canEdit ? <TableHead className="w-40">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.commodity.name}</div>
                    <div className="text-xs text-muted-foreground">{row.commodity.code}</div>
                  </TableCell>
                  <TableCell>{row.custom_description ?? "—"}</TableCell>
                  <TableCell>{row.is_default ? "Yes" : "—"}</TableCell>
                  {canEdit ? (
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <EditRowButton label={row.commodity.name} onClick={() => openEdit(row)} />
                        <IconActionButton
                          label="Đặt mặc định"
                          tooltip="Đặt mặc định"
                          onClick={() => handleSetDefault(row.id)}
                        >
                          <Star />
                        </IconActionButton>
                        <IconActionButton
                          label={`Gỡ liên kết ${row.commodity.name}`}
                          tooltip={`Gỡ liên kết ${row.commodity.name}`}
                          onClick={() => handleUnlink(row.id, row.commodity.name)}
                        >
                          <Trash2 />
                        </IconActionButton>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Chưa có commodity
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={Boolean(editRow)} onOpenChange={(next) => !next && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa commodity {editRow?.commodity.name}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label>Commodity</Label>
                <Select value={editCommodityId} onValueChange={(v) => setEditCommodityId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    {(allCommodities.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code ? `${c.code} — ` : ""}
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_custom_description">Custom Description</Label>
                <Input
                  id="edit_custom_description"
                  value={editCustomDescription}
                  onChange={(e) => setEditCustomDescription(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editIsDefault}
                  onChange={(e) => setEditIsDefault(e.target.checked)}
                />
                Mặc định
              </label>
              <div className="flex gap-2">
                <Button type="button" onClick={handleUpdate} disabled={editSaving}>
                  {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditRow(null)} disabled={editSaving}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DriverPreferenceTab({
  customerId,
  rows,
  loading,
  canEdit,
  onChanged,
}: {
  customerId: string;
  rows: Array<{
    id: string;
    is_default: boolean;
    driver: { id: string; full_name: string; phone: string | null };
  }>;
  loading: boolean;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const allDrivers = useDrivers();
  const [open, setOpen] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<(typeof rows)[number] | null>(null);
  const [editDriverId, setEditDriverId] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  function openEdit(row: (typeof rows)[number]) {
    setEditRow(row);
    setEditDriverId(row.driver.id);
    setEditIsDefault(row.is_default);
  }

  async function handleLink() {
    if (!driverId) {
      toast.error("Chọn driver");
      return;
    }
    setSaving(true);
    const result = await linkDriverPreferenceAction({ customer_id: customerId, driver_id: driverId });
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã thêm driver ưu tiên");
      setOpen(false);
      onChanged();
    }
  }

  async function handleUpdate() {
    if (!editRow || !editDriverId) {
      toast.error("Chọn driver");
      return;
    }
    setEditSaving(true);
    const result = await updateDriverPreferenceAction({
      relation_id: editRow.id,
      customer_id: customerId,
      driver_id: editDriverId,
      is_default: editIsDefault,
    });
    setEditSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã cập nhật driver ưu tiên");
    setEditRow(null);
    onChanged();
  }

  async function handleUnlink(relationId: string, name: string) {
    if (!confirm(`Gỡ liên kết driver "${name}"?`)) return;
    const result = await unlinkDriverPreferenceAction(relationId, customerId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gỡ");
      onChanged();
    }
  }

  async function handleSetDefault(relationId: string) {
    const result = await setDefaultDriverPreferenceAction(relationId, customerId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã đặt mặc định");
      onChanged();
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Preferred Drivers</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>Add Driver</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm driver ưu tiên</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Driver</Label>
                  <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {(allDrivers.data ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleLink} disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Default</TableHead>
              {canEdit ? <TableHead className="w-40">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/drivers/${row.driver.id}`} className="hover:underline">
                      {row.driver.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.driver.phone ?? "—"}</TableCell>
                  <TableCell>{row.is_default ? "Yes" : "—"}</TableCell>
                  {canEdit ? (
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <EditRowButton label={row.driver.full_name} onClick={() => openEdit(row)} />
                        <IconActionButton
                          label="Đặt mặc định"
                          tooltip="Đặt mặc định"
                          onClick={() => handleSetDefault(row.id)}
                        >
                          <Star />
                        </IconActionButton>
                        <IconActionButton
                          label={`Gỡ liên kết ${row.driver.full_name}`}
                          tooltip={`Gỡ liên kết ${row.driver.full_name}`}
                          onClick={() => handleUnlink(row.id, row.driver.full_name)}
                        >
                          <Trash2 />
                        </IconActionButton>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Chưa có driver ưu tiên
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={Boolean(editRow)} onOpenChange={(next) => !next && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa driver ưu tiên {editRow?.driver.full_name}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label>Driver</Label>
                <Select value={editDriverId} onValueChange={(v) => setEditDriverId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {(allDrivers.data ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editIsDefault}
                  onChange={(e) => setEditIsDefault(e.target.checked)}
                />
                Mặc định
              </label>
              <div className="flex gap-2">
                <Button type="button" onClick={handleUpdate} disabled={editSaving}>
                  {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditRow(null)} disabled={editSaving}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function VehiclePreferenceTab({
  customerId,
  rows,
  loading,
  canEdit,
  onChanged,
}: {
  customerId: string;
  rows: Array<{
    id: string;
    is_default: boolean;
    vehicle: { id: string; plate_number: string; plate_display: string | null };
  }>;
  loading: boolean;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const allVehicles = useVehicles();
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<(typeof rows)[number] | null>(null);
  const [editVehicleId, setEditVehicleId] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  function openEdit(row: (typeof rows)[number]) {
    setEditRow(row);
    setEditVehicleId(row.vehicle.id);
    setEditIsDefault(row.is_default);
  }

  async function handleLink() {
    if (!vehicleId) {
      toast.error("Chọn vehicle");
      return;
    }
    setSaving(true);
    const result = await linkVehiclePreferenceAction({ customer_id: customerId, vehicle_id: vehicleId });
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã thêm vehicle ưu tiên");
      setOpen(false);
      onChanged();
    }
  }

  async function handleUpdate() {
    if (!editRow || !editVehicleId) {
      toast.error("Chọn vehicle");
      return;
    }
    setEditSaving(true);
    const result = await updateVehiclePreferenceAction({
      relation_id: editRow.id,
      customer_id: customerId,
      vehicle_id: editVehicleId,
      is_default: editIsDefault,
    });
    setEditSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã cập nhật vehicle ưu tiên");
    setEditRow(null);
    onChanged();
  }

  async function handleUnlink(relationId: string, name: string) {
    if (!confirm(`Gỡ liên kết vehicle "${name}"?`)) return;
    const result = await unlinkVehiclePreferenceAction(relationId, customerId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gỡ");
      onChanged();
    }
  }

  async function handleSetDefault(relationId: string) {
    const result = await setDefaultVehiclePreferenceAction(relationId, customerId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã đặt mặc định");
      onChanged();
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Preferred Vehicles</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>Add Vehicle</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm vehicle ưu tiên</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Vehicle</Label>
                  <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {(allVehicles.data ?? []).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate_display ?? v.plate_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleLink} disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate</TableHead>
              <TableHead>Default</TableHead>
              {canEdit ? <TableHead className="w-40">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
            ) : rows.length ? (
              rows.map((row) => {
                const plate = row.vehicle.plate_display ?? row.vehicle.plate_number;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/vehicles/${row.vehicle.id}`} className="hover:underline">
                        {plate}
                      </Link>
                    </TableCell>
                    <TableCell>{row.is_default ? "Yes" : "—"}</TableCell>
                    {canEdit ? (
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <EditRowButton label={plate} onClick={() => openEdit(row)} />
                          <IconActionButton
                            label="Đặt mặc định"
                            tooltip="Đặt mặc định"
                            onClick={() => handleSetDefault(row.id)}
                          >
                            <Star />
                          </IconActionButton>
                          <IconActionButton
                            label={`Gỡ liên kết ${plate}`}
                            tooltip={`Gỡ liên kết ${plate}`}
                            onClick={() => handleUnlink(row.id, plate)}
                          >
                            <Trash2 />
                          </IconActionButton>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Chưa có vehicle ưu tiên
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={Boolean(editRow)} onOpenChange={(next) => !next && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Sửa vehicle ưu tiên{" "}
              {editRow ? editRow.vehicle.plate_display ?? editRow.vehicle.plate_number : ""}
            </DialogTitle>
          </DialogHeader>
          {editRow ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label>Vehicle</Label>
                <Select value={editVehicleId} onValueChange={(v) => setEditVehicleId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {(allVehicles.data ?? []).map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate_display ?? v.plate_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editIsDefault}
                  onChange={(e) => setEditIsDefault(e.target.checked)}
                />
                Mặc định
              </label>
              <div className="flex gap-2">
                <Button type="button" onClick={handleUpdate} disabled={editSaving}>
                  {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditRow(null)} disabled={editSaving}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
