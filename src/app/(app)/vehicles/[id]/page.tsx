import { VehicleDetailClient } from "@/components/vehicles/vehicle-detail-client";

type VehicleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { id } = await params;
  return <VehicleDetailClient vehicleId={id} />;
}
