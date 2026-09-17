import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, type Content, type Project } from "./types";
import Icon from "./Icon";
const Room = lazy(() => import("./Room"));
const chapters = [
  ["hello", "初次见面", "THE STUDIO"],
  ["work", "项目", "SELECTED WORK"],
  ["story", "一路走来", "THE JOURNEY"],
  ["toolbox", "工具与灵感", "THE TOOLBOX"],
  ["contact", "保持联系", "SAY HELLO"],
];
function Chapter({
  id,
  className,
  sectionRef,
  children,
}: {
  id: string;
  className: string;
  sectionRef: (element: HTMLElement | null) => void;
  children: ReactNode;
}) {
  return (
    <section id={id} className={className} ref={sectionRef}>
      <div className="chapter-panel">{children}</div>
    </section>
  );
}
function ProjectArt({ project }: { project: Project }) {
  const coverText =
    project.coverText ||
    (project.color === "sage"
      ? "N."
      : project.color === "blue"
        ? "Make room\nfor focus."
        : "Notes from\nthe everyday.");
  return (
    <div className={`project-art ${project.color}`} aria-hidden="true">
      <div className="art-grid" />
      <div className="art-window">
        <div className="art-chrome">
          <i />
          <i />
          <i />
          <small>{project.category || "PROJECT"}</small>
        </div>
        <div className="art-body">
          <span>{coverText}</span>
          <div className="art-lines">
            <i />
            <i />
            <i />
          </div>
          <b>{project.year}</b>
        </div>
      </div>
      <span className="art-index">
        {project.color === "sage"
          ? "DIGITAL SPACES"
          : project.color === "blue"
            ? "LESS, BUT BETTER"
            : "COLLECT MOMENTS"}
      </span>
    </div>
  );
}
function ProjectDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    d.showModal();
    const close = () => {
      if (!d.open) onClose();
    };
    d.addEventListener("close", close);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d.removeEventListener("close", close);
      d.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <dialog
      className="project-dialog"
      ref={ref}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        className="dialog-close icon-btn"
        onClick={onClose}
        aria-label="关闭项目详情"
      >
        <Icon name="close" size={20} />
      </button>
      <ProjectArt project={project} />
      <div className="dialog-content">
        {project.coverUrl && (
          <img
            className="dialog-content-image"
            src={project.coverUrl}
            alt={`${project.title}项目内容图`}
            loading="lazy"
          />
        )}
        <div className="eyebrow">
          {project.category} · {project.year}
        </div>
        <h2>{project.title}</h2>
        <p>{project.description}</p>
        <div className="project-facts">
          <div>
            <small>我的角色</small>
            <p>{project.role}</p>
          </div>
          <div>
            <small>技术与工具</small>
            <p>{project.stack}</p>
          </div>
        </div>
        <h3>项目思考与成果</h3>
        <p>{project.result}</p>
        {project.link && (
          <a
            className="solid-button"
            href={project.link}
            target="_blank"
            rel="noreferrer"
          >
            访问项目
          </a>
        )}
      </div>
    </dialog>
  );
}
function Resume({ content }: { content: Content }) {
  const { profile: p } = content;
  return (
    <main className="resume-page">
      <div className="resume-actions">
        <a href="/">
          <Icon name="arrow-left" /> 返回工作室
        </a>
        <button className="solid-button" onClick={() => window.print()}>
          打印 / 保存 PDF
        </button>
      </div>
      {p.demo && (
        <p className="demo-note">示例简历 · 经历和项目信息待本人替换</p>
      )}
      <h1>{p.name}</h1>
      <p>
        {p.role} · {p.location}
      </p>
      {p.email && <p>{p.email}</p>}
      <p>{p.about}</p>
      <h2>项目</h2>
      {content.projects.map((x) => (
        <article key={x.id}>
          <h3>
            {x.title} <small>{x.year}</small>
          </h3>
          <p>
            {x.role} · {x.stack}
          </p>
          <p>{x.description}</p>
          <p>{x.result}</p>
        </article>
      ))}
      <h2>经历</h2>
      {content.experiences.map((x) => (
        <article key={x.id}>
          <h3>
            {x.company} · {x.position}
          </h3>
          <small>{x.period}</small>
          <p>{x.summary}</p>
        </article>
      ))}
      <h2>技能</h2>
      {content.skills.map((x) => (
        <p key={x.id}>
          <strong>{x.title}</strong> — {x.items}
        </p>
      ))}
      {p.github && <a href={p.github}>GitHub</a>}
    </main>
  );
}
export default function Site() {
  const [content, setContent] = useState<Content | null>(null),
    [error, setError] = useState(""),
    [progress, setProgress] = useState(0),
    [navigationTarget, setNavigationTarget] = useState<number | null>(null),
    [night, setNight] = useState(false),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [selected, setSelected] = useState<Project | null>(null),
    [copied, setCopied] = useState("");
  const sections = useRef<(HTMLElement | null)[]>([]);
  const frame = useRef(0);
  const navigationFrame = useRef(0);
  useEffect(() => {
    const interrupt = () => {
      cancelAnimationFrame(navigationFrame.current);
      setNavigationTarget(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
          "Tab",
        ].includes(event.key)
      )
        interrupt();
    };
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(navigationFrame.current);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(() => {
    api("/api/content")
      .then((v) => setContent(v.content))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!content) return;
    document.title = `${content.profile.name} — Digital Studio`;
    const update = () => {
      const nodes = sections.current.filter(Boolean) as HTMLElement[];
      if (!nodes.length) return;
      const offset = window.innerHeight * 0.36;
      const y = window.scrollY + offset;
      let index = 0;
      for (let i = 0; i < nodes.length; i++)
        if (y >= nodes[i].offsetTop) index = i;
      const start = nodes[index].offsetTop;
      const end =
        nodes[index + 1]?.offsetTop ?? start + nodes[index].offsetHeight;
      setProgress(
        Math.min(
          4,
          index + Math.max(0, Math.min(1, (y - start) / (end - start))),
        ),
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          entry.target.classList.toggle("in-view", entry.isIntersecting);
      },
      { rootMargin: "-8% 0px -6% 0px" },
    );
    document
      .querySelectorAll(".chapter-panel")
      .forEach((panel) => observer.observe(panel));
    const hashIndex = chapters.findIndex(
      (chapter) => `#${chapter[0]}` === location.hash,
    );
    if (hashIndex > 0) {
      const panel =
        sections.current[hashIndex]?.querySelector<HTMLElement>(
          ".chapter-panel",
        );
      if (panel)
        window.scrollTo(
          0,
          sections.current[hashIndex]!.offsetTop +
            panel.offsetTop -
            (window.innerWidth <= 900
              ? window.innerHeight * 0.32
              : Math.min(window.innerHeight * 0.2, 170)),
        );
    }
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [content]);
  const navigate = (i: number) => {
    const node = sections.current[i];
    if (!node) return;
    const panel = node.querySelector(".chapter-panel") as HTMLElement;
    const offset =
      window.innerWidth <= 900
        ? window.innerHeight * 0.32
        : Math.min(window.innerHeight * 0.2, 170);
    const destination = i === 0 ? 0 : node.offsetTop + panel.offsetTop - offset;
    cancelAnimationFrame(navigationFrame.current);
    setNavigationTarget(i);
    const from = window.scrollY;
    const to = Math.max(
      0,
      Math.min(
        destination,
        document.documentElement.scrollHeight - innerHeight,
      ),
    );
    const start = performance.now();
    const duration = reduced
      ? 0
      : Math.min(850, 420 + Math.abs(to - from) * 0.06);
    const animate = (now: number) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo({ top: from + (to - from) * eased, behavior: "instant" });
      if (t < 1) navigationFrame.current = requestAnimationFrame(animate);
      else
        navigationFrame.current = requestAnimationFrame(() =>
          setNavigationTarget(null),
        );
    };
    navigationFrame.current = requestAnimationFrame(animate);
    history.replaceState(null, "", `#${chapters[i][0]}`);
  };
  const active = navigationTarget ?? Math.min(4, Math.floor(progress));
  const closeProject = useCallback(() => setSelected(null), []);
  const copy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content.profile.email);
      setCopied("邮箱已复制");
    } catch {
      setCopied("请长按或选中邮箱复制");
    }
    setTimeout(() => setCopied(""), 3000);
  };
  if (error)
    return (
      <main className="page-loading">
        <h1>工作室暂时没能打开</h1>
        <p>{error}</p>
        <button className="solid-button" onClick={() => location.reload()}>
          重新加载
        </button>
      </main>
    );
  if (!content)
    return (
      <main className="page-loading">
        <span className="loading-mark">N.</span>
        <p>正在打开工作室…</p>
      </main>
    );
  if (location.pathname === "/resume") return <Resume content={content} />;
  const p = content.profile;
  return (
    <div
      className={`site immersive ${night ? "night" : ""}`}
      data-chapter={active}
    >
      <a className="skip-link" href="#main-content">
        跳到简历内容
      </a>
      <header className="site-header">
        <a
          className="wordmark"
          href="#hello"
          onClick={(e) => {
            e.preventDefault();
            navigate(0);
          }}
        >
          {p.name}

          <small>PERSONAL STUDIO</small>
        </a>
        <nav aria-label="主导航">
          {chapters.slice(1, 4).map((c, i) => (
            <button
              key={c[0]}
              className={active === i + 1 ? "active" : ""}
              onClick={() => navigate(i + 1)}
            >
              {c[1]}
            </button>
          ))}
        </nav>
        <button className="header-contact" onClick={() => navigate(4)}>
          联系我
        </button>
      </header>
      <aside className="scene-stage" aria-label="交互式房间">
        <div className="scene-topline">
          <span>
            <i className="live-dot" />{" "}
            {night ? "EVENING IN THE STUDIO" : "A DAY IN THE STUDIO"}
          </span>
          <span>EST. 2026</span>
        </div>
        <div className="scene-lettering" aria-hidden="true">
          the studio.
        </div>
        <Suspense
          fallback={
            <div className="room-fallback">
              <img src="/room-fallback.svg" alt="正在加载三维工作室" />
            </div>
          }
        >
          <Room
            progress={progress}
            night={night}
            reduced={reduced}
            onNavigate={navigate}
            onLamp={() => setNight((v) => !v)}
          />
        </Suspense>
        <div className="scene-caption">
          <div>
            <span className="scene-number">0{active + 1}</span>
            <div>
              <b>{chapters[active][2]}</b>
              <small>
                {
                  [
                    "想法从这里开始",
                    "每一个作品，都是一次探索",
                    "把走过的路，变成向前的底气",
                    "工具会变，好奇心不会",
                    "下一段故事，也许和你有关",
                  ][active]
                }
              </small>
            </div>
          </div>
          <div className="scene-controls">
            <button
              className="icon-btn"
              aria-label={night ? "切换日间灯光" : "切换夜间灯光"}
              aria-pressed={night}
              title="切换灯光"
              onClick={() => setNight((v) => !v)}
            >
              <Icon name={night ? "moon" : "sun"} size={18} />
            </button>
            <button
              className="icon-btn"
              aria-label={reduced ? "开启滚动镜头" : "固定总览视角"}
              aria-pressed={reduced}
              title="镜头动画"
              onClick={() => setReduced((v) => !v)}
            >
              <Icon name={reduced ? "play" : "pause"} size={18} />
            </button>
          </div>
        </div>
        <div className="scene-hint">
          滚动探索房间 <span>·</span> 也可以点点电脑和台灯
        </div>
      </aside>
      <main id="main-content" className="story-content">
        <Chapter
          id="hello"
          sectionRef={(e) => {
            sections.current[0] = e;
          }}
          className="story-section hero"
        >
          <h1>
            {p.headline.split("\n").map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </h1>

          <p className="intro-text">{p.intro}</p>
          <p className="role-line">{p.role}</p>
          <div className="hero-actions">
            <button className="solid-button" onClick={() => navigate(1)}>
              查看作品
            </button>
            <a
              className="text-link"
              href={p.resumeUrl || "/resume"}
              target="_blank"
              rel="noreferrer"
            >
              查看简历
            </a>
          </div>
        </Chapter>
        <Chapter
          id="work"
          sectionRef={(e) => {
            sections.current[1] = e;
          }}
          className="story-section works"
        >
          <div className="section-kicker">
            <span>01 / THE WORK</span>
            <span>
              {String(content.projects.length).padStart(2, "0")} PROJECTS
            </span>
          </div>
          <h2>项目</h2>
          <div className="project-list">
            {content.projects.map((project, i) => (
              <button
                className="project-card"
                key={project.id}
                onClick={() => setSelected(project)}
                aria-label={`查看项目：${project.title}`}
              >
                <ProjectArt project={project} />
                <div className="project-heading">
                  <div>
                    <small>
                      {String(i + 1).padStart(2, "0")} / {project.category}
                    </small>
                    <h3>{project.title}</h3>
                  </div>
                </div>
                <p>{project.description}</p>
                <div className="tags">
                  {project.stack
                    .split(/[,，]/)
                    .filter(Boolean)
                    .map((t, j) => (
                      <span key={j}>{t.trim()}</span>
                    ))}
                </div>
              </button>
            ))}
            {!content.projects.length && (
              <p className="empty-public">新作品正在酝酿中，敬请期待。</p>
            )}
          </div>
        </Chapter>
        <Chapter
          id="story"
          sectionRef={(e) => {
            sections.current[2] = e;
          }}
          className="story-section"
        >
          <div className="section-kicker">
            <span>02 / THE JOURNEY</span>
          </div>
          <h2>工作经历</h2>
          <p className="section-intro">每一段经历，都留下了一点新的自己。</p>
          <div className="timeline">
            {content.experiences.map((x, i) => (
              <article key={x.id}>
                <span className="timeline-dot" />
                <small>
                  {x.period}
                  {i === 0 && <b> NOW</b>}
                </small>
                <h3>{x.position}</h3>
                <div className="company">{x.company}</div>
                <p>{x.summary}</p>
              </article>
            ))}
          </div>
          <div className="about-note">
            <span>“</span>
            <p>{p.about}</p>
            <small>— {p.name}, ON THE WAY</small>
          </div>
        </Chapter>
        <Chapter
          id="toolbox"
          sectionRef={(e) => {
            sections.current[3] = e;
          }}
          className="story-section"
        >
          <div className="section-kicker">
            <span>03 / THE TOOLBOX</span>
          </div>
          <h2>技能与兴趣</h2>
          <p className="section-intro">
            用合适的工具，把细节做好。
            <br />
            也给技术之外的生活，留一点空间。
          </p>
          <div className="skill-list">
            {content.skills.map((s) => (
              <article key={s.id}>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="tags">
                    {s.items
                      .split(/[,，\n]/)
                      .filter(Boolean)
                      .map((t, j) => (
                        <span key={j}>{t.trim()}</span>
                      ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {content.interests.length > 0 && (
            <>
              <div className="interest-header">工作之外</div>
              <div className="interests">
                {content.interests.map((x, i) => (
                  <article key={x.id}>
                    <span>0{i + 1}</span>
                    <h4>{x.title}</h4>
                    <p>{x.description}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </Chapter>
        <Chapter
          id="contact"
          sectionRef={(e) => {
            sections.current[4] = e;
          }}
          className="story-section contact"
        >
          <div className="section-kicker">
            <span>04 / WHAT'S NEXT?</span>
          </div>
          <h2>保持联系</h2>
          <p className="section-intro">
            有一个想法，或只是想打个招呼？
            <br />
            我的工作室，随时欢迎新的对话。
          </p>
          {p.email && (
            <div className="email-row">
              <a href={`mailto:${p.email}`} className="email-link">
                {p.email}
              </a>
              <button
                className="icon-btn"
                data-success={copied === "邮箱已复制"}
                onClick={copy}
                aria-label="复制邮箱"
              >
                <Icon
                  name={copied === "邮箱已复制" ? "check" : "copy"}
                  size={18}
                />
              </button>
            </div>
          )}
          <span className="copy-status" role="status">
            {copied}
          </span>
          <div className="contact-links" aria-label="外部链接">
            {p.github && (
              <a
                className="contact-link"
                href={p.github}
                target="_blank"
                rel="noreferrer"
              >
                <span className="contact-link-copy">
                  <small>CODE</small>
                  <strong>GitHub</strong>
                </span>
                <Icon name="arrow-up-right" size={15} />
              </a>
            )}
            {p.websiteUrl && (
              <a
                className="contact-link"
                href={p.websiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span className="contact-link-copy">
                  <small>WEB</small>
                  <strong>个人网站</strong>
                </span>
                <Icon name="arrow-up-right" size={15} />
              </a>
            )}
            <a
              className="contact-link"
              href={p.resumeUrl || "/resume"}
              target="_blank"
              rel="noreferrer"
            >
              <span className="contact-link-copy">
                <small>PROFILE</small>
                <strong>查看简历</strong>
              </span>
              <Icon name="arrow-up-right" size={15} />
            </a>
          </div>
          <div className="contact-location">
            <span>{p.location}</span>
            <span>{p.availability}</span>
          </div>
          <footer>
            <span>
              © {new Date().getFullYear()} {p.name}
              {p.demo && <small className="demo-note">示例资料</small>}
            </span>
            <a href="/admin">内容管理</a>
          </footer>
        </Chapter>
      </main>
      <nav className="chapter-dock" data-active={active} aria-label="章节导航">
        {chapters.map((c, i) => (
          <button
            key={c[0]}
            aria-label={c[1]}
            aria-current={active === i ? "step" : undefined}
            className={active === i ? "active" : ""}
            onClick={() => navigate(i)}
          >
            <span>0{i + 1}</span>
            <b>{c[1]}</b>
          </button>
        ))}
      </nav>
      {selected && <ProjectDialog project={selected} onClose={closeProject} />}
    </div>
  );
}
