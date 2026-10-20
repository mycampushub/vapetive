import { withApi, ok, fail, ErrorCode, created } from "@/server/api/guard";
import { listMedia, createMedia } from "@/server/repos/media";
import { injectWorkerBindings } from "@/server/bindings";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const GET = withApi({ requirePermission: "media.read" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const assets = await listMedia({
    query: searchParams.get("q") ?? undefined,
    folder: searchParams.get("folder") ?? undefined,
    type: (searchParams.get("type") as "image" | "all" | null) ?? undefined,
  });
  return ok({ items: assets, total: assets.length });
});

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

function safeName(original: string): string {
  const ext = path.extname(original).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
  const base = path
    .basename(original, path.extname(original))
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${Date.now()}-${base || "asset"}-${randomUUID().slice(0, 8)}${ext}`;
}

/**
 * POST /api/v1/admin/media — multipart upload (mediaService.upload).
 * Local mode stores under public/uploads and records the row in media_assets;
 * on Workers the same handler writes through the R2 MEDIA binding instead
 * (deploy wiring — docs/BACKEND-ARCHITECTURE.md §6).
 */
export const POST = withApi(
  { requirePermission: "media.write", bodyLimit: 12 * 1024 * 1024 },
  async ({ request, identity }) => {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return fail(422, ErrorCode.VALIDATION_FAILED, "Choose a file to upload.", {
        fields: { file: "Required." },
      });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return fail(413, ErrorCode.VALIDATION_FAILED, "Files must be 10 MB or smaller.");
    }
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.has(mime)) {
      return fail(422, ErrorCode.VALIDATION_FAILED, "Only image files can be uploaded here.");
    }

    const folderRaw = String(form?.get("folder") ?? "general").trim();
    const folder = folderRaw.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 40) || "general";
    const alt = String(form?.get("alt") ?? "").trim().slice(0, 200) || null;
    const fileName = safeName(file.name || "upload");

    // Map real Worker bindings onto the globalThis contract (no-op locally).
    injectWorkerBindings();
    const r2 = globalThis.__VAPETIVE_MEDIA_R2__;
    let url: string;
    let r2Key: string;
    if (r2) {
      // Workers path: stream through the R2 MEDIA binding.
      const key = `media/${folder}/${fileName}`;
      await r2.put(key, file.stream(), {
        httpMetadata: { contentType: mime },
      });
      url = `/cdn-cgi/media/${key}`;
      r2Key = key;
    } else {
      // Local sandbox path: persist under public/uploads.
      const dir = path.join(process.cwd(), "public", "uploads", folder);
      await mkdir(dir, { recursive: true });
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, fileName), bytes);
      url = `/uploads/${folder}/${fileName}`;
      r2Key = `local:${folder}/${fileName}`;
    }

    const id = await createMedia({
      filename: file.name || fileName,
      folder,
      type: "image",
      mime,
      sizeBytes: file.size,
      alt,
      r2Key,
      url,
      uploadedBy: identity!.user.id,
      status: "ready",
    });

    return created({ id, name: fileName, url, folder, alt });
  }
);
