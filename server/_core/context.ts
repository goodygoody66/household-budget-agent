import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { isLocalAuthModeEnabled, getLocalTestUser } from "../localAuthMode";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Check for local test auth mode first
  if (isLocalAuthModeEnabled()) {
    const localUserId = opts.req.query?.localUserId as string | undefined;
    const localUser = localUserId ? getLocalTestUser(localUserId) : null;
    
    if (localUser) {
      // Convert local test user to User type
      const now = new Date();
      user = {
        id: parseInt(localUser.id.replace("local-", "")) || 9999,
        openId: localUser.id,
        email: localUser.email,
        name: localUser.name,
        loginMethod: "local-test",
        role: localUser.role,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      } as User;
    }
  }

  // Fall back to OAuth authentication if not in local mode or no local user
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
