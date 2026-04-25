import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { ROUTES } from '../../../lib/constants';

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // If the user has a VALID session, redirect them to the home page.
  if (session?.user) {
    redirect(ROUTES.HOME);
  }

  return <>{children}</>;
}
