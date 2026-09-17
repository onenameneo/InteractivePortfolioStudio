import Icon from "./Icon";
import { useEffect, useState } from "react";
import { api, type Content } from "./types";
import "./admin.css";
type Section = keyof Content;
type Field = {
  key: string;
  label: string;
  type?: "textarea" | "url" | "email" | "checkbox" | "color" | "file";
  hint?: string;
  required?: boolean;
};
const labels: Record<Section, string> = {
  profile: "个人资料",
  projects: "项目",
  experiences: "经历与教育",
  skills: "技能工具",
  interests: "生活与兴趣",
};
const fields: Record<Section, Field[]> = {
  profile: [
    { key: "name", label: "显示姓名", required: true },
    { key: "role", label: "职业定位", required: true },
    {
      key: "headline",
      label: "首页大标题",
      type: "textarea",
      required: true,
      hint: "支持换行，建议两行简短文字。",
    },
    { key: "intro", label: "首页自我介绍", type: "textarea" },
    { key: "about", label: "关于我", type: "textarea" },
    { key: "location", label: "所在地" },
    { key: "email", label: "联系邮箱", type: "email" },
    { key: "availability", label: "合作状态" },
    { key: "github", label: "GitHub 链接", type: "url" },
    {
      key: "websiteUrl",
      label: "个人网站链接",
      type: "url",
      hint: "填写你希望访客打开的个人网站地址。",
    },
    {
      key: "resumeUrl",
      label: "外部简历链接",
      type: "url",
      hint: "留空时使用网站内置简历，可打印为 PDF。",
    },
    {
      key: "demo",
      label: "显示「示例资料」标记",
      type: "checkbox",
      hint: "替换为自己的真实内容后，可以关闭。",
    },
  ],
  projects: [
    { key: "title", label: "项目名称", required: true },
    { key: "category", label: "项目分类" },
    { key: "year", label: "年份" },
    { key: "description", label: "项目介绍", type: "textarea" },
    { key: "role", label: "我的角色" },
    {
      key: "stack",
      label: "技术与工具",
      hint: "使用逗号分隔，例如 React, Three.js",
    },
    { key: "result", label: "项目思考与成果", type: "textarea" },
    {
      key: "link",
      label: "项目访问链接",
      type: "url",
      hint: "留空时只展示站内详情。",
    },
    {
      key: "coverText",
      label: "封面主文案",
      type: "textarea",
      hint: "支持换行，会显示在项目卡片和详情顶部的设计封面中。",
    },
    {
      key: "coverUrl",
      label: "详情内容图片",
      type: "file",
      hint: "上传后显示在项目详情内容中，不会替换设计封面；支持 JPG、PNG、WebP、GIF，单张不超过 8MB。",
    },
    { key: "color", label: "封面配色", type: "color" },
  ],
  experiences: [
    { key: "company", label: "公司 / 学校 / 组织", required: true },
    { key: "position", label: "职位 / 专业", required: true },
    { key: "period", label: "时间段", hint: "例如 2024 — 至今" },
    { key: "summary", label: "经历描述", type: "textarea" },
  ],
  skills: [
    { key: "title", label: "能力分组", required: true },
    {
      key: "items",
      label: "技能清单",
      type: "textarea",
      hint: "使用逗号或换行分隔。",
    },
    { key: "description", label: "简短介绍", type: "textarea" },
  ],
  interests: [
    { key: "title", label: "兴趣名称", required: true },
    { key: "description", label: "兴趣描述", type: "textarea" },
  ],
};
const templates = {
  projects: {
    title: "新的项目",
    category: "SELECTED WORK",
    year: String(new Date().getFullYear()),
    description: "",
    role: "",
    stack: "",
    result: "",
    link: "",
    coverText: "",
    coverUrl: "",
    color: "sage",
  },
  experiences: {
    company: "新的经历",
    position: "职位 / 专业",
    period: "",
    summary: "",
  },
  skills: { title: "新的能力", items: "", description: "" },
  interests: { title: "新的兴趣", description: "" },
};
export default function Admin() {
  const [content, setContent] = useState<Content | null>(null),
    [revision, setRevision] = useState(0),
    [section, setSection] = useState<Section>("profile"),
    [loading, setLoading] = useState(true),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [publishedAt, setPublishedAt] = useState(""),
    [removeId, setRemoveId] = useState<string | null>(null);
  const load = () =>
    api("/api/admin/content")
      .then((v) => {
        setContent(v.content);
        setRevision(v.revision);
        setPublishedAt(v.publishedAt);
        setDirty(false);
      })
      .catch((e) => {
        if (e.status !== 401) setError(e.message);
      })
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
    document.title = "内容管理 — Neo Studio";
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const edit = (key: string, value: string | boolean, index?: number) => {
    setContent((old) => {
      if (!old) return old;
      const next = structuredClone(old);
      if (section === "profile")
        (next.profile as unknown as Record<string, unknown>)[key] = value;
      else
        (next[section][index!] as unknown as Record<string, unknown>)[key] =
          value;
      return next;
    });
    setDirty(true);
    setNotice("");
  };
  const save = async (publish: boolean) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const v = await api("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify({ content, revision, publish }),
      });
      setRevision(v.revision);
      setPublishedAt(v.publishedAt);
      setDirty(false);
      setNotice(
        publish
          ? "已发布。打开前台即可看到最新内容。"
          : "草稿已保存，前台内容未改变。",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const add = () => {
    if (section === "profile") return;
    setContent((old) => {
      const n = structuredClone(old!);
      (n[section] as unknown[]).push({
        ...templates[section],
        id: crypto.randomUUID(),
      });
      return n;
    });
    setDirty(true);
  };
  const remove = (id: string) => {
    if (section === "profile") return;
    setContent((old) => {
      const n = structuredClone(old!);
      (n[section] as unknown) = n[section].filter((x) => x.id !== id);
      return n;
    });
    setDirty(true);
    setRemoveId(null);
  };
  const move = (index: number, delta: number) => {
    if (section === "profile") return;
    setContent((old) => {
      const n = structuredClone(old!);
      const list = n[section];
      [list[index], list[index + delta]] = [list[index + delta], list[index]];
      return n;
    });
    setDirty(true);
  };
  const logout = async () => {
    if (dirty && !confirm("有未保存的修改，仍然退出？")) return;
    try {
      await api("/api/logout", { method: "POST" });
      setContent(null);
      setDirty(false);
      setNotice("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const uploadImage = async (file: File | undefined, index?: number) => {
    if (!file || section !== "projects" || index === undefined) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      body.append("file", file);
      const value = await api("/api/admin/uploads", {
        method: "POST",
        body,
      });
      edit("coverUrl", value.url, index);
      setNotice("详情内容图片已上传，请保存草稿或发布。");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const exportJSON = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `neo-studio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const field = (f: Field, record: Record<string, unknown>, index?: number) => {
    const id = `${section}-${index ?? "profile"}-${f.key}`;
    const currentValue = String(record[f.key] ?? "");
    return (
      <div
        className={`field ${f.type === "textarea" ? "wide" : ""} ${f.type === "checkbox" ? "checkbox-field wide" : ""}`}
        key={f.key}
      >
        <label htmlFor={id}>
          {f.label}
          {f.required && <span> *</span>}
        </label>
        {f.type === "checkbox" ? (
          <input
            id={id}
            type="checkbox"
            checked={Boolean(record[f.key])}
            onChange={(e) => edit(f.key, e.target.checked, index)}
          />
        ) : f.type === "file" ? (
          <div className="image-field">
            {currentValue && (
              <div className="image-preview">
                <img src={currentValue} alt="项目详情图片预览" />
                <button
                  type="button"
                  onClick={() => edit(f.key, "", index)}
                >
                  移除图片
                </button>
              </div>
            )}
            <input
              id={id}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                void uploadImage(e.target.files?.[0], index);
                e.currentTarget.value = "";
              }}
            />
            <input
              className="image-url-input"
              type="url"
              value={currentValue}
              placeholder="或粘贴公开图片链接"
              onChange={(e) => edit(f.key, e.target.value, index)}
            />
          </div>
        ) : f.type === "textarea" ? (
          <textarea
            id={id}
            required={f.required}
            maxLength={f.key === "headline" ? 160 : 6000}
            value={String(record[f.key] ?? "")}
            rows={f.key === "headline" ? 2 : 4}
            onChange={(e) => edit(f.key, e.target.value, index)}
          />
        ) : f.type === "color" ? (
          <select
            id={id}
            value={String(record[f.key])}
            onChange={(e) => edit(f.key, e.target.value, index)}
          >
            <option value="sage">鼠尾草绿 / Sage</option>
            <option value="blue">雾蓝 / Blue</option>
            <option value="clay">陶土 / Clay</option>
          </select>
        ) : (
          <input
            id={id}
            required={f.required}
            type={f.type || "text"}
            maxLength={f.type === "url" ? 2048 : 160}
            value={String(record[f.key] ?? "")}
            onChange={(e) => edit(f.key, e.target.value, index)}
          />
        )}
        {f.hint && <small>{f.hint}</small>}
      </div>
    );
  };
  if (loading) return <div className="page-loading">正在打开内容管理…</div>;
  if (!content)
    return (
      <main className="login-page">
        <a href="/" className="login-back">
          <Icon name="arrow-left" /> 返回工作室
        </a>
        <div className="login-card">
          <div className="login-mark">N.</div>
          <div className="eyebrow">BEHIND THE SCENES</div>
          <h1>
            你的故事，
            <br />
            <em>由你来写。</em>
          </h1>
          <p>登录工作室，更新资料与作品。</p>
          <form onSubmit={login}>
            <label htmlFor="password">管理员密码</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={512}
            />
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="solid-button" disabled={busy} aria-busy={busy}>
              {busy ? (
                "正在登录…"
              ) : (
                <>
                  进入内容管理 <Icon name="arrow-up-right" />
                </>
              )}
            </button>
          </form>
          <small>首次本地启动的密码保存在项目 .env 文件中。</small>
        </div>
        <span className="login-decoration" aria-hidden="true">
          studio.
        </span>
      </main>
    );
  const items = section === "profile" ? [] : content[section];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a href="/" className="wordmark">
          {content.profile.name}
          <span>®</span>
          <small>STUDIO MANAGER</small>
        </a>
        <div className="admin-nav-title">内容工作台</div>
        <nav aria-label="管理内容">
          {(Object.keys(labels) as Section[]).map((key, i) => (
            <button
              className={section === key ? "active" : ""}
              onClick={() => {
                setSection(key);
                setRemoveId(null);
              }}
              key={key}
            >
              <span>0{i + 1}</span>
              {labels[key]}
              {key !== "profile" && <b>{content[key].length}</b>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            查看已发布网站 <Icon name="arrow-up-right" size={14} />
          </a>
          <button onClick={exportJSON}>
            导出内容备份 <Icon name="arrow-down" size={14} />
          </button>
          <button onClick={logout}>
            <Icon name="logout" size={14} /> 退出登录
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-toolbar">
          <div>
            <span className={`save-state ${dirty ? "dirty" : ""}`}>
              <i />
              {dirty ? "有未保存修改" : "所有修改已保存"}
            </span>
            <small>草稿版本 {revision}</small>
          </div>
          <div className="admin-actions">
            <button
              className="outline-button"
              onClick={() => save(false)}
              disabled={busy}
              aria-busy={busy}
            >
              <Icon name="save" size={14} /> {busy ? "处理中…" : "保存草稿"}
            </button>
            <button
              className="solid-button"
              onClick={() => save(true)}
              disabled={busy}
              aria-busy={busy}
            >
              <Icon name="publish" size={14} /> 发布到网站
            </button>
          </div>
        </header>
        <div className="admin-body">
          <div className="admin-title">
            <div>
              <div className="eyebrow">YOUR STORY, YOUR SPACE</div>
              <h1>{labels[section]}</h1>
              <p>
                {section === "profile"
                  ? "在这里介绍你自己。内容会自动同步到首页、联系区域与简历。"
                  : "管理条目与展示顺序。保存草稿后，点击发布才会更新公开网站。"}
              </p>
            </div>
            {section !== "profile" && (
              <button
                className="solid-button"
                onClick={add}
                disabled={busy || items.length >= 60}
              >
                <Icon name="plus" size={16} /> 添加条目
              </button>
            )}
          </div>
          {content.profile.demo && (
            <div className="admin-demo">
              <span>
                <Icon name="sparkles" size={23} />
              </span>
              <div>
                <strong>先从示例开始，慢慢变成你。</strong>
                <p>
                  当前资料包含虚构项目与经历。替换完成后，可在个人资料中关闭示例标记。
                </p>
              </div>
            </div>
          )}
          {notice && (
            <div className="form-success" role="status">
              <Icon name="check" size={16} /> {notice}
            </div>
          )}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <fieldset
            disabled={busy}
            aria-busy={busy}
            className="editor-fieldset"
          >
            {section === "profile" ? (
              <section className="editor-card">
                <div className="editor-grid">
                  {fields.profile.map((f) =>
                    field(
                      f,
                      content.profile as unknown as Record<string, unknown>,
                    ),
                  )}
                </div>
              </section>
            ) : items.length ? (
              items.map((item, index) => (
                <section className="editor-card" key={item.id}>
                  <header>
                    <div>
                      <span className="item-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong>
                        {"title" in item
                          ? item.title
                          : "company" in item
                            ? item.company
                            : ""}
                      </strong>
                    </div>
                    <div className="item-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={index === 0}
                        aria-label={`上移第 ${index + 1} 项`}
                        onClick={() => move(index, -1)}
                      >
                        <Icon name="arrow-up" size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={index === items.length - 1}
                        aria-label={`下移第 ${index + 1} 项`}
                        onClick={() => move(index, 1)}
                      >
                        <Icon name="arrow-down" size={15} />
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => setRemoveId(item.id)}
                      >
                        <Icon name="trash" size={14} /> 删除
                      </button>
                    </div>
                  </header>
                  {removeId === item.id && (
                    <div className="delete-confirm" role="alert">
                      <span>删除此条目？保存或发布后生效。</span>
                      <button onClick={() => remove(item.id)}>确认删除</button>
                      <button onClick={() => setRemoveId(null)}>取消</button>
                    </div>
                  )}
                  <div className="editor-grid">
                    {fields[section].map((f) =>
                      field(
                        f,
                        item as unknown as Record<string, unknown>,
                        index,
                      ),
                    )}
                  </div>
                </section>
              ))
            ) : (
              <div className="editor-empty">
                <span>
                  <Icon name="plus" size={40} />
                </span>
                <h2>这里，留给下一个故事。</h2>
                <p>点击「添加条目」开始创建内容。</p>
                <button className="solid-button" onClick={add}>
                  添加第一个条目
                </button>
              </div>
            )}
          </fieldset>
          <footer className="admin-footer">
            最近发布：
            {publishedAt
              ? new Date(publishedAt).toLocaleString("zh-CN")
              : "尚未发布"}
            <span>内容保存在服务器数据库中</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
