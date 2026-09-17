import { z } from "zod";
const text = z.string().trim().max(6000);
const short = z.string().trim().max(160);
const required = short.min(1);
const url = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) =>
      !v ||
      (/^https?:\/\//i.test(v) &&
        (() => {
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        })()),
    "请输入 http 或 https 链接",
  );
const imageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) =>
      !v ||
      /^\/uploads\/[A-Za-z0-9._-]+$/.test(v) ||
      (/^https?:\/\//i.test(v) &&
        (() => {
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        })()),
    "请输入有效的图片链接",
  );
const item = { id: z.string().min(1).max(100) };
const list = (schema) =>
  z
    .array(schema)
    .max(60)
    .refine(
      (items) => new Set(items.map((x) => x.id)).size === items.length,
      "列表 ID 不可重复",
    );
export const contentSchema = z
  .object({
    profile: z
      .object({
        name: required,
        role: required,
        headline: required,
        intro: text,
        about: text,
        location: short,
        email: z.union([z.literal(""), z.email()]),
        availability: short,
        github: url,
        websiteUrl: url.default(""),
        resumeUrl: url,
        demo: z.boolean(),
      })
      .strict(),
    projects: list(
      z
        .object({
          ...item,
          title: required,
          category: short,
          year: short,
          description: text,
          role: short,
          stack: short,
          result: text,
          link: url,
          coverText: short.optional().default(""),
          coverUrl: imageUrl.optional().default(""),
          color: z.enum(["sage", "clay", "blue"]),
        })
        .strict(),
    ),
    experiences: list(
      z
        .object({
          ...item,
          company: required,
          position: required,
          period: short,
          summary: text,
        })
        .strict(),
    ),
    skills: list(
      z
        .object({ ...item, title: required, items: text, description: text })
        .strict(),
    ),
    interests: list(
      z.object({ ...item, title: required, description: text }).strict(),
    ),
  })
  .strict();
export const seed = {
  profile: {
    name: "Neo",
    role: "开发者 · 创造者 · 终身学习者",
    headline: "A little space,\na lot of ideas.",
    intro:
      "你好，我是 Neo。喜欢把好奇心变成想法，再把想法变成可以触碰的作品。欢迎来到我的数字工作室。",
    about:
      "我关注技术与设计相遇的地方。享受从一个模糊的问题出发，梳理逻辑、雕琢细节，直到做出让人愿意使用的产品。工作之外，用阅读、摄影和散步保持好奇。",
    location: "中国 · 上海",
    email: "hello@example.com",
    availability: "对有趣的合作保持开放",
    github: "",
    websiteUrl: "",
    resumeUrl: "",
    demo: true,
  },
  projects: [
    {
      id: "p-studio",
      title: "Studio / 数字工作室",
      category: "CREATIVE DEVELOPMENT",
      year: "2026",
      description:
        "把传统简历转化成一间可以探索的房间。用连续的镜头语言串起作品、经历和生活，让技术也有温度。",
      role: "设计与全栈开发",
      stack: "React, Three.js, Node.js",
      result:
        "示例项目：以滚动叙事、移动端适配和结构化内容管理为核心，探索个人网站的新表达。",
      link: "",
      coverText: "N.",
      color: "sage",
    },
    {
      id: "p-flow",
      title: "Flow / 专注每一天",
      category: "PRODUCT & ENGINEERING",
      year: "2025",
      description:
        "一个为独立创作者设计的轻量工作空间，把任务、笔记和专注时间放在一起，减少切换，留出思考的空间。",
      role: "产品设计与前端开发",
      stack: "TypeScript, React, Design System",
      result:
        "示例项目：从用户流程到交互原型，再到可复用组件体系，展示完整的产品构建思路。",
      link: "",
      coverText: "Make room\nfor focus.",
      color: "blue",
    },
    {
      id: "p-field",
      title: "Field Notes / 灵感档案",
      category: "DESIGN EXPERIMENT",
      year: "2025",
      description:
        "收集散落在日常里的好点子。以杂志般的排版组织照片、阅读摘记与短文，让记录本身成为一种乐趣。",
      role: "独立设计与开发",
      stack: "Web Design, CSS, Content Modeling",
      result:
        "示例项目：探索内容优先的设计，以及不同屏幕下保持阅读节奏的方法。",
      link: "",
      coverText: "Notes from\nthe everyday.",
      color: "clay",
    },
    {
      id: "p-ucansign",
      title: "UCanSign｜文档电子签名平台",
      category: "DOCUMENT SIGNING",
      year: "",
      description:
        "面向企业与个人的文档电子签名平台，围绕 PDF、Word 文档与电子化签名，推动传统签署流程在线完成。",
      role: "前端开发",
      stack: "Vue 3, PDF, Word, 电子签名",
      result:
        "负责前端界面与交互开发，围绕 PDF、Word 文档处理和电子化签名流程，完成文档上传、预览、签署与结果确认等核心体验。",
      link: "https://ucansign.com/",
      coverText: "Sign with\nconfidence.",
      coverUrl: "",
      color: "blue",
    },
  ],
  experiences: [
    {
      id: "e-now",
      company: "独立探索",
      position: "开发者 / 产品创造者",
      period: "2025 — 至今",
      summary:
        "示例经历：围绕 AI 工具、创意编程与个人效率开展独立项目，从需求梳理到上线迭代，尝试更完整的产品交付。",
    },
    {
      id: "e-product",
      company: "某产品团队",
      position: "前端工程师",
      period: "2023 — 2025",
      summary:
        "示例经历：参与核心产品界面开发，与设计和后端协作，持续优化组件复用、交互一致性与使用体验。",
    },
    {
      id: "e-study",
      company: "学习与积累",
      position: "计算机相关专业",
      period: "2019 — 2023",
      summary:
        "示例教育经历：学习软件工程与交互设计，通过课程项目和开源实践，建立从想法到实现的基础能力。",
    },
  ],
  skills: [
    {
      id: "s-build",
      title: "Build",
      items: "TypeScript, React, Node.js, SQL",
      description: "把想法变成稳定、可维护的应用。",
    },
    {
      id: "s-craft",
      title: "Craft",
      items: "交互设计, Three.js, CSS, 原型设计",
      description: "关注看得见的细节，也关心用起来的感受。",
    },
    {
      id: "s-think",
      title: "Think",
      items: "产品思维, 内容建模, AI 工作流, 持续学习",
      description: "先理解问题，再选择合适的工具。",
    },
  ],
  interests: [
    {
      id: "i-photo",
      title: "捕捉日常",
      description: "带着相机出门，寻找平凡生活里的光。",
    },
    {
      id: "i-read",
      title: "保持输入",
      description: "在技术、设计和文学之间自由漫游。",
    },
    {
      id: "i-coffee",
      title: "慢一点也好",
      description: "一杯手冲咖啡，一张唱片，一段没有目的的散步。",
    },
  ],
};
