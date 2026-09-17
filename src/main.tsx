import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import Site from "./Site";
import "./style.css";
import "./immersive.css";
import "./interactions.css";
import "./mobile.css";
import "./editorial.css";
const Admin = lazy(() => import("./Admin"));
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="page-loading">正在打开工作室…</div>}>
      {location.pathname.startsWith("/admin") ? <Admin /> : <Site />}
    </Suspense>
  </React.StrictMode>,
);
