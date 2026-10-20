/**
 * VAPETIVE — local SQLite driver (runtime-adaptive).
 *
 * Local development runs the Next.js server under Node (node:sqlite) while
 * tooling (seed scripts) runs under Bun (bun:sqlite). Both engines expose
 * the same statement surface we need, so this driver adapts at runtime and
 * keeps one implementation. Applies migrations from /migrations/*.sql on
 * first use.
 */

import { readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import type { BatchStatement, DbRow, RunResult } from "@/server/db/client";

/** Minimal structural surface shared by node:sqlite and bun:sqlite. */
interface SqlStatement {
  run(...params: unknown[]): { changes: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqlStatement;
  close(): void;
}

export type LocalDb = {
  all<T = DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = DbRow>(sql: string, params?: unknown[]): Promise<T | null>;
  run(sql: string, params?: unknown[]): Promise<RunResult>;
  batch(statements: BatchStatement[]): void;
  /** Raw handle for the seed script (transactions, bulk exec). */
  raw(): SqliteDatabase;
};

const DB_DIR = path.join(process.cwd(), "db");
const DB_FILE = path.join(DB_DIR, "vapetive.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

let instance: SqliteDatabase | null = null;
let migrationsApplied = false;

/** Runtime-adaptive open: bun:sqlite under Bun, node:sqlite under Node. */
async function openDatabase(file: string): Promise<SqliteDatabase> {
  const isBun =
    typeof process !== "undefined" &&
    Boolean((process.versions as unknown as Record<string, string | undefined>)?.bun);

  if (isBun) {
    const spec = "bun:sqlite";
    const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ spec)) as {
      Database: new (path: string) => SqliteDatabase;
    };
    return new mod.Database(file);
  }

  const spec = "node:sqlite";
  const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ spec)) as {
    DatabaseSync: new (path: string) => SqliteDatabase;
  };
  return new mod.DatabaseSync(file);
}

async function openRaw(): Promise<SqliteDatabase> {
  if (instance) return instance;
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  const db = await openDatabase(DB_FILE);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  instance = db;
  return db;
}

async function applyMigrations(db: SqliteDatabase): Promise<void> {
  if (migrationsApplied) return;
  db.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);`
  );
  const appliedRows = db.prepare(`SELECT name FROM _migrations`).all() as Array<{ name: string }>;
  const applied = new Set(appliedRows.map((r) => r.name));

  let files: string[] = [];
  try {
    files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  } catch {
    files = [];
  }

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare(`INSERT INTO _migrations (name, applied_at) VALUES (?, ?)`).run(
        file,
        new Date().toISOString()
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
  migrationsApplied = true;
}

let singleton: LocalDb | null = null;
let initPromise: Promise<LocalDb> | null = null;

export function getLocalDb(): Promise<LocalDb> {
  if (singleton) return Promise.resolve(singleton);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await openRaw();
    await applyMigrations(db);

    const handle: LocalDb = {
      async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return db.prepare(sql).all(...params) as T[];
      },
      async get<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        const row = db.prepare(sql).get(...params);
        return ((row as T | undefined) ?? null) as T | null;
      },
      async run(sql: string, params: unknown[] = []): Promise<RunResult> {
        const result = db.prepare(sql).run(...params);
        return { changes: Number(result.changes ?? 0) };
      },
      batch(statements: BatchStatement[]): void {
        db.exec("BEGIN");
        try {
          for (const stmt of statements) {
            db.prepare(stmt.sql).run(...(stmt.params ?? []));
          }
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      },
      raw(): SqliteDatabase {
        return db;
      },
    };

    singleton = handle;
    return handle;
  })();

  return initPromise;
}

/** Used by scripts to close cleanly. */
export function closeLocalDb(): void {
  if (instance) {
    instance.close();
    instance = null;
    singleton = null;
    migrationsApplied = false;
    initPromise = null;
  }
}
