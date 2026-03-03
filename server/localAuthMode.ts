/**
 * Local Test Authentication Mode
 * 
 * This module provides a development-only authentication mode that doesn't require
 * public deployment or OAuth integration. It's useful for testing the application
 * in a private environment without exposing it to the internet.
 * 
 * To enable: Set ENABLE_LOCAL_AUTH_MODE=true in environment variables
 */

export interface LocalTestUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

// Test users available in local auth mode
export const LOCAL_TEST_USERS: Record<string, LocalTestUser> = {
  "user1": {
    id: "local-user-1",
    name: "Test User 1",
    email: "user1@example.com",
    role: "user",
  },
  "user2": {
    id: "local-user-2",
    name: "Test User 2",
    email: "user2@example.com",
    role: "user",
  },
  "admin": {
    id: "local-admin",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  },
};

export function isLocalAuthModeEnabled(): boolean {
  return process.env.ENABLE_LOCAL_AUTH_MODE === "true";
}

export function getLocalTestUser(userId: string): LocalTestUser | null {
  return LOCAL_TEST_USERS[userId] || null;
}

export function getAllLocalTestUsers(): LocalTestUser[] {
  return Object.values(LOCAL_TEST_USERS);
}
