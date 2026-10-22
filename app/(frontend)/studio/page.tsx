import { redirect } from 'next/navigation';
import { auth } from '../../../auth';
import { ROLES, ROUTES } from '../../../lib/constants';
import StudioClient from './StudioClient';

export const metadata = {
  title: 'Tanári Stúdió | AlgoRythmics',
  description: 'Interaktív kurzusszerkesztő, AI tananyag-generátor és tanári vezérlőpult.',
};

export default async function StudioPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  // Protect route: Only Admin and Editor roles can access
  if (!user) {
    redirect(`${ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(ROUTES.STUDIO)}`);
  }

  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR) {
    redirect(ROUTES.COURSES);
  }

  return <StudioClient userRole={user.role} />;
}
