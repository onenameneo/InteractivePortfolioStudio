import { useEffect, useRef, useState } from "react";
import * as T from "three";

type Props = {
  progress: number;
  night: boolean;
  reduced: boolean;
  onNavigate: (index: number) => void;
  onLamp: () => void;
};
export default function Room(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    state = useRef(props),
    [failed, setFailed] = useState(false);
  state.current = props;
  useEffect(() => {
    const el = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailed(true);
      return;
    }
    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(-5, 5, 5, -5, 0.1, 80);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    el.appendChild(renderer.domElement);
    const materials = new Map<string, T.MeshStandardMaterial>();
    const mat = (color: string) => {
      if (!materials.has(color))
        materials.set(
          color,
          new T.MeshStandardMaterial({ color, roughness: 0.85 }),
        );
      return materials.get(color)!;
    };
    const root = new T.Group();
    scene.add(root);
    const targets: T.Object3D[] = [];
    const mesh = (
      g: T.BufferGeometry,
      c: string,
      x: number,
      y: number,
      z: number,
      parent: T.Object3D = root,
    ) => {
      const m = new T.Mesh(g, mat(c));
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const box = (
      w: number,
      h: number,
      d: number,
      c: string,
      x: number,
      y: number,
      z: number,
      parent: T.Object3D = root,
    ) => mesh(new T.BoxGeometry(w, h, d), c, x, y, z, parent);
    const cyl = (
      r: number,
      rb: number,
      h: number,
      c: string,
      x: number,
      y: number,
      z: number,
      parent: T.Object3D = root,
    ) => mesh(new T.CylinderGeometry(r, rb, h, 20), c, x, y, z, parent);
    const ball = (
      r: number,
      c: string,
      x: number,
      y: number,
      z: number,
      parent: T.Object3D = root,
    ) => mesh(new T.SphereGeometry(r, 16, 12), c, x, y, z, parent);
    const interactive = (o: T.Object3D, action: number | string) => {
      o.userData.action = action;
      targets.push(o);
    };
    const textTexture = (
      title: string,
      subtitle: string,
      bg: string,
      ink: string,
    ) => {
      const c = document.createElement("canvas");
      c.width = 768;
      c.height = 512;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(650, 80, i * 45 + 40, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = ink;
      ctx.font = "24px monospace";
      ctx.fillText("A SPACE FOR GOOD IDEAS", 52, 72);
      ctx.font = "bold 91px Georgia";
      ctx.fillText(title, 48, 260);
      ctx.font = "25px monospace";
      ctx.fillText(subtitle, 52, 425);
      const tex = new T.CanvasTexture(c);
      tex.colorSpace = T.SRGBColorSpace;
      return tex;
    };
    // Floating architectural base and individual floorboards.
    box(6.2, 0.25, 5.1, "#bbaa91", 0, -0.22, 0);
    box(6.12, 0.14, 5.02, "#e6d0ad", 0, -0.05, 0);
    for (let i = 0; i < 19; i++)
      box(
        0.313,
        0.018,
        4.94,
        i % 3 === 0 ? "#c6a478" : i % 3 === 1 ? "#d2b38a" : "#d9bd98",
        -2.9 + i * 0.322,
        0.029,
        0,
      );
    box(6.12, 3.65, 0.14, "#e8dfcc", 0, 1.78, -2.48);
    box(0.14, 3.65, 5.03, "#e0d4bd", -3, 1.78, -0.04);
    box(6, 0.11, 0.1, "#c9b99b", 0, 0.1, -2.37);
    box(0.1, 0.11, 4.96, "#c9b99b", -2.9, 0.1, 0);
    // Large window, warm reveal, four panes and sill.
    box(2.05, 2.22, 0.1, "#b49c78", 1.5, 2.12, -2.37);
    const windowMaterial = new T.MeshBasicMaterial({ color: "#dce7de" });
    const windowPane = new T.Mesh(
      new T.PlaneGeometry(1.85, 1.99),
      windowMaterial,
    );
    windowPane.position.set(1.5, 2.12, -2.3);
    root.add(windowPane);
    box(0.065, 2.12, 0.14, "#fff1d5", 1.5, 2.12, -2.22);
    box(1.96, 0.065, 0.14, "#fff1d5", 1.5, 2.22, -2.22);
    box(2.25, 0.12, 0.42, "#c4a27b", 1.5, 1.04, -2.22);
    // Desk with contrasting drawer unit.
    box(3.05, 0.14, 1.18, "#a7784e", -0.45, 1.23, -1.22);
    for (const x of [-1.82, 0.88])
      for (const z of [-1.67, -0.81])
        box(0.09, 1.16, 0.09, "#535747", x, 0.62, z);
    box(0.72, 1.0, 0.92, "#c1a077", 0.45, 0.56, -1.24);
    for (let i = 0; i < 3; i++) {
      box(0.67, 0.29, 0.03, "#d1b289", 0.45, 0.25 + i * 0.3, -0.77);
      box(0.18, 0.024, 0.035, "#695d4c", 0.45, 0.28 + i * 0.3, -0.745);
    }
    // Monitor screen is a dynamic physical surface.
    const computer = new T.Group();
    computer.position.set(-0.48, 1.31, -1.48);
    root.add(computer);
    box(0.48, 0.055, 0.3, "#424940", 0, 0, 0.08, computer);
    box(0.075, 0.25, 0.065, "#424940", 0, 0.15, 0, computer);
    box(1.45, 0.88, 0.1, "#303d37", 0, 0.67, 0, computer);
    const screenTextures = [
      textTexture(
        "hello, world.",
        "MAKE THINGS THAT MATTER.",
        "#b6c6ad",
        "#2d4939",
      ),
      textTexture("Studio.", "01 / SELECTED WORKS", "#c1d0b9", "#2d4939"),
      textTexture("Flow.", "02 / A LITTLE MORE FOCUS", "#bbd0dc", "#314a61"),
      textTexture(
        "Field notes.",
        "03 / COLLECT THE EVERYDAY",
        "#dfbca7",
        "#654a39",
      ),
    ];
    const screenMat = new T.MeshBasicMaterial({ map: screenTextures[0] });
    const screen = new T.Mesh(new T.PlaneGeometry(1.32, 0.75), screenMat);
    screen.position.set(0, 0.67, 0.056);
    computer.add(screen);
    interactive(computer, 1);
    // Keyboard, mouse, notebook, mug.
    box(0.81, 0.035, 0.27, "#ece6d4", -0.55, 1.34, -0.85);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 10; col++)
        box(
          0.052,
          0.01,
          0.043,
          "#8b9382",
          -0.89 + col * 0.074,
          1.365,
          -0.94 + row * 0.07,
        );
    const mouse = ball(0.1, "#dad8c7", 0.15, 1.35, -0.8);
    mouse.scale.set(0.68, 0.32, 1);
    const notebook = box(0.38, 0.04, 0.48, "#4e6251", -1.55, 1.34, -1.0);
    notebook.rotation.y = -0.15;
    cyl(0.1, 0.075, 0.18, "#e1d8bf", 0.72, 1.4, -1.4);
    cyl(0.077, 0.077, 0.01, "#4c3326", 0.72, 1.496, -1.4);
    // Art board on rear wall, with postcards.
    const board = new T.Group();
    board.position.set(-1.45, 2.72, -2.32);
    root.add(board);
    box(1.85, 1.12, 0.08, "#9b714e", 0, 0, 0, board);
    box(1.72, 1.0, 0.03, "#bd9c73", 0, 0, 0.05, board);
    for (let i = 0; i < 4; i++) {
      const note = box(
        0.57,
        0.34,
        0.016,
        ["#ede8d5", "#91a18e", "#e0b68e", "#ede8d5"][i],
        (i % 2) * 0.77 - 0.4,
        Math.floor(i / 2) * 0.46 - 0.24,
        0.08,
        board,
      );
      note.rotation.z = (i % 2 ? 1 : -1) * 0.08;
      ball(
        0.027,
        "#65705a",
        (i % 2) * 0.77 - 0.4,
        Math.floor(i / 2) * 0.46 - 0.11,
        0.1,
        board,
      );
    }
    interactive(board, 2);
    // Wall shelf and books on left wall.
    const shelf = new T.Group();
    root.add(shelf);
    for (let j = 0; j < 2; j++) {
      box(0.54, 0.08, 1.8, "#a7784e", -2.66, 1.95 + j * 0.88, -0.88, shelf);
      for (let i = 0; i < 7; i++) {
        const h = 0.3 + ((i * 7) % 4) * 0.075;
        const book = box(
          0.32,
          h,
          0.14,
          ["#687e68", "#dfc69a", "#b87451", "#4c6765", "#e6dfcb"][i % 5],
          -2.67,
          2.0 + j * 0.88 + h / 2,
          -1.54 + i * 0.2,
          shelf,
        );
        if (i === 6) book.rotation.x = 0.13;
      }
    }
    interactive(shelf, 3);
    // Framed print on left wall.
    box(0.08, 0.83, 0.69, "#7e654c", -2.89, 1.42, 0.93);
    box(0.09, 0.72, 0.58, "#eee6d3", -2.84, 1.42, 0.93);
    const art = ball(0.2, "#b36b4e", -2.775, 1.44, 0.93);
    art.scale.x = 0.06;
    // Sage woven rug.
    const rug = box(2.82, 0.025, 1.89, "#939d80", -0.15, 0.058, 0.75);
    rug.rotation.y = 0.06;
    for (let i = 0; i < 16; i++)
      box(0.024, 0.003, 1.8, "#aab096", -1.39 + i * 0.164, 0.073, 0.75);
    // Sculptural chair with timber legs.
    const chair = new T.Group();
    chair.position.set(-0.48, 0, 0.12);
    chair.rotation.y = -0.22;
    root.add(chair);
    box(0.79, 0.14, 0.71, "#c2784d", 0, 0.72, 0, chair);
    box(0.79, 0.71, 0.12, "#c98459", 0, 1.11, 0.32, chair);
    for (const x of [-0.29, 0.29])
      for (const z of [-0.25, 0.25]) {
        const leg = box(0.07, 0.68, 0.07, "#66503b", x, 0.36, z, chair);
        leg.rotation.z = x * 0.18;
      }
    // Reading bench and record player.
    box(1.4, 0.11, 0.77, "#9c774f", 1.87, 0.68, 0.5);
    for (const x of [1.3, 2.42])
      for (const z of [0.24, 0.77])
        box(0.06, 0.65, 0.06, "#655c49", x, 0.34, z);
    box(0.75, 0.14, 0.5, "#c5a77c", 1.95, 0.8, 0.5);
    cyl(0.185, 0.185, 0.018, "#333e36", 1.87, 0.88, 0.5);
    cyl(0.055, 0.055, 0.02, "#bd7653", 1.87, 0.895, 0.5);
    const arm = box(0.026, 0.025, 0.3, "#d8d7bc", 2.15, 0.925, 0.52);
    arm.rotation.y = -0.36;
    // Plants with carefully arranged low-poly leaves.
    function plant(x: number, y: number, z: number, scale: number) {
      const p = new T.Group();
      p.position.set(x, y, z);
      p.scale.setScalar(scale);
      root.add(p);
      cyl(0.24, 0.17, 0.42, "#b97a58", 0, 0.21, 0, p);
      cyl(0.207, 0.207, 0.015, "#5e4938", 0, 0.425, 0, p);
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4,
          h = 0.55 + (i % 4) * 0.15;
        const stem = cyl(
          0.012,
          0.014,
          h,
          "#536b43",
          Math.sin(a) * 0.08,
          0.44 + h / 2,
          Math.cos(a) * 0.08,
          p,
        );
        stem.rotation.z = Math.sin(a) * 0.24;
        const leaf = ball(
          0.24,
          i % 2 ? "#667e50" : "#84965f",
          Math.sin(a) * 0.27,
          0.58 + h,
          Math.cos(a) * 0.27,
          p,
        );
        leaf.scale.set(0.48, 1.2, 0.8);
        leaf.rotation.set(0.4 * Math.cos(a), a, Math.sin(a) * 0.5);
      }
      return p;
    }
    plant(2.28, 0, 1.76, 1.06);
    plant(2.11, 1.12, -2.13, 0.38);
    plant(-2.65, 2.87, -0.12, 0.36);
    // Floor lamp with luminous shade.
    const lamp = new T.Group();
    lamp.position.set(-2.2, 0, 1.35);
    root.add(lamp);
    cyl(0.29, 0.32, 0.06, "#5b624c", 0, 0.09, 0, lamp);
    cyl(0.023, 0.023, 1.88, "#6f7153", 0, 1.02, 0, lamp);
    const shade = mesh(
      new T.CylinderGeometry(0.19, 0.44, 0.47, 32, 1, true),
      "#e5cf9a",
      0,
      2.01,
      0,
      lamp,
    );
    (shade.material as T.MeshStandardMaterial).side = T.DoubleSide;
    const bulb = ball(0.12, "#fff0bd", 0, 1.92, 0, lamp);
    (bulb.material as T.MeshStandardMaterial).emissive.set("#eaba6b");
    const lampLight = new T.PointLight("#ffc27d", 3, 6, 2);
    lampLight.position.set(-2.2, 1.85, 1.35);
    root.add(lampLight);
    interactive(lamp, "lamp");
    // Small stack of records.
    for (let i = 0; i < 3; i++) {
      const record = box(
        0.48,
        0.065,
        0.46,
        ["#405746", "#d8b890", "#c48565"][i],
        1.0,
        0.14 + i * 0.066,
        1.7,
      );
      record.rotation.y = i * 0.12;
    }
    // Soft grounding shadow.
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sc = shadowCanvas.getContext("2d")!;
    const gradient = sc.createRadialGradient(64, 64, 5, 64, 64, 64);
    gradient.addColorStop(0, "rgba(60,48,27,.30)");
    gradient.addColorStop(1, "rgba(60,48,27,0)");
    sc.fillStyle = gradient;
    sc.fillRect(0, 0, 128, 128);
    const shadowTexture = new T.CanvasTexture(shadowCanvas);
    const ground = new T.Mesh(
      new T.PlaneGeometry(10, 8),
      new T.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.38;
    scene.add(ground);
    const ambient = new T.HemisphereLight("#fff9e9", "#928777", 2.7);
    scene.add(ambient);
    const sun = new T.DirectionalLight("#ffefd0", 3.6);
    sun.position.set(3, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    sun.shadow.normalBias = 0.035;
    scene.add(sun);
    const fill = new T.DirectionalLight("#c4d8e0", 1.1);
    fill.position.set(-3, 4, 1);
    scene.add(fill);
    let width = 1,
      height = 1,
      mobile = false,
      needsRender = true;
    const resize = () => {
      width = el.clientWidth;
      height = el.clientHeight;
      mobile = window.innerWidth <= 900;
      renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.35 : 1.65));
      renderer.setSize(width, height);
      needsRender = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const poses = [
      { p: [8, 6.5, 10], t: [0, 1.2, 0], s: 6.8, framing: -0.15 },
      { p: [2.7, 3.2, 8], t: [-0.45, 1.65, -1.1], s: 4.7, framing: 0.2 },
      { p: [1, 3.8, 8], t: [-1.25, 2.3, -1.5], s: 4.5, framing: -0.21 },
      { p: [7, 3.8, 4.5], t: [-1.9, 2, -0.75], s: 4.8, framing: 0.2 },
      { p: [4.2, 3.2, 8], t: [1.3, 1.8, -1.8], s: 4.3, framing: -0.19 },
    ];
    // Portrait shots deliberately crop the room around each chapter's subject.
    const mobilePoses = [
      { p: [8, 6.5, 10], t: [0, 1.35, -0.3], s: 7.4, framing: 0 },
      { p: [1.8, 3.3, 8], t: [-0.65, 1.8, -1.25], s: 3.7, framing: 0 },
      { p: [0.2, 3.6, 7], t: [-1.45, 2.65, -2], s: 3.6, framing: 0 },
      { p: [5, 3.8, 3], t: [-2.5, 2.45, -0.85], s: 3.8, framing: 0 },
      { p: [6, 4, 8], t: [1.45, 1.85, -1.5], s: 4.8, framing: 0 },
    ];
    const pos = new T.Vector3(8, 6.5, 10),
      look = new T.Vector3(0, 1.2, 0),
      dest = new T.Vector3(),
      target = new T.Vector3();
    let mobileLift = 0.2,
      frustum = 6.8,
      framing = -0.15,
      frame = 0,
      previous = 0,
      screenIndex = -1,
      lastReduced = state.current.reduced;
    const render = (time: number) => {
      frame = requestAnimationFrame(render);
      if (document.hidden || time - previous < (mobile ? 32 : 16)) return;
      previous = time;
      if (lastReduced !== state.current.reduced) {
        needsRender = true;
        lastReduced = state.current.reduced;
      }
      const progress = T.MathUtils.clamp(state.current.progress, 0, 4),
        i = Math.min(3, Math.floor(progress));
      let a = progress - i;
      a = T.MathUtils.smoothstep(a, mobile ? 0.32 : 0.62, 1);
      if (state.current.reduced) a = 0;
      const shots = mobile ? mobilePoses : poses;
      const current = shots[state.current.reduced ? 0 : i],
        next = shots[state.current.reduced ? 0 : i + 1];
      dest.fromArray(current.p).lerp(new T.Vector3().fromArray(next.p), a);
      target.fromArray(current.t).lerp(new T.Vector3().fromArray(next.t), a);
      const blend = state.current.reduced ? 1 : 0.08;
      pos.lerp(dest, blend);
      look.lerp(target, blend);
      frustum = T.MathUtils.lerp(
        frustum,
        T.MathUtils.lerp(current.s, next.s, a),
        blend,
      );
      const desiredFraming = T.MathUtils.lerp(current.framing, next.framing, a);
      framing = T.MathUtils.lerp(framing, desiredFraming, blend);
      const aspect = width / height;
      const size = mobile
        ? Math.max(frustum, frustum / aspect)
        : Math.max(frustum, 7 / aspect);
      const shiftX = mobile ? 0 : size * aspect * framing;
      // Leave breathing room below the mobile header while retaining close-up framing.
      const desiredMobileLift = state.current.reduced
        ? 0.2
        : T.MathUtils.lerp(0.2, 0.245, T.MathUtils.smoothstep(progress, 0, 1));
      mobileLift = T.MathUtils.lerp(mobileLift, desiredMobileLift, blend);
      const shiftY = mobile ? -size * mobileLift : -size * 0.015;
      camera.left = (-size * aspect) / 2 + shiftX;
      camera.right = (size * aspect) / 2 + shiftX;
      camera.top = size / 2 + shiftY;
      camera.bottom = -size / 2 + shiftY;
      camera.position.copy(pos);
      camera.lookAt(look);
      camera.updateProjectionMatrix();
      const night = state.current.night;
      ambient.intensity = T.MathUtils.lerp(
        ambient.intensity,
        night ? 0.65 : 2.7,
        0.06,
      );
      sun.intensity = T.MathUtils.lerp(sun.intensity, night ? 0.5 : 3.6, 0.06);
      lampLight.intensity = night ? 7 : 1.7;
      windowMaterial.color.lerp(
        new T.Color(night ? "#44556b" : "#dce7de"),
        0.06,
      );
      const index =
        progress > 0.8 && progress < 1.9
          ? 1 + Math.min(2, Math.floor((progress - 0.8) * 3))
          : 0;
      if (index !== screenIndex) {
        screenMat.map = screenTextures[index];
        screenIndex = index;
        needsRender = true;
      }
      const moving =
        (mobile && Math.abs(mobileLift - desiredMobileLift) > 0.00001) ||
        Math.abs(framing - desiredFraming) > 0.00001 ||
        pos.distanceToSquared(dest) > 0.000001 ||
        look.distanceToSquared(target) > 0.000001 ||
        Math.abs(frustum - T.MathUtils.lerp(current.s, next.s, a)) > 0.0001 ||
        Math.abs(ambient.intensity - (night ? 0.65 : 2.7)) > 0.001 ||
        Math.abs(sun.intensity - (night ? 0.5 : 3.6)) > 0.001;
      if (needsRender || moving || time < 1500) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    };
    frame = requestAnimationFrame(render);
    const ray = new T.Raycaster(),
      pointer = new T.Vector2();
    const hit = (event: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.set(
        ((event.clientX - r.left) / r.width) * 2 - 1,
        (-(event.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(targets, true);
      if (!hits.length) return;
      let o: T.Object3D | null = hits[0].object;
      while (o && o.userData.action === undefined) o = o.parent;
      return o?.userData.action;
    };
    let pointerStart = { x: 0, y: 0 };
    const down = (e: PointerEvent) => {
      pointerStart = { x: e.clientX, y: e.clientY };
    };
    const click = (e: PointerEvent) => {
      if (
        Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 8
      )
        return;
      const action = hit(e);
      if (action === "lamp") state.current.onLamp();
      else if (typeof action === "number") state.current.onNavigate(action);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.style.cursor = hit(e) !== undefined ? "pointer" : "default";
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
      cancelAnimationFrame(frame);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", click);
    el.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", click);
      el.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          const list = Array.isArray(o.material) ? o.material : [o.material];
          list.forEach((m) => m.dispose());
        }
      });
      screenTextures.forEach((t) => t.dispose());
      shadowTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      className="room-render"
      ref={host}
      role="img"
      aria-label="木质微缩工作室：电脑、经历墙、书架、植物和台灯。滚动页面切换视角。"
    >
      {failed && (
        <div className="room-fallback">
          <img src="/room-fallback.svg" alt="微缩工作室插画" />
          <span>静态浏览模式 · 内容完整可读</span>
        </div>
      )}
    </div>
  );
}
