import { redirect } from 'next/navigation';

export default async function OklevelRedirectPage({
  params,
}: {
  params: Promise<{ userId: string; courseSlug: string }>;
}) {
  const { userId, courseSlug } = await params;
  redirect(`/certificate/${userId}/${courseSlug}`);
}
