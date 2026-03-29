export type BaseUser = {
  id?: string;
  email?: string | null;
  role?: string;
  firstName?: string;
  lastName?: string;
  authProvider?: string;
  authProviderId?: string;
  imageUrl?: string | null;
  _verified?: boolean;
  remember?: boolean;
  name?: string | null;
  image?: string | null;
  bio?: string;
  createdAt?: string;
  completedAlgorithms?: string[];
  visualizerProgress?: unknown;
};
