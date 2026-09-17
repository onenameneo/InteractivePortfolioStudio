import express from "express";
import { mkdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  createHmac,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { dirname, join } from "node:path";
import { contentSchema, seed } from "./content.js";

const maxUploadBytes = 8 * 1024 * 1024;
const imageTypes = new Map([
  ["image/jpeg", { extension: "jpg", matches: (data) => data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) }],
  ["image/png", { extension: "png", matches: (data) => data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) }],
  ["image/gif", { extension: "gif", matches: (data) => ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii")) }],
  ["image/webp", { extension: "webp", matches: (data) => data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP" }],
]);

function uploadError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function readImageUpload(req) {
  const contentType = req.headers["content-type"] || "";
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!match) throw uploadError(400, "请选择要上传的图片");
  const boundary = Buffer.from(`--${match[1] || match[2].trim()}`);
  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > maxUploadBytes)
    throw uploadError(413, "图片不能超过 8MB");

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxUploadBytes) throw uploadError(413, "图片不能超过 8MB");
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);
  const headerSeparator = Buffer.from("\r\n\r\n");
  const boundaryWithPrefix = Buffer.concat([Buffer.from("\r\n"), boundary]);
  let cursor = body.indexOf(boundary);
  let file;
  let mime;
  while (cursor >= 0) {
    let partStart = cursor + boundary.length;
    if (body.subarray(partStart, partStart + 2).toString() === "--") break;
    if (body.subarray(partStart, partStart + 2).toString() === "\r\n")
      partStart += 2;
    const headerEnd = body.indexOf(headerSeparator, partStart);
    if (headerEnd < 0) break;
    const partEnd = body.indexOf(boundaryWithPrefix, headerEnd + headerSeparator.length);
    if (partEnd < 0) break;
    const headers = body.subarray(partStart, headerEnd).toString("utf8");
    const disposition = /content-disposition:[^\r\n]*name="file"/i.test(headers);
    if (disposition) {
      mime = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim().toLowerCase();
      file = body.subarray(headerEnd + headerSeparator.length, partEnd);
      break;
    }
    cursor = body.indexOf(boundary, partEnd + boundaryWithPrefix.length);
  }
  const type = mime && imageTypes.get(mime);
  if (!file?.length || !type || !type.matches(file))
    throw uploadError(415, "仅支持有效的 JPG、PNG、WebP 或 GIF 图片");
  return { file, ...type };
}

