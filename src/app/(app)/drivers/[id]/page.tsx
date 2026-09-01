import { DriverDetailClient } from "@/components/drivers/driver-detail-client";

type DriverDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = await params;
  return <DriverDetailClient driverId={id} />;
}
