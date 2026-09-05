"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteCustomersAction,
  linkCommodityAction,
  linkDriverPreferenceAction,
  linkPartyAction,
  linkVehiclePreferenceAction,
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
  upsertCustomerEsidProfileAction,
} from "@/app/(app)/customers/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailEditHint, EditRowButton } from "@/components/shared/edit-row-actions";
import { EntitySelect } from "@/components/shared/entity-select";
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
  useCustomerAgents,
  useCustomerCommodities,
  useCustomerConsignees,
  useCustomerDrivers,
  useCustomerEsidProfile,
  useCustomerNotifies,
  useCustomerShippers,
  useCustomerVehicles,
} from "@/hooks/use-customers";
import { useCommodities } from "@/hooks/use-commodities";
import { useDestinations } from "@/hooks/use-destinations";
import { useDrivers } from "@/hooks/use-drivers";
import { useParties } from "@/hooks/use-parties";
import { useSubmitLock } from "@/hooks/use-submit-lock";
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
  const router = useRouter();
  const { data: customer, isLoading, refetch } = useCustomer(customerId);
  const shippers = useCustomerShippers(customerId);
  const consignees = useCustomerConsignees(customerId);
  const agents = useCustomerAgents(customerId);
  const notifies = useCustomerNotifies(customerId);
  const esidProfile = useCustomerEsidProfile(customerId);
  const commodities = useCustomerCommodities(customerId);
  const preferredDrivers = useCustomerDrivers(customerId);
  const preferredVehicles = useCustomerVehicles(customerId);
  const [saving, setSaving] = useState(false);
  const [customerType, setCustomerType] = useState<string>("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  async function handleDelete() {
    const result = await deleteCustomersAction([customerId]);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã xóa vĩnh viễn customer");
    router.push("/customers");
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
        {canPerform(role, "delete") ? (
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive"
          >
            Xóa vĩnh viễn
          </Button>
        ) : null}
      </div>

      <DetailEditHint canEdit={canWrite(role)} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Xóa vĩnh viễn customer "${record.code} — ${record.name}"`}
        description="Thao tác này xóa hẳn khỏi hệ thống, không thể khôi phục. Quan hệ liên kết cũng bị xóa."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="esid">ESID Profile</TabsTrigger>
          <TabsTrigger value="shippers">Shippers</TabsTrigger>
          <TabsTrigger value="consignees">Consignees</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="notifies">Notify</TabsTrigger>
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

        <TabsContent value="esid">
          <EsidProfileTab
            customerId={customerId}
            profile={esidProfile.data}
            loading={esidProfile.isLoading}
            canEdit={canWrite(role)}
            onChanged={() => esidProfile.refetch()}
          />
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

        <TabsContent value="agents">
          <PartyRelationTab
            customerId={customerId}
            role="AGENT"
            rows={agents.data ?? []}
            loading={agents.isLoading}
            canEdit={canWrite(role)}
            onChanged={() => agents.refetch()}
          />
        </TabsContent>

        <TabsContent value="notifies">
          <PartyRelationTab
            customerId={customerId}
            role="NOTIFY"
            rows={notifies.data ?? []}
            loading={notifies.isLoading}
            canEdit={canWrite(role)}
            onChanged={() => notifies.refetch()}
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

function EsidProfileTab({
  customerId,
  profile,
  loading,
  canEdit,
  onChanged,
}: {
  customerId: string;
  profile: Tables<"customer_esid_profiles"> | null | undefined;
  loading: boolean;
  canEdit: boolean;
  onChanged: () => void;
}) {
  if (loading) return <Skeleton className="h-48 w-full" />;

  // Remount form when profile finishes loading so controlled Selects sync from DB.
  return (
    <EsidProfileForm
      key={profile?.customer_id ?? `new-${customerId}`}
      customerId={customerId}
      profile={profile}
      canEdit={canEdit}
      onChanged={onChanged}
    />
  );
}

function EsidProfileForm({
  customerId,
  profile,
  canEdit,
  onChanged,
}: {
  customerId: string;
  profile: Tables<"customer_esid_profiles"> | null | undefined;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const parties = useParties();
  const destinations = useDestinations();
  const { saving, runLocked } = useSubmitLock();
  const [agentPartyId, setAgentPartyId] = useState(profile?.default_agent_party_id ?? "");
  const [notifyPartyId, setNotifyPartyId] = useState(profile?.default_notify_party_id ?? "");
  const [originId, setOriginId] = useState(profile?.default_origin_id ?? "");
  const [isConsol, setIsConsol] = useState(profile?.default_is_consol ?? false);
  const [otherHandling, setOtherHandling] = useState(profile?.default_other_handling ?? true);

  async function handleSave(formData: FormData) {
    await runLocked(async () => {
      const result = await upsertCustomerEsidProfileAction(customerId, {
        default_agent_party_id: agentPartyId || null,
        default_notify_party_id: notifyPartyId || null,
        default_origin_id: originId || null,
        default_payment_term: String(formData.get("default_payment_term") ?? ""),
        declarant_name: String(formData.get("declarant_name") ?? ""),
        declarant_phone: String(formData.get("declarant_phone") ?? ""),
        declarant_id_number: String(formData.get("declarant_id_number") ?? ""),
        default_is_consol: isConsol,
        default_other_handling: otherHandling,
        notes: String(formData.get("notes") ?? ""),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã lưu hồ sơ ESID");
      onChanged();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hồ sơ mặc định khai ESID (TCS)</CardTitle>
      </CardHeader>
      <CardContent>
        {canEdit ? (
          <form action={handleSave} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="declarant_name">Người đăng ký khai</Label>
              <Input
                id="declarant_name"
                name="declarant_name"
                defaultValue={profile?.declarant_name ?? ""}
                placeholder="#shpRegNam"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="declarant_phone">SĐT người khai</Label>
              <Input
                id="declarant_phone"
                name="declarant_phone"
                defaultValue={profile?.declarant_phone ?? ""}
                placeholder="#shpRegTel"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="declarant_id_number">CCCD/CMND người khai</Label>
              <Input
                id="declarant_id_number"
                name="declarant_id_number"
                defaultValue={profile?.declarant_id_number ?? ""}
                placeholder="#shpRegIdx"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="default_payment_term">Hình thức thanh toán</Label>
              <Input
                id="default_payment_term"
                name="default_payment_term"
                defaultValue={profile?.default_payment_term ?? "Chuyển khoản/Transfer"}
                placeholder="#codPayMod"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Origin IATA mặc định</Label>
              <EntitySelect
                value={originId}
                onValueChange={setOriginId}
                placeholder="Chọn origin (thường SGN)"
                options={(destinations.data ?? []).map((d) => ({
                  value: d.id,
                  label: `${d.iata_code} — ${d.city_name ?? d.country_code}`,
                }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Agent mặc định</Label>
              <EntitySelect
                value={agentPartyId}
                onValueChange={setAgentPartyId}
                placeholder="Chọn party Agent"
                options={(parties.data ?? []).map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>Notify mặc định (optional)</Label>
              <EntitySelect
                value={notifyPartyId}
                onValueChange={setNotifyPartyId}
                placeholder="Chọn party Notify"
                options={(parties.data ?? []).map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isConsol}
                onChange={(e) => setIsConsol(e.target.checked)}
              />
              Default Consol (#shcConsol)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={otherHandling}
                onChange={(e) => setOtherHandling(e.target.checked)}
              />
              Default Other handling (#shcOth)
            </label>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={profile?.notes ?? ""} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu hồ sơ ESID"}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-3 md:grid-cols-2">
            <DetailItem label="Người khai" value={profile?.declarant_name} />
            <DetailItem label="SĐT khai" value={profile?.declarant_phone} />
            <DetailItem label="CCCD/CMND" value={profile?.declarant_id_number} />
            <DetailItem label="Payment" value={profile?.default_payment_term} />
          </dl>
        )}
      </CardContent>
    </Card>
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
  role: "SHIPPER" | "CONSIGNEE" | "AGENT" | "NOTIFY";
  rows: Array<{
    id: string;
    is_default: boolean;
    account_number?: string | null;
    notes?: string | null;
    party: {
      id: string;
      name: string;
      address: string | null;
      branch_name?: string | null;
      contact_person?: string | null;
      contact_phone?: string | null;
      phone?: string | null;
      tax_code?: string | null;
    };
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
  const [accountNumber, setAccountNumber] = useState("");
  const [relationNotes, setRelationNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<(typeof rows)[number] | null>(null);
  const [editPartyId, setEditPartyId] = useState("");
  const [editDestinationId, setEditDestinationId] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editRelationNotes, setEditRelationNotes] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string } | null>(null);

  function openEdit(row: (typeof rows)[number]) {
    setEditRow(row);
    setEditPartyId(row.party.id);
    setEditDestinationId(row.destination?.id ?? "");
    setEditAccountNumber(row.account_number ?? "");
    setEditRelationNotes(row.notes ?? "");
    setEditIsDefault(row.is_default);
  }

  async function handleLink(formData: FormData) {
    if (mode === "existing" && !partyId) {
      toast.error("Chọn party từ danh mục Master");
      return;
    }
    setSaving(true);
    const result = await linkPartyAction({
      customer_id: customerId,
      role,
      party_id: mode === "existing" ? partyId : undefined,
      destination_id: role === "CONSIGNEE" && destinationId ? destinationId : null,
      account_number: accountNumber || null,
      notes: relationNotes || null,
      new_party:
        mode === "new"
          ? {
              name: String(formData.get("party_name") ?? ""),
              tax_code: String(formData.get("party_tax_code") ?? ""),
              address: String(formData.get("party_address") ?? ""),
              contact_person: String(formData.get("party_contact_person") ?? ""),
              contact_phone: String(formData.get("party_contact_phone") ?? ""),
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
    setPartyId("");
    setDestinationId("");
    setAccountNumber("");
    setRelationNotes("");
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
      account_number: editAccountNumber || null,
      notes: editRelationNotes || null,
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

  async function executeUnlink() {
    if (!unlinkTarget) return;
    const result = await unlinkPartyAction(unlinkTarget.id, customerId);
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
        <CardTitle className="text-base">
          {role === "SHIPPER"
            ? "Danh sách Người Gửi (Shippers)"
            : role === "CONSIGNEE"
              ? "Danh sách Người Nhận (Consignees)"
              : role === "AGENT"
                ? "Danh sách Đại Lý Khai Báo (Agents)"
                : "Bên Nhận Thông Báo (Notify Parties)"}
        </CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              Add{" "}
              {role === "SHIPPER"
                ? "Shipper"
                : role === "CONSIGNEE"
                  ? "Consignee"
                  : role === "AGENT"
                    ? "Agent"
                    : "Notify"}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm {role} cho Khách Hàng</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>
                  Chọn từ danh mục Master
                </Button>
                <Button type="button" size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>
                  Tạo mới Party
                </Button>
              </div>
              <form action={handleLink} className="grid gap-3 sm:grid-cols-2">
                {mode === "existing" ? (
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label>Chọn Party có sẵn *</Label>
                    <EntitySelect
                      value={partyId}
                      onValueChange={setPartyId}
                      placeholder="Chọn party trong hệ thống..."
                      options={(parties.data ?? []).map((p) => ({
                        value: p.id,
                        label: [p.name, p.code ? `(${p.code})` : null, p.tax_code ? `· MST: ${p.tax_code}` : null]
                          .filter(Boolean)
                          .join(" "),
                      }))}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor="party_name">Tên Công ty / Pháp nhân *</Label>
                      <Input id="party_name" name="party_name" placeholder="VD: SAMSUN LOGISTICS CO., LTD" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="party_tax_code">Mã số thuế</Label>
                      <Input id="party_tax_code" name="party_tax_code" placeholder="VD: 0312345678" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="party_phone">Điện thoại cty</Label>
                      <Input id="party_phone" name="party_phone" placeholder="VD: 028-12345678" />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor="party_address">Địa chỉ đầy đủ (Address) *</Label>
                      <Textarea id="party_address" name="party_address" rows={2} placeholder="Địa chỉ hiển thị trên AWB/ESID" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="party_contact_person">Người liên hệ</Label>
                      <Input id="party_contact_person" name="party_contact_person" placeholder="Tên điều phối/giao nhận" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="party_contact_phone">SĐT người liên hệ</Label>
                      <Input id="party_contact_phone" name="party_contact_phone" placeholder="Di động" />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor="party_email">Email nhận chứng từ</Label>
                      <Input id="party_email" name="party_email" type="email" placeholder="docs@example.com" />
                    </div>
                  </>
                )}

                {role === "CONSIGNEE" ? (
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label>Sân bay đích (Destination IATA)</Label>
                    <EntitySelect
                      value={destinationId}
                      onValueChange={setDestinationId}
                      placeholder="Chọn mã IATA sân bay đến..."
                      options={(destinations.data ?? []).map((d) => ({
                        value: d.id,
                        label: `${d.iata_code} — ${d.city_name ?? d.country_code}${d.country_name ? ` (${d.country_name})` : ""}`,
                      }))}
                    />
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="account_number">Mã tài khoản / Account No</Label>
                  <Input
                    id="account_number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={
                      role === "SHIPPER"
                        ? "VD: SHP-ACC-001"
                        : role === "CONSIGNEE"
                          ? "VD: CNEE-ACC-001"
                          : role === "AGENT"
                            ? "VD: AGT-ACC-001"
                            : "VD: NTY-ACC-001"
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="relation_notes">Ghi chú riêng cho khách hàng này</Label>
                  <Input
                    id="relation_notes"
                    value={relationNotes}
                    onChange={(e) => setRelationNotes(e.target.value)}
                    placeholder="VD: Chỉ dùng cho tuyến SGN-ICN"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu quan hệ"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Party / Pháp nhân</TableHead>
              <TableHead>Địa chỉ & Liên hệ</TableHead>
              {role === "CONSIGNEE" ? <TableHead>Destination</TableHead> : null}
              <TableHead>Mã TK / Account</TableHead>
              <TableHead>Mặc định</TableHead>
              {canEdit ? <TableHead className="w-40 text-right">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={role === "CONSIGNEE" ? 6 : 5}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-semibold text-sm">{row.party.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {row.party.tax_code ? `MST: ${row.party.tax_code}` : ""}
                      {row.party.branch_name ? ` · ${row.party.branch_name}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-xs text-muted-foreground line-clamp-2">{row.party.address || "—"}</div>
                    {row.party.contact_person ? (
                      <div className="text-xs text-primary font-medium mt-0.5">
                        LH: {row.party.contact_person} {row.party.contact_phone ? `(${row.party.contact_phone})` : ""}
                      </div>
                    ) : null}
                  </TableCell>
                  {role === "CONSIGNEE" ? (
                    <TableCell>
                      {row.destination?.iata_code ? (
                        <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded text-xs">
                          {row.destination.iata_code}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-xs font-mono">{row.account_number || "—"}</TableCell>
                  <TableCell>
                    {row.is_default ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Star className="size-3.5 fill-current" /> Mặc định
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {canEdit ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <EditRowButton label={row.party.name} onClick={() => openEdit(row)} />
                        <IconActionButton
                          label="Đặt mặc định"
                          tooltip="Đặt làm mặc định"
                          onClick={() => handleSetDefault(row.id)}
                        >
                          <Star />
                        </IconActionButton>
                        <IconActionButton
                          label={`Gỡ liên kết ${row.party.name}`}
                          tooltip="Gỡ liên kết"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setUnlinkTarget({ id: row.id, name: row.party.name })}
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
                <TableCell colSpan={role === "CONSIGNEE" ? 6 : 5} className="text-center text-muted-foreground py-6">
                  Chưa có {role.toLowerCase()} nào được liên kết
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={Boolean(editRow)} onOpenChange={(next) => !next && setEditRow(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa liên kết: {editRow?.party.name}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Thay đổi Party liên kết</Label>
                <EntitySelect
                  value={editPartyId}
                  onValueChange={setEditPartyId}
                  placeholder="Chọn party"
                  options={(parties.data ?? []).map((p) => ({
                    value: p.id,
                    label: `${p.name}${p.tax_code ? ` · MST: ${p.tax_code}` : ""}`,
                  }))}
                />
              </div>
              {role === "CONSIGNEE" ? (
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label>Sân bay đến (Destination IATA)</Label>
                  <EntitySelect
                    value={editDestinationId}
                    onValueChange={setEditDestinationId}
                    placeholder="Chọn IATA..."
                    options={(destinations.data ?? []).map((d) => ({
                      value: d.id,
                      label: `${d.iata_code} — ${d.city_name ?? d.country_code}`,
                    }))}
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_account_number">Mã tài khoản (Account No)</Label>
                <Input
                  id="edit_account_number"
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value)}
                  placeholder="VD: ACC-123"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_relation_notes">Ghi chú quan hệ</Label>
                <Input
                  id="edit_relation_notes"
                  value={editRelationNotes}
                  onChange={(e) => setEditRelationNotes(e.target.value)}
                  placeholder="Ghi chú điều phối..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsDefault}
                    onChange={(e) => setEditIsDefault(e.target.checked)}
                  />
                  Đặt làm {role.toLowerCase()} mặc định cho khách hàng này
                </label>
              </div>

              <div className="flex gap-2 sm:col-span-2 pt-2">
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

      <ConfirmDialog
        open={Boolean(unlinkTarget)}
        onOpenChange={(v) => !v && setUnlinkTarget(null)}
        title={`Gỡ liên kết "${unlinkTarget?.name}"?`}
        description={`Bạn có chắc muốn gỡ liên kết ${role.toLowerCase()} này khỏi khách hàng? Dữ liệu Master Party gốc vẫn được giữ nguyên trong hệ thống.`}
        confirmLabel="Gỡ liên kết"
        onConfirm={executeUnlink}
      />
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
    package_type?: string | null;
    special_instructions?: string | null;
    commodity: {
      id: string;
      name: string;
      code: string | null;
      english_name?: string | null;
      cargo_type?: string | null;
      is_dg?: boolean;
    };
  }>;
  loading: boolean;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const allCommodities = useCommodities();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [commodityId, setCommodityId] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [packageType, setPackageType] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<(typeof rows)[number] | null>(null);
  const [editCommodityId, setEditCommodityId] = useState("");
  const [editCustomDescription, setEditCustomDescription] = useState("");
  const [editPackageType, setEditPackageType] = useState("");
  const [editSpecialInstructions, setEditSpecialInstructions] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string } | null>(null);

  function openEdit(row: (typeof rows)[number]) {
    setEditRow(row);
    setEditCommodityId(row.commodity.id);
    setEditCustomDescription(row.custom_description ?? "");
    setEditPackageType(row.package_type ?? "");
    setEditSpecialInstructions(row.special_instructions ?? "");
    setEditIsDefault(row.is_default);
  }

  async function handleLink(formData: FormData) {
    if (mode === "existing" && !commodityId) {
      toast.error("Chọn commodity từ danh mục Master");
      return;
    }
    setSaving(true);
    const result = await linkCommodityAction({
      customer_id: customerId,
      commodity_id: mode === "existing" ? commodityId : undefined,
      custom_description: customDescription || undefined,
      package_type: packageType || undefined,
      special_instructions: specialInstructions || undefined,
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
      toast.success("Đã thêm commodity cho khách hàng");
      setOpen(false);
      setCommodityId("");
      setCustomDescription("");
      setPackageType("");
      setSpecialInstructions("");
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
      package_type: editPackageType || null,
      special_instructions: editSpecialInstructions || null,
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

  async function executeUnlink() {
    if (!unlinkTarget) return;
    const result = await unlinkCommodityAction(unlinkTarget.id, customerId);
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
        <div>
          <CardTitle className="text-base">Danh mục Hàng Hóa Của Khách Hàng</CardTitle>
          <p className="text-xs text-muted-foreground">Loại hàng và quy cách đóng gói thường đi cho khách hàng này</p>
        </div>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>Add Commodity</DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gán Hàng Hóa Cho Khách Hàng</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>
                  Chọn từ Master
                </Button>
                <Button type="button" size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>
                  Tạo nhanh Hàng Mới
                </Button>
              </div>
              <form action={handleLink} className="grid gap-3 sm:grid-cols-2">
                {mode === "existing" ? (
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label>Chọn Hàng Hóa Master *</Label>
                    <EntitySelect
                      value={commodityId}
                      onValueChange={setCommodityId}
                      placeholder="Chọn commodity trong danh mục..."
                      options={(allCommodities.data ?? []).map((c) => ({
                        value: c.id,
                        label: `${c.code ? `${c.code} — ` : ""}${c.name}${c.english_name ? ` (${c.english_name})` : ""}${c.is_dg ? " · [DG]" : ""}`,
                      }))}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor="commodity_name">Tên hàng hóa (Name) *</Label>
                      <Input id="commodity_name" name="commodity_name" placeholder="VD: Hàng mẫu may mặc" required />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor="commodity_code">Mã hàng (Code)</Label>
                      <Input id="commodity_code" name="commodity_code" placeholder="VD: SAMPLE-TEXTILE" />
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="custom_description">Mô tả riêng cho khách hàng (Custom Nature of Goods)</Label>
                  <Input
                    id="custom_description"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="VD: GARMENTS / SAMPLE CLOTHES (hiển thị ưu tiên khi khai báo)"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="package_type">Quy cách đóng gói riêng</Label>
                  <Input
                    id="package_type"
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    placeholder="VD: Carton 50x40x30 / Kiện gỗ"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="special_instructions">Chỉ dẫn xử lý kho / bay</Label>
                  <Input
                    id="special_instructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="VD: Không lật ngược, tránh ẩm"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu quan hệ hàng hóa"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mặt hàng Master</TableHead>
              <TableHead>Mô tả riêng (Nature of Goods)</TableHead>
              <TableHead>Quy cách đóng gói</TableHead>
              <TableHead>Mặc định</TableHead>
              {canEdit ? <TableHead className="w-40 text-right">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-semibold text-sm">{row.commodity.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {row.commodity.code ? `${row.commodity.code}` : ""}
                      {row.commodity.english_name ? ` · ${row.commodity.english_name}` : ""}
                      {row.commodity.is_dg ? " · [Hàng nguy hiểm]" : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{row.custom_description || "—"}</div>
                    {row.special_instructions ? (
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Lưu ý: {row.special_instructions}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.package_type || "—"}</TableCell>
                  <TableCell>
                    {row.is_default ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Star className="size-3.5 fill-current" /> Mặc định
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {canEdit ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <EditRowButton label={row.commodity.name} onClick={() => openEdit(row)} />
                        <IconActionButton
                          label="Đặt mặc định"
                          tooltip="Đặt làm mặc định"
                          onClick={() => handleSetDefault(row.id)}
                        >
                          <Star />
                        </IconActionButton>
                        <IconActionButton
                          label={`Gỡ liên kết ${row.commodity.name}`}
                          tooltip="Gỡ liên kết"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setUnlinkTarget({ id: row.id, name: row.commodity.name })}
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
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Chưa có mặt hàng nào được gán cho khách này
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={Boolean(editRow)} onOpenChange={(next) => !next && setEditRow(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa liên kết hàng hóa: {editRow?.commodity.name}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Thay đổi Mặt Hàng Master</Label>
                <EntitySelect
                  value={editCommodityId}
                  onValueChange={setEditCommodityId}
                  placeholder="Chọn commodity"
                  options={(allCommodities.data ?? []).map((c) => ({
                    value: c.id,
                    label: `${c.code ? `${c.code} — ` : ""}${c.name}${c.english_name ? ` (${c.english_name})` : ""}`,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="edit_custom_description">Mô tả riêng cho khách (Custom Description)</Label>
                <Input
                  id="edit_custom_description"
                  value={editCustomDescription}
                  onChange={(e) => setEditCustomDescription(e.target.value)}
                  placeholder="VD: GARMENTS / TEXTILE PRODUCTS"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_package_type">Quy cách đóng gói</Label>
                <Input
                  id="edit_package_type"
                  value={editPackageType}
                  onChange={(e) => setEditPackageType(e.target.value)}
                  placeholder="VD: Thùng Carton 5 lớp"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_special_instructions">Chỉ dẫn xử lý kho</Label>
                <Input
                  id="edit_special_instructions"
                  value={editSpecialInstructions}
                  onChange={(e) => setEditSpecialInstructions(e.target.value)}
                  placeholder="VD: Hàng dễ vỡ, không đè nặng"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsDefault}
                    onChange={(e) => setEditIsDefault(e.target.checked)}
                  />
                  Đặt làm mặt hàng mặc định cho khách hàng này
                </label>
              </div>

              <div className="flex gap-2 sm:col-span-2 pt-2">
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

      <ConfirmDialog
        open={Boolean(unlinkTarget)}
        onOpenChange={(v) => !v && setUnlinkTarget(null)}
        title={`Gỡ liên kết hàng hóa "${unlinkTarget?.name}"?`}
        description="Bạn có chắc muốn gỡ mặt hàng này khỏi hồ sơ khách? Dữ liệu hàng hóa gốc trong Master Catalog vẫn được bảo toàn nguyên vẹn."
        confirmLabel="Gỡ liên kết"
        onConfirm={executeUnlink}
      />
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
                  <EntitySelect
                    value={driverId}
                    onValueChange={setDriverId}
                    placeholder="Chọn driver"
                    options={(allDrivers.data ?? []).map((d) => ({
                      value: d.id,
                      label: d.full_name,
                    }))}
                  />
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
                <EntitySelect
                  value={editDriverId}
                  onValueChange={setEditDriverId}
                  placeholder="Chọn driver"
                  options={(allDrivers.data ?? []).map((d) => ({
                    value: d.id,
                    label: d.full_name,
                  }))}
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
                  <EntitySelect
                    value={vehicleId}
                    onValueChange={setVehicleId}
                    placeholder="Chọn vehicle"
                    options={(allVehicles.data ?? []).map((v) => ({
                      value: v.id,
                      label: v.plate_display ?? v.plate_number,
                    }))}
                  />
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
                <EntitySelect
                  value={editVehicleId}
                  onValueChange={setEditVehicleId}
                  placeholder="Chọn vehicle"
                  options={(allVehicles.data ?? []).map((v) => ({
                    value: v.id,
                    label: v.plate_display ?? v.plate_number,
                  }))}
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
