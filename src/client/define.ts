import type { ClientConfig, Person } from './schema';

/** The part of a client that lives in profile.json (also read by the build for the login page). */
export interface Profile {
  slug: string;
  title: string;
  shortTitle?: string;
  admin: Person;
  partner: Person;
}

/**
 * Helper for clients/<slug>/index.ts: merges profile.json with the rest and
 * type-checks the result.
 *
 *   export default defineClient(profile, { features: presets.full, content: {...} });
 */
export const defineClient = (profile: unknown, rest: Omit<ClientConfig, keyof Profile>): ClientConfig => ({ ...(profile as Profile), ...rest });
