/**
 * VAPETIVE — media repository.
 *
 * Metadata lives in D1 (media_assets); objects live in R2 on Workers and in
 * public/uploads in the sandbox (served as static assets). Upload records are
 * created by the admin media endpoint.
 */

import { getDb } from "@/server/db/client";
import { newId } from "@/server/ids";

export interface MediaListQuery {
  query?: string;
  folder?: string;
  type?: "image" | "video" | "document" | "all";
}

function mapMedia(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.filename as string,
    type: row.type as "image" | "video" | "document",
    format: String(row.filename ?? "").split(".").pop()?.toUpperCase() ?? "",
    sizeLabel: formatSize(Number(row.size_bytes ?? 0)),
    dimensions:
      row.width && row.height ? `${row.width} × ${row.height}` : undefined,
    folder: row.folder as string,
    uploadedAt: String(row.uploaded_at ?? "").slice(0, 10),
    alt: (row.alt as string) ?? undefined,
    url: row.url as string,
    status: row.status as "ready" | "processing" | "failed",
  };
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export type MediaAssetView = ReturnType<typeof mapMedia>;

export async function listMedia(query: MediaListQuery = {}): Promise<MediaAssetView[]> {
  const db = await getDb();
  const where: string[] = [`deleted_at IS NULL`];
  const params: unknown[] = [];
  if (query.folder && query.folder !== "all") {
    where.push(`folder = ?`);
    params.push(query.folder);
  }
  if (query.type && query.type !== "all") {
    where.push(`type = ?`);
    params.push(query.type);
  }
  if (query.query) {
    where.push(`(filename LIKE ? OR COALESCE(alt, '') LIKE ?)`);
    const like = `%${query.query.toLowerCase()}%`;
    params.push(like, like);
  }
  const rows = await db.all<Record<string, unknown>>(
    `SELECT * FROM media_assets WHERE ${where.join(" AND ")} ORDER BY uploaded_at DESC`,
    params
  );
  return rows.map(mapMedia);
}

export async function getMedia(id: string): Promise<MediaAssetView | null> {
  const db = await getDb();
  const row = await db.get<Record<string, unknown>>(
    `SELECT * FROM media_assets WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  return row ? mapMedia(row) : null;
}

export interface CreateMediaInput {
  filename: string;
  folder: string;
  type: "image" | "video" | "document";
  mime: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  r2Key: string;
  url: string;
  uploadedBy?: string | null;
  status?: "ready" | "processing" | "failed";
}

export async function createMedia(input: CreateMediaInput): Promise<string> {
  const db = await getDb();
  const id = newId("med");
  await db.run(
    `INSERT INTO media_assets
      (id, filename, folder, type, mime, size_bytes, width, height, alt, status, r2_key, url, uploaded_by, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.filename,
      input.folder,
      input.type,
      input.mime,
      input.sizeBytes,
      input.width ?? null,
      input.height ?? null,
      input.alt ?? null,
      input.status ?? "ready",
      input.r2Key,
      input.url,
      input.uploadedBy ?? null,
      new Date().toISOString(),
    ]
  );
  return id;
}

export async function softDeleteMedia(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.run(
    `UPDATE media_assets SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL`,
    [new Date().toISOString(), id]
  );
  return result.changes > 0;
}

export async function mediaStats(): Promise<{ total: number }> {
  const db = await getDb();
  const row = await db.get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM media_assets WHERE deleted_at IS NULL`
  );
  return { total: row?.c ?? 0 };
}
