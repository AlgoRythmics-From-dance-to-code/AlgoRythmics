import AlgorithmDetailClient from "./AlgorithmDetailClient";

export default async function AlgorithmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AlgorithmDetailClient id={id} />;
}
