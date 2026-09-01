import { PartyDetailClient } from "@/components/parties/party-detail-client";

type PartyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PartyDetailPage({ params }: PartyDetailPageProps) {
  const { id } = await params;
  return <PartyDetailClient partyId={id} />;
}
