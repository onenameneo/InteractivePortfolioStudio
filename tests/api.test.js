import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";
const directory = mkdtempSync(join(tmpdir(), "neo-studio-test-"));
const password = "test-password-not-used-in-app";
const databasePath = join(directory, "test.sqlite");
let server, db, base, cookie, original, uploadedCoverUrl;
before(async () => {
  const service = createApp({ databasePath, password });
  db = service.db;
  server = service.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  db.close();
  rmSync(directory, { recursive: true, force: true });
});
async function req(path, method = "GET", body, extras = {}) {
  return fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "NeoStudio",
      ...(cookie ? { Cookie: cookie } : {}),
      ...extras,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test("public seed is rich and explicitly marked as sample", async () => {
  const res = await req("/api/content");
  assert.equal(res.status, 200);
  original = (await res.json()).content;
  assert.equal(original.profile.demo, true);
  assert.equal(original.profile.websiteUrl, "");
  assert.equal(original.projects.length, 4);
  assert.ok(original.experiences.length);
});
test("anonymous admin read and publish are denied", async () => {
  assert.equal((await req("/api/admin/content")).status, 401);
  assert.equal(
    (
      await req("/api/admin/content", "PUT", {
        content: original,
        revision: 1,
        publish: true,
      })
    ).status,
    401,
  );
});
test("authentication rejects wrong password, issues protected cookie, and opens draft", async () => {
  assert.equal(
    (await req("/api/login", "POST", { password: "incorrect" })).status,
    401,
  );
  const res = await req("/api/login", "POST", { password });
  assert.equal(res.status, 200);
  const header = res.headers.get("set-cookie");
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  cookie = header.split(";")[0];
  const draft = await (await req("/api/admin/content")).json();
  assert.equal(draft.revision, 1);
});
test("authenticated admin can upload a project cover image", async () => {
  const png = Buffer.from("89504e470d0a1a0a", "hex");
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "cover.png");
  const res = await fetch(base + "/api/admin/uploads", {
    method: "POST",
    headers: { "X-Requested-With": "NeoStudio", Cookie: cookie },
    body: form,
  });
  assert.equal(res.status, 201);
  uploadedCoverUrl = (await res.json()).url;
  assert.match(uploadedCoverUrl, /^\/uploads\/[a-f0-9]+\.png$/);
  const image = await fetch(base + uploadedCoverUrl);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
});
test("cross-origin mutation and mutation without custom header are rejected", async () => {
  assert.equal(
    (
      await req(
        "/api/admin/content",
        "PUT",
        { content: original, revision: 1, publish: true },
        { Origin: "https://evil.example" },
      )
    ).status,
    403,
  );
  const response = await fetch(base + "/api/admin/content", {
    method: "PUT",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ content: original, revision: 1, publish: true }),
  });
  assert.equal(response.status, 403);
});
test("draft save does not change the public site", async () => {
  const content = structuredClone(original);
  content.profile.name = "Draft Name";
  content.projects[0].coverText = "Editable\nfor focus.";
  content.projects[0].coverUrl = uploadedCoverUrl;
  content.projects.unshift({
    ...content.projects[0],
    id: "new-project",
    title: "A new work",
  });
  const res = await req("/api/admin/content", "PUT", {
    content,
    revision: 1,
    publish: false,
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).revision, 2);
  const publicContent = (await (await req("/api/content")).json()).content;
  assert.equal(publicContent.profile.name, original.profile.name);
  assert.equal(publicContent.projects.length, 4);
  assert.equal(
    (await req("/api/admin/content").then((r) => r.json())).content.projects[0]
      .coverText,
    "Editable\nfor focus.",
  );
  assert.equal((await req("/api/admin/content").then((r) => r.json())).content.projects[0].coverUrl, uploadedCoverUrl);
});
test("stale version is rejected without overwriting the saved draft", async () => {
  const res = await req("/api/admin/content", "PUT", {
    content: original,
    revision: 1,
    publish: true,
  });
  assert.equal(res.status, 409);
  assert.equal(
    (await (await req("/api/admin/content")).json()).content.profile.name,
    "Draft Name",
  );
});
test("invalid link, duplicate ids, and unexpected fields are rejected", async () => {
  for (const change of [
    (c) => (c.projects[0].link = "javascript:alert(1)"),
    (c) => c.projects.push(c.projects[0]),
    (c) => (c.profile.unexpected = true),
  ]) {
    const c = structuredClone(original);
    change(c);
    assert.equal(
      (
        await req("/api/admin/content", "PUT", {
          content: c,
          revision: 2,
          publish: true,
        })
      ).status,
      400,
    );
  }
});
test("publish supports editing, ordering, addition and deletion, and updates public data", async () => {
  const draft = await (await req("/api/admin/content")).json();
  draft.content.profile.name = "Published Name";
  draft.content.profile.websiteUrl = "https://neo.example.com";
  draft.content.experiences.pop();
  draft.content.skills.reverse();
  const res = await req("/api/admin/content", "PUT", {
    content: draft.content,
    revision: draft.revision,
    publish: true,
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).revision, 3);
  const data = (await (await req("/api/content")).json()).content;
  assert.equal(data.profile.name, "Published Name");
  assert.equal(data.profile.websiteUrl, "https://neo.example.com");
  assert.equal(data.projects[0].id, "new-project");
  assert.equal(data.experiences.length, 2);
  assert.equal(data.skills[0].id, original.skills.at(-1).id);
});
test("published data remains available in a separately opened database connection", async () => {
  const other = createApp({ databasePath, password });
  try {
    const row = other.db.prepare("SELECT * FROM content WHERE id=1").get();
    assert.equal(JSON.parse(row.published).profile.name, "Published Name");
    assert.equal(row.revision, 3);
  } finally {
    other.db.close();
  }
});
test("logout revokes server-side session", async () => {
  assert.equal((await req("/api/logout", "POST")).status, 200);
  assert.equal((await req("/api/admin/content")).status, 401);
});
test("login throttles repeated failures", async () => {
  cookie = undefined;
  for (let i = 0; i < 10; i++)
    assert.equal(
      (await req("/api/login", "POST", { password: "wrong" })).status,
      401,
    );
  assert.equal((await req("/api/login", "POST", { password })).status, 429);
});
