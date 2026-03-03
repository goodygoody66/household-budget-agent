/**
 * Local Test Authentication Mode - Client Side
 * 
 * This module provides utilities for using local test authentication mode
 * when ENABLE_LOCAL_AUTH_MODE is enabled on the server.
 */

export interface LocalTestUser {
  id: string;
  name: string;
  email: string;
}

export const LOCAL_TEST_USERS: LocalTestUser[] = [
  {
    id: "user1",
    name: "Test User 1",
    email: "user1@example.com",
  },
  {
    id: "user2",
    name: "Test User 2",
    email: "user2@example.com",
  },
  {
    id: "admin",
    name: "Admin User",
    email: "admin@example.com",
  },
];

const LOCAL_AUTH_KEY = "local-auth-user-id";

export function setLocalAuthUser(userId: string): void {
  localStorage.setItem(LOCAL_AUTH_KEY, userId);
  // Reload to apply new auth context
  window.location.reload();
}

export function getLocalAuthUser(): string | null {
  return localStorage.getItem(LOCAL_AUTH_KEY);
}

export function clearLocalAuthUser(): void {
  localStorage.removeItem(LOCAL_AUTH_KEY);
  // Reload to clear auth context
  window.location.reload();
}

export function getLocalAuthQueryParam(): string {
  const userId = getLocalAuthUser();
  return userId ? `?localUserId=${encodeURIComponent(userId)}` : "";
}
