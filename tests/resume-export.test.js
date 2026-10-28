import { test } from "node:test";
import assert from "node:assert/strict";
import { resumeMarkdown } from "../src/resume-export.ts";
import { seed } from "../server/content.js";

test("Markdown contains resume sections, optional details and portable image URLs", () => {
  const content = structuredClone(seed);
  content.profile.name = "测试用户";
  content.profile.websiteUrl = "https://example.com/";
  content.profile.github = "https://github.com/example";
  content.projects[0].coverUrl = "/uploads/project.png";
  const markdown = resumeMarkdown(content, "https://studio.example/resume");
  for (const expected of [
    "# 测试用户",
    "示例简历",
    "## 项目",
    "## 经历",
    "## 技能",
    content.experiences[0].company,
    content.skills[0].title,
    "https://studio.example/uploads/project.png",
    "[个人网站](<https://example.com/>)",
    "[GitHub](<https://github.com/example>)",
  ]) {
    assert.ok(markdown.includes(expected), `Missing ${expected}`);
  }
  content.profile.demo = false;
  content.profile.email = "";
  content.profile.websiteUrl = "";
  content.profile.github = "";
  content.projects = [];
  content.experiences = [];
  content.skills = [];
  const minimal = resumeMarkdown(content, "https://studio.example/resume");
  assert.ok(!minimal.includes("示例简历"));
  assert.ok(!minimal.includes("个人网站"));
  assert.ok(!minimal.includes("GitHub"));
  assert.ok(!minimal.includes("undefined"));
});

test("Markdown preserves literal special characters and multiline text", () => {
  const content = structuredClone(seed);
  content.profile.name = "A *B* [C]";
  content.profile.about = "<script>alert(1)</script>\n# 标题\n- 列表 & 更多";
  const markdown = resumeMarkdown(content, "https://studio.example/resume");
  assert.ok(markdown.startsWith("# A \\*B\\* \\[C\\]"));
  assert.ok(markdown.includes("&lt;script&gt;alert\\(1\\)&lt;/script&gt;"));
  assert.ok(markdown.includes("\n\\# 标题\n\\- 列表 &amp; 更多"));
});
