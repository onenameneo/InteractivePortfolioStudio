# Interactive Portfolio Studio

一个可自托管的交互式作品集与简历站点模板。

项目使用全屏 3D 场景、滚动叙事和浮动内容面板展示作品集内容，并提供一个轻量的内容管理后台。所有示例资料都可以从后台替换，适合用作作品集、简历站点或创意项目展示页的起点。

## 功能

- Three.js 3D 工作室场景与五个内容章节
- 桌面端、移动端和 WebGL 不可用时的回退展示
- 项目、经历、技能和兴趣等结构化内容
- GitHub、个人网站、简历和项目链接配置
- 项目详情图片上传或外部图片 URL
- 草稿保存、版本控制和一键发布
- 内置简历页，可直接打印或保存为 PDF
- SQLite 持久化，不依赖第三方数据库服务
- HttpOnly 会话、来源校验、结构校验和登录限速
- 支持系统减少动态效果和手动固定 3D 总览视角

## 技术栈

- React 19 + TypeScript
- Three.js
- Vite
- Express 5
- SQLite（Node.js `node:sqlite`）
- Zod

## 快速开始

需要 Node.js 24 或更高版本。

```sh
npm install
npm run dev
```

启动后访问：

- 网站：<http://127.0.0.1:3100>
- 内容管理：<http://127.0.0.1:3100/admin>
- 简历页：<http://127.0.0.1:3100/resume>

首次启动会在项目根目录生成 `.env`，并写入一个随机的后台密码。打开 `.env` 查看密码，或将 `ADMIN_PASSWORD` 修改为至少 12 位的自定义密码，然后重启服务。

开发模式支持前端热更新，服务端文件变更后会自动重启。

## 内容管理

1. 使用 `.env` 中的 `ADMIN_PASSWORD` 登录 `/admin`。
2. 在「个人资料」中配置站点名称、标题、介绍、邮箱、所在地、合作状态、GitHub、个人网站和简历链接。
3. 在「项目」「经历与教育」「技能工具」「生活与兴趣」中编辑、添加、删除和排序内容。
4. 使用「保存草稿」保存修改，但不影响公开页面。
5. 使用「发布到网站」更新公开版本。
6. 替换示例资料后，可以关闭「显示示例资料标记」。

项目链接、GitHub、个人网站和简历链接必须使用 `http://` 或 `https://`。个人网站未填写时，前台不会显示对应入口。

项目图片支持 JPG、PNG、WebP 和 GIF，单张最大 8MB。图片可以上传到站点，也可以填写公开图片 URL；详情页会限制图片宽度并保持原始比例，避免裁切。

简历链接留空时使用内置 `/resume` 页面。打开简历页后，可以使用浏览器的「打印 / 保存 PDF」功能导出文件。

## 环境变量

可以复制 `.env.example` 为 `.env`，或让服务首次启动时自动生成配置文件。

```dotenv
PORT=3100
HOST=127.0.0.1
ADMIN_PASSWORD=replace-with-a-long-unique-password
COOKIE_SECURE=false
# DATABASE_PATH=/absolute/path/to/studio.sqlite
```

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3100` | HTTP 服务端口 |
| `HOST` | `127.0.0.1` | 监听地址；局域网测试可设为 `0.0.0.0` |
| `ADMIN_PASSWORD` | 首次启动随机生成 | 后台密码，至少 12 位 |
| `COOKIE_SECURE` | `false` | HTTPS 部署时设为 `true` |
| `DATABASE_PATH` | `data/studio.sqlite` | 可选的 SQLite 数据库绝对路径 |

`.env`、数据库、上传文件和构建产物已加入 `.gitignore`，不要将它们提交到公开仓库。

## 数据与持久化

默认数据目录为 `data/`，包括：

- `studio.sqlite`：草稿、公开版本、版本号和后台会话
- `uploads/`：后台上传的项目图片

生产部署时需要为 `data/` 配置可写且持久化的磁盘。只提供临时文件系统的静态托管平台不适合直接运行完整服务。

首次初始化会写入 `server/content.js` 中的示例内容。初始化完成后，修改种子内容不会覆盖已经保存的数据。

建议在停止服务后备份整个 `data/` 目录。服务运行期间请使用 SQLite 在线备份能力，以免遗漏 WAL 文件中的数据。

## 本地验证与生产运行

```sh
npm run check   # TypeScript 类型检查
npm test        # API 与数据流测试
npm run build   # 构建前端
npm start       # 运行生产构建
```

`npm start` 会同时提供构建后的前端和 API，因此生产启动前需要先执行 `npm run build`。

公开部署时建议：

- 使用 HTTPS 反向代理
- 设置 `COOKIE_SECURE=true`
- 保留原始 `Host` 请求头
- 为 `data/` 配置持久化存储
- 使用强随机的 `ADMIN_PASSWORD`

登录使用 HttpOnly、SameSite=Strict 会话 Cookie。写入接口要求自定义请求头并检查来源，内容提交会经过 Zod 结构校验，登录失败会触发频率限制。

## 项目结构

```text
src/Site.tsx       公开页面、章节、项目详情和简历
src/Room.tsx       3D 场景、镜头、交互与资源清理
src/Admin.tsx      内容管理后台
src/types.ts       前端内容类型与 API 客户端
server/content.js  内容 Schema 与示例数据
server/app.js      API、鉴权、SQLite 与版本控制
server/index.js    开发 / 生产服务入口
public/            图标与 WebGL 回退插画
tests/             API 与浏览器冒烟测试
```

## 自定义入口

常见的定制位置：

- 修改内容字段和默认示例：`server/content.js`
- 修改公开页面结构：`src/Site.tsx`
- 修改 3D 场景：`src/Room.tsx`
- 修改视觉样式：`src/style.css`、`src/immersive.css`、`src/mobile.css`
- 修改后台表单：`src/Admin.tsx`、`src/admin.css`
- 修改页面元信息：`index.html`

新增或修改内容字段时，需要同步更新 `src/types.ts`、后台字段配置和 `server/content.js` 中的 Schema；如果字段用于默认内容，也要同步更新 `seed`。

## 许可证

当前仓库未附带 LICENSE 文件。公开发布前，请根据项目维护者的授权意图添加明确的开源许可证。
