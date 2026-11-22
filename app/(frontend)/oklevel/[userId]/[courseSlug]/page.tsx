import { redirect } from 'next/navigation';

export default async function OklevelRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; courseSlug: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { userId, courseSlug } = await params;
  const resolvedSearch = await searchParams;
  const rawToken = Array.isArray(resolvedSearch?.token)
    ? resolvedSearch.token[0]
    : resolvedSearch?.token;
  const query = rawToken ? `?token=${encodeURIComponent(rawToken)}` : '';
  redirect(`/certificate/${encodeURIComponent(userId)}/${encodeURIComponent(courseSlug)}${query}`);
}
