import type { Content } from "./types";

function text(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[\\`*_{}\[\]()#+\-.!|]/g, "\\$&");
}

export function resumeMarkdown(content: Content, baseUrl: string) {
  const { profile: p } = content;
  const link = (label: string, url: string) =>
    `[${text(label)}](<${new URL(url, baseUrl).href}>)`;
  return (
    [
      `# ${text(p.name)}`,
      p.demo ? "示例简历 · 经历和项目信息待本人替换" : "",
      text(`${p.role} · ${p.location}`),
      text(p.email),
      text(p.about),
      "## 项目",
      ...content.projects.flatMap((x) => [
        `### ${text(x.title)} ${text(x.year)}`,
        text(`${x.role} · ${x.stack}`),
        text(x.description),
        x.coverUrl ? `!${link(`${x.title}项目图片`, x.coverUrl)}` : "",
        text(x.result),
      ]),
      "## 经历",
      ...content.experiences.flatMap((x) => [
        `### ${text(x.company)} · ${text(x.position)}`,
        text(x.period),
        text(x.summary),
      ]),
      "## 技能",
      ...content.skills.map((x) => `**${text(x.title)}** — ${text(x.items)}`),
      p.websiteUrl ? link("个人网站", p.websiteUrl) : "",
      p.github ? link("GitHub", p.github) : "",
    ]
      .filter(Boolean)
      .join("\n\n") + "\n"
  );
}
