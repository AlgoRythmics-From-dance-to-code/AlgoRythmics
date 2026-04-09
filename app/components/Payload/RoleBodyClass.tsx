'use client';

import { useAuth } from '@payloadcms/ui';
import { useEffect } from 'react';
import '../../admin/custom.css';

/**
 * Client component that adds the user's role as a class to the document body.
 * This allows us to target specific roles in our admin CSS.
 */
export default function RoleBodyClass() {
  const { user } = useAuth();
  const role = (user as Record<string, unknown>)?.role;

  useEffect(() => {
    if (role) {
      document.body.classList.add(`role-${role}`);
      return () => {
        document.body.classList.remove(`role-${role}`);
      };
    }
  }, [role]);

  return null;
}
