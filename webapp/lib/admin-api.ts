"use client";

// Thin fetch wrapper for admin API calls. Cookies are same-origin so the
// browser attaches the admin session automatically — this just centralises
// JSON handling and bounces to the login screen if the session has expired.
export async function adminFetch(input: string, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new Error("Session expired. Please log in again.");
  }

  return res;
}

export async function adminFetchJson<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(input, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Request failed.");
  }
  return data as T;
}