export function createApp({
  databasePath,
  password,
  secureCookie = false,
  uploadDir = join(dirname(databasePath), "uploads"),
}) {
  if (!password || password.length < 12)
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters");
  const app = express();
  app.disable("x-powered-by");
  mkdirSync(uploadDir, { recursive: true });
  app.use("/uploads", express.static(uploadDir, { index: false, maxAge: "1h" }));
  const db = new DatabaseSync(databasePath);
  db.exec(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY, draft TEXT NOT NULL, published TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, published_at TEXT); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);",
  );
  db.prepare(
    "INSERT OR IGNORE INTO content (id,draft,published,published_at) VALUES (1,?,?,?)",
  ).run(JSON.stringify(seed), JSON.stringify(seed), new Date().toISOString());
  const salt = randomBytes(16),
    passwordHash = scryptSync(password, salt, 64);
  const hash = (value) =>
    createHmac("sha256", password).update(value).digest("hex");
  const cookies = {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookie,
    path: "/api",
  };
  const attempts = new Map();
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.get("X-Requested-With") !== "NeoStudio")
        return res.status(403).json({ error: "请求校验失败，请刷新页面" });
      const origin = req.get("Origin");
      if (origin) {
        try {
          if (new URL(origin).host !== req.get("Host"))
            return res.status(403).json({ error: "不允许跨站修改" });
        } catch {
          return res.status(403).json({ error: "无效来源" });
        }
      }
    }
    next();
  });
  app.use(express.json({ limit: "512kb" }));
  const read = () => db.prepare("SELECT * FROM content WHERE id=1").get();
  const tokenFrom = (req) =>
    (req.headers.cookie || "")
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("neo_session="))
      ?.slice(12);
  const auth = (req, res, next) => {
    const token = tokenFrom(req);
    const session =
      token &&
      db.prepare("SELECT expires FROM sessions WHERE token=?").get(hash(token));
    if (!session || session.expires < Date.now())
      return res.status(401).json({ error: "请先登录，或会话已过期" });
    next();
  };
  app.get("/api/content", (req, res) => {
    const row = read();
    res.json({
      content: JSON.parse(row.published),
      publishedAt: row.published_at,
    });
  });
  app.post("/api/login", (req, res) => {
    const key = req.ip;
    for (const [ip, a] of attempts)
      if (Date.now() > a.until) attempts.delete(ip);
    const attempt = attempts.get(key) || {
      count: 0,
      until: Date.now() + 15 * 60_000,
    };
    if (attempt.count >= 10)
      return res.status(429).json({ error: "尝试次数过多，请 15 分钟后再试" });
    const value =
      typeof req.body?.password === "string" ? req.body.password : "";
    if (
      value.length > 512 ||
      !timingSafeEqual(scryptSync(value, salt, 64), passwordHash)
    ) {
      attempt.count++;
      attempts.set(key, attempt);
      return res.status(401).json({ error: "密码不正确" });
    }
    attempts.delete(key);
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES (?,?)").run(
      hash(token),
      Date.now() + 8 * 60 * 60_000,
    );
    res
      .cookie("neo_session", token, { ...cookies, maxAge: 8 * 60 * 60_000 })
      .json({ ok: true });
  });
  app.get("/api/admin/content", auth, (req, res) => {
    const row = read();
    res.json({
      content: JSON.parse(row.draft),
      revision: row.revision,
      publishedAt: row.published_at,
    });
  });
  app.post("/api/admin/uploads", auth, async (req, res, next) => {
    try {
      const { file, extension } = await readImageUpload(req);
      const filename = `${randomBytes(16).toString("hex")}.${extension}`;
      writeFileSync(join(uploadDir, filename), file, { flag: "wx" });
      res.status(201).json({ url: `/uploads/${filename}` });
    } catch (error) {
      if (error?.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  });
  app.put("/api/admin/content", auth, (req, res) => {
    const parsed = contentSchema.safeParse(req.body?.content);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          error: "内容格式有误",
          details: parsed.error.issues.map(
            (i) => `${i.path.join(".")}: ${i.message}`,
          ),
        });
    const revision = req.body?.revision;
    if (!Number.isInteger(revision) || typeof req.body?.publish !== "boolean")
      return res.status(400).json({ error: "缺少版本或发布参数" });
    const content = JSON.stringify(parsed.data),
      now = new Date().toISOString();
    const result = req.body.publish
      ? db
          .prepare(
            "UPDATE content SET draft=?, published=?, revision=revision+1, published_at=? WHERE id=1 AND revision=?",
          )
          .run(content, content, now, revision)
      : db
          .prepare(
            "UPDATE content SET draft=?, revision=revision+1 WHERE id=1 AND revision=?",
          )
          .run(content, revision);
    if (!result.changes)
      return res
        .status(409)
        .json({
          error: "其他窗口已修改内容。请先导出当前内容备份，再重新加载后台。",
        });
    res.json({
      ok: true,
      revision: revision + 1,
      publishedAt: read().published_at,
    });
  });
  app.post("/api/logout", auth, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(hash(tokenFrom(req)));
    res.clearCookie("neo_session", cookies).json({ ok: true });
  });
  app.use("/api", (req, res) => res.status(404).json({ error: "接口不存在" }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    res
      .status(err.status || 500)
      .json({
        error:
          err.status === 413
            ? "内容过大"
            : err.status === 400
              ? "请求格式不正确"
              : "服务器处理失败",
      });
  });
  return { app, db };
}
