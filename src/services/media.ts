import type { MediaAsset } from "@/types";

/**
 * MEDIA SERVICE (API-backed) — uploads now POST multipart to
 * /api/v1/admin/media (R2 on Workers, local uploads in the sandbox).
 */

export interface MediaQuery {
  query?: string;
  folder?: string;
  type?: MediaAsset["type"] | "all";
  view?: "grid" | "list";
}

async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  const body = (await response.json()) as { data: T };
  return body.data;
}

export const mediaService = {
  async list(query: MediaQuery = {}): Promise<MediaAsset[]> {
    const params = new URLSearchParams();
    if (query.query) params.set("q", query.query);
    if (query.folder) params.set("folder", query.folder);
    if (query.type) params.set("type", query.type);
    const data = await getData<{ items: MediaAsset[] }>(`/api/v1/admin/media?${params.toString()}`);
    return data.items;
  },

  /** Real upload — multipart POST, returns the stored asset. */
  async upload(file: File, options: { folder?: string; alt?: string } = {}): Promise<{ ok: true; name: string; asset: MediaAsset | null }> {
    const form = new FormData();
    form.set("file", file);
    if (options.folder) form.set("folder", options.folder);
    if (options.alt) form.set("alt", options.alt);
    const response = await fetch("/api/v1/admin/media", { method: "POST", body: form });
    if (!response.ok) {
      let message = "Upload failed.";
      try {
        const body = (await response.json()) as { error?: { message?: string } };
        message = body.error?.message ?? message;
      } catch {
        /* keep default */
      }
      throw new Error(message);
    }
    const body = (await response.json()) as { data: { name: string } };
    return { ok: true, name: body.data.name, asset: null };
  },

  async remove(id: string): Promise<void> {
    const response = await fetch(`/api/v1/admin/media/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Could not delete this asset.");
  },
};
