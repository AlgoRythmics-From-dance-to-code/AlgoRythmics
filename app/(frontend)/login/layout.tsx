import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { ROUTES } from '../../../lib/constants';

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If the user has a VALID session, redirect them to the home page.
  // This replaces the middleware guest guard which couldn't decode the JWT
  // and would trap users with expired cookies.
  if (session?.user) {
    redirect(ROUTES.HOME);
  }

  return <>{children}</>;
}
