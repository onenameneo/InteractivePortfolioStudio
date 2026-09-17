import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);
if (!process.env.ADMIN_PASSWORD) {
  if (existsSync(envPath))
    throw new Error("请在 .env 中配置至少 12 位 ADMIN_PASSWORD");
  writeFileSync(
    envPath,
    `ADMIN_PASSWORD=${randomBytes(18).toString("base64url")}\nPORT=3100\nHOST=127.0.0.1\nCOOKIE_SECURE=false\n`,
    { mode: 0o600 },
  );
  process.loadEnvFile(envPath);
  console.log("已生成后台密码，保存在项目 .env 文件中。");
}
const dataPath =
  process.env.DATABASE_PATH || resolve(root, "data/studio.sqlite");
mkdirSync(dirname(dataPath), { recursive: true });
const { app } = createApp({
  databasePath: dataPath,
  password: process.env.ADMIN_PASSWORD,
  secureCookie: process.env.COOKIE_SECURE === "true",
});
if (process.argv.includes("--production")) {
  if (!existsSync(resolve(root, "dist/index.html")))
    throw new Error("请先执行 npm run build");
  app.use(express.static(resolve(root, "dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(resolve(root, "dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 3100),
  host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () =>
  console.log(
    `Neo Studio: http://${host}:${port}\n后台: http://${host}:${port}/admin`,
  ),
);
