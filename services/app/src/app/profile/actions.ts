import { apiFetch } from "@/context/AuthContext";

export async function wakePc(): Promise<{ success: boolean }> {
  return apiFetch("/auth/wake-pc", {
    method: "POST",
  });
}
