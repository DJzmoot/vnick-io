/*
 * The vNick.io 3D rack — ported from reference/prototype.html (three r128, CDN)
 * to the npm three release. Changes from the prototype:
 *  - ES module with imports instead of a global THREE.
 *  - r152+ color management and r155+ physical light units are active, so the
 *    light intensities below are retuned by eye to match the prototype's look
 *    rather than copied (the rim PointLight most of all: candela + inverse-
 *    square decay now, linear falloff then).
 *  - Rendering pauses while the tab is hidden.
 * Geometry, materials and LED behavior are unchanged from the prototype; the
 * scroll choreography is extended to five stages, one per writing topic.
 */
import * as THREE from 'three';

type LedMode = 'busy' | 'breathe' | 'steady';

// Retuned for physical lighting units + sRGB output (r128 values in comments).
const HEMI_INTENSITY = 1.6;  // was 0.55
const KEY_INTENSITY = 3.6;   // was 1.25
const TOP_INTENSITY = 1.3;   // was 0.45
const FILL_INTENSITY = 2.0;  // was 0.45
const RIM_INTENSITY = 55;    // was 3.2 with linear falloff over distance 14
const PULL_EMISSIVE = 0.08;  // was 0.22; emissive output is encoded to sRGB now, so far less is needed

export function initRack(): void {
  const root = document.documentElement;
  const canvas = document.getElementById('scene') as HTMLCanvasElement | null;
  if (!canvas) return;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    root.classList.add('no3d');
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // r186: PCFSoftShadowMap is deprecated in favor of PCFShadowMap

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.9, 10);
  camera.lookAt(0, 0.1, 0);

  scene.add(new THREE.HemisphereLight(0xb9c6e6, 0x0a0d16, HEMI_INTENSITY));
  const key = new THREE.DirectionalLight(0xffffff, KEY_INTENSITY);
  key.position.set(-4, 5, 7); scene.add(key); scene.add(key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.015;
  Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: 1, far: 22 });
  key.shadow.camera.updateProjectionMatrix();
  const top = new THREE.DirectionalLight(0xeef0f3, TOP_INTENSITY);
  top.position.set(0, 8, 2); scene.add(top); scene.add(top.target);
  const fill = new THREE.DirectionalLight(0x6f86c4, FILL_INTENSITY);
  fill.position.set(6, -1, 3); scene.add(fill);
  const rim = new THREE.PointLight(0x1f4bd1, RIM_INTENSITY, 14);
  rim.position.set(3, 1.5, -3.5); scene.add(rim);

  // ---------- Rack ----------
  const U = 0.2, W = 2.0, D = 2.2, HU = 16, H = HU * U;
  const FZ = D / 2;          // front plane of the rack frame
  const FACE = FZ - 0.07;    // front face of every chassis body
  const rack = new THREE.Group(); scene.add(rack);
  const mat = (c: number, m: number, r: number) =>
    new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r });
  const frameMat = mat(0x15171b, 0.55, 0.5), railMat = mat(0x30343c, 0.75, 0.32), holeMat = mat(0x050506, 0, 1);
  const carrierMat = mat(0x2b2f37, 0.55, 0.38), handleMat = mat(0x6b7280, 0.85, 0.25), darkMat = mat(0x0a0b0d, 0.2, 0.85);
  const bezelMat = mat(0x33373f, 0.5, 0.35), plateMat = mat(0x2a2d34, 0.6, 0.4), screwMat = mat(0x8a919d, 0.9, 0.22);
  const sfpMat = mat(0x7b828e, 0.9, 0.25);

  // rounded, bevelled box (cached geometry)
  const geoCache: Record<string, THREE.ExtrudeGeometry> = {};
  function rgeo(w: number, h: number, d: number, r: number): THREE.ExtrudeGeometry {
    const k = [w, h, d, r].map((v) => v.toFixed(4)).join('|');
    if (geoCache[k]) return geoCache[k];
    const b = Math.min(r, d / 3, h / 4, w / 4);
    const iw = w - 2 * b, ih = h - 2 * b, c = Math.min(r, iw / 2, ih / 2) * 0.6;
    const s = new THREE.Shape(), x = -iw / 2, y = -ih / 2;
    s.moveTo(x + c, y); s.lineTo(x + iw - c, y); s.quadraticCurveTo(x + iw, y, x + iw, y + c);
    s.lineTo(x + iw, y + ih - c); s.quadraticCurveTo(x + iw, y + ih, x + iw - c, y + ih);
    s.lineTo(x + c, y + ih); s.quadraticCurveTo(x, y + ih, x, y + ih - c);
    s.lineTo(x, y + c); s.quadraticCurveTo(x, y, x + c, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 3 });
    g.center(); geoCache[k] = g; return g;
  }
  function rb(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, r?: number): THREE.Mesh {
    const o = new THREE.Mesh(rgeo(w, h, d, r == null ? 0.012 : r), m); o.position.set(x, y, z); parent.add(o); return o;
  }
  function box(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material): THREE.Mesh {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o;
  }
  // z for an object of depth d whose back sits `lift` in front of the chassis face
  const on = (d: number, lift?: number) => FACE + (lift || 0) + d / 2;

  interface Led { m: THREE.MeshBasicMaterial; on: THREE.Color; off: THREE.Color; mode: LedMode; next: number; state: boolean; ph: number }
  const leds: Led[] = [], ledGeo: Record<number, THREE.CircleGeometry> = {};
  function led(parent: THREE.Object3D, x: number, y: number, z: number, s: number, color: number, mode: LedMode): THREE.Mesh {
    const g = ledGeo[s] || (ledGeo[s] = new THREE.CircleGeometry(s / 2, 12));
    const m = new THREE.MeshBasicMaterial({ color });
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z); parent.add(o);
    const c = new THREE.Color(color);
    leds.push({ m, on: c, off: c.clone().multiplyScalar(0.1), mode, next: Math.random() * 800, state: true, ph: Math.random() * 6 });
    return o;
  }
  const screwGeo = new THREE.CylinderGeometry(0.017, 0.017, 0.03, 14); screwGeo.rotateX(Math.PI / 2);
  function screw(parent: THREE.Object3D, x: number, y: number): void {
    const o = new THREE.Mesh(screwGeo, screwMat); o.position.set(x, y, FZ + 0.065); parent.add(o);
  }

  // frame: posts, top/bottom, perforated front rails
  ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).forEach(([sx, sz]) => rb(rack, 0.1, H + 0.24, 0.1, sx * (W / 2 + 0.1), 0, sz * (FZ + 0.02), frameMat, 0.02));
  rb(rack, W + 0.34, 0.08, D + 0.18, 0, H / 2 + 0.14, 0, frameMat, 0.02);
  rb(rack, W + 0.34, 0.08, D + 0.18, 0, -H / 2 - 0.14, 0, frameMat, 0.02);
  [-1, 1].forEach((sx) => {
    rb(rack, 0.07, H + 0.12, 0.04, sx * (W / 2 + 0.045), 0, FZ + 0.02, railMat, 0.008);
    for (let i = 0; i < HU * 3; i++) box(rack, 0.022, 0.022, 0.004, sx * (W / 2 + 0.045), H / 2 - (i + 0.5) * U / 3, FZ + 0.042, holeMat);
  });

  const units: THREE.Group[] = [];
  function chassis(hu: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const h = hu * U - 0.016;
    const bodyMat = mat(color, 0.5, 0.4);
    rb(g, W - 0.04, h, D - 0.14, 0, 0, FACE - (D - 0.14) / 2, bodyMat, 0.014);
    // rack ears with thumbscrews
    [-1, 1].forEach((sx) => {
      rb(g, 0.1, h, 0.03, sx * (W / 2 + 0.01), 0, FZ + 0.035, plateMat, 0.008);
      if (hu === 1) screw(g, sx * (W / 2 + 0.015), 0);
      else { screw(g, sx * (W / 2 + 0.015), h / 4); screw(g, sx * (W / 2 + 0.015), -h / 4); }
    });
    // side flanges bridging face to ears so the front reads as one piece
    [-1, 1].forEach((sx) => rb(g, 0.05, h, 0.12, sx * (W / 2 - 0.03), 0, on(0.12, -0.04), plateMat, 0.008));
    g.userData = { h, bodyMat, pull: 0, window: null };
    return g;
  }

  function makeSwitch(): THREE.Group {
    const g = chassis(1, 0x2c3037), h = g.userData.h;
    rb(g, W - 0.16, h - 0.02, 0.04, 0, 0, on(0.04), bezelMat, 0.01);
    const pz = on(0.04) + 0.02;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 24; c++) {
      const x = -W / 2 + 0.17 + c * 0.058 + Math.floor(c / 6) * 0.018, y = r ? -0.036 : 0.034;
      rb(g, 0.05, 0.044, 0.03, x, y, pz - 0.006, darkMat, 0.004);                 // recessed port opening
      box(g, 0.03, 0.012, 0.004, x, y + (r ? -0.012 : 0.012), pz + 0.004, handleMat); // latch tab
      if (Math.random() < 0.85) led(g, x - 0.016, y + (r ? -0.028 : 0.028), pz + 0.01, 0.013, c % 9 === 4 ? 0xffb020 : 0x36d27a, 'busy');
    }
    for (let i = 0; i < 4; i++) rb(g, 0.075, 0.06, 0.05, 0.6 + i * 0.088, 0, pz + 0.01, sfpMat, 0.006);
    led(g, 0.95, 0.05, pz + 0.01, 0.018, 0x4d86ff, 'breathe');
    return g;
  }
  function makeBlank(): THREE.Group {
    const g = chassis(1, 0x24272d), h = g.userData.h;
    rb(g, W - 0.16, h - 0.02, 0.025, 0, 0, on(0.025), plateMat, 0.008);
    for (let i = 0; i < 30; i++) rb(g, 0.02, 0.1, 0.02, -0.8 + i * 0.055, 0, on(0.02, 0.012), darkMat, 0.006);
    return g;
  }
  function makeController(): THREE.Group {
    const g = chassis(2, 0x2f333b), h = g.userData.h;
    // deep front bezel with a crowned face
    rb(g, W - 0.16, h - 0.02, 0.1, 0, 0, on(0.1), bezelMat, 0.03);
    rb(g, W - 0.3, h - 0.1, 0.03, 0, 0.01, on(0.03, 0.09), mat(0x3a3f48, 0.55, 0.3), 0.02);
    const vz = on(0.02, 0.115);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 30; i++) rb(g, 0.028, 0.028, 0.02, -0.78 + i * 0.042 + (r % 2) * 0.021, 0.07 - r * 0.045, vz, darkMat, 0.012);
    box(g, W - 0.5, 0.01, 0.01, 0, -h / 2 + 0.045, on(0.01, 0.1), new THREE.MeshBasicMaterial({ color: 0x78be20 }));
    rb(g, 0.34, 0.075, 0.02, 0.6, -0.08, on(0.02, 0.1), darkMat, 0.006);
    led(g, 0.52, -0.08, on(0, 0.125), 0.02, 0x4d86ff, 'breathe');
    led(g, 0.6, -0.08, on(0, 0.125), 0.02, 0x36d27a, 'steady');
    led(g, 0.68, -0.08, on(0, 0.125), 0.02, 0x36d27a, 'steady');
    return g;
  }
  function makeShelf(n: number): THREE.Group {
    const g = chassis(2, 0x262a30), h = g.userData.h;
    const bw = (W - 0.2) / 24;
    for (let i = 0; i < 24; i++) {
      const x = -W / 2 + 0.1 + bw * (i + 0.5);
      rb(g, bw - 0.012, h - 0.03, 0.09, x, 0, on(0.09), carrierMat, 0.01);            // drive carrier
      rb(g, bw - 0.026, 0.03, 0.035, x, h / 2 - 0.05, on(0.035, 0.09), handleMat, 0.01); // pull handle
      for (let v = 0; v < 4; v++) box(g, bw - 0.04, 0.006, 0.004, x, 0.03 - v * 0.02, on(0.004, 0.09), darkMat); // carrier vents
      rb(g, 0.018, 0.012, 0.01, x, -h / 2 + 0.085, on(0.01, 0.09), handleMat, 0.004);   // latch
      let color = 0x36d27a; let mode: LedMode = 'busy';
      if (n === 1 && i === 9) { color = 0xffa31a; mode = 'breathe'; }
      if (n === 2 && i === 21) { color = 0x4d86ff; mode = 'breathe'; }
      led(g, x, -h / 2 + 0.045, on(0, 0.092), 0.026, color, mode);
    }
    return g;
  }
  function makeServer(): THREE.Group {
    const g = chassis(1, 0x2b2f36), h = g.userData.h;
    for (let i = 0; i < 8; i++) {
      const x = -0.86 + i * 0.1;
      rb(g, 0.09, h - 0.03, 0.07, x, 0, on(0.07), carrierMat, 0.008);
      rb(g, 0.07, 0.02, 0.02, x, 0.035, on(0.02, 0.07), handleMat, 0.006);
      led(g, x + 0.028, -0.045, on(0, 0.072), 0.015, 0x36d27a, 'busy');
    }
    rb(g, 1.02, h - 0.02, 0.06, 0.44, 0, on(0.06), bezelMat, 0.02);
    for (let i = 0; i < 20; i++) rb(g, 0.018, 0.1, 0.02, 0.02 + i * 0.045, 0, on(0.02, 0.055), darkMat, 0.006);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 18).rotateX(Math.PI / 2), handleMat);
    btn.position.set(0.92, 0, on(0.03, 0.05)); g.add(btn);
    led(g, 0.92, 0, on(0, 0.082), 0.014, 0x4d86ff, 'steady');
    return g;
  }
  function makeUPS(): THREE.Group {
    const g = chassis(2, 0x202328), h = g.userData.h;
    rb(g, W - 0.16, h - 0.02, 0.09, 0, 0, on(0.09), bezelMat, 0.035);
    rb(g, 0.56, 0.2, 0.02, -0.36, 0.03, on(0.02, 0.085), darkMat, 0.01);
    box(g, 0.48, 0.14, 0.004, -0.36, 0.03, on(0.004, 0.102), new THREE.MeshBasicMaterial({ color: 0x173a9e }));
    for (let i = 0; i < 5; i++) led(g, 0.18 + i * 0.08, 0.06, on(0, 0.092), 0.026, 0x36d27a, 'steady');
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 20).rotateX(Math.PI / 2), handleMat); b.position.set(0.22 + i * 0.12, -0.07, on(0.03, 0.085)); g.add(b); }
    for (let i = 0; i < 16; i++) rb(g, 0.018, 0.12, 0.02, -0.92 + i * 0.03 + (i > 7 ? 1.4 : 0), -0.05, on(0.02, 0.085), darkMat, 0.006);
    return g;
  }

  // Each unit belongs to one of the five writing topics; it slides out during
  // that topic's scroll stage (see the section ids in stopsEls below).
  const plan: [THREE.Group, number, string | null][] = [
    [makeSwitch(), 1, 'network'], [makeBlank(), 1, null], [makeController(), 2, 'cloud'],
    [makeShelf(0), 2, 'bcdr'], [makeShelf(1), 2, 'bcdr'], [makeShelf(2), 2, 'bcdr'],
    [makeServer(), 1, 'virt'], [makeServer(), 1, 'virt'], [makeBlank(), 1, null], [makeUPS(), 2, 'lighting'],
  ];
  let yTop = H / 2 - 0.5 * U;
  let shelfIdx = 0, srvIdx = 0;
  plan.forEach(([g, hu, topic]) => {
    g.position.y = yTop - hu * U / 2; yTop -= hu * U;
    rack.add(g); units.push(g);
    if (topic === 'network') g.userData.window = [0.5, 1.75];
    if (topic === 'virt') { g.userData.window = [1.5 + srvIdx * 0.12, 2.75]; srvIdx++; }
    if (topic === 'bcdr') { g.userData.window = [2.5 + shelfIdx * 0.12, 3.75]; shelfIdx++; }
    if (topic === 'cloud') g.userData.window = [3.5, 4.75];
    if (topic === 'lighting') g.userData.window = [4.5, 5.7];
  });

  rack.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) { o.castShadow = true; o.receiveShadow = true; }
  });
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.ShadowMaterial({ color: 0x061033, opacity: 0.6 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.y = -H / 2 - 0.175; catcher.receiveShadow = true; rack.add(catcher);

  // floor glow
  const gc = document.createElement('canvas'); gc.width = gc.height = 256;
  const gx = gc.getContext('2d')!;
  const grd = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(38,78,190,.5)'); grd.addColorStop(0.45, 'rgba(20,40,110,.18)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  gx.fillStyle = grd; gx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(gc);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -H / 2 - 0.16; rack.add(floor);

  // ---------- Scroll state ----------
  const stopsEls = ['top', 'network', 'virtualization', 'bcdr', 'cloud', 'lighting', 'writing'].map((id) => document.getElementById(id));
  if (stopsEls.some((el) => !el)) { root.classList.add('no3d'); return; }
  let stops: number[] = [];
  function measure(): void { stops = stopsEls.map((el) => el!.getBoundingClientRect().top + window.scrollY); stops[0] = 0; }
  function progress(): number {
    const y = window.scrollY;
    for (let i = 0; i < stops.length - 1; i++) {
      if (y < stops[i + 1]) return i + (y - stops[i]) / Math.max(1, stops[i + 1] - stops[i]);
    }
    return stops.length - 1 + (y - stops[stops.length - 1]) / window.innerHeight;
  }
  const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  function resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); measure();
  }
  window.addEventListener('resize', resize); resize();
  window.addEventListener('load', measure);
  // web fonts change section heights once they arrive; re-measure the stops
  document.fonts?.ready.then(measure);

  let s = progress(), yaw = -0.5;
  function slotX(depth: number): number {
    const w = window.innerWidth, content = Math.min(1200, w - 48);
    const px = (w - content) / 2 + content * 0.76;
    const ndc = px / w * 2 - 1;
    return ndc * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth * camera.aspect;
  }
  const pullTint = new THREE.Color(0x5a9a14); // green highlight on slid-out units

  function frame(t: number): void {
    const target = progress();
    s = reduce ? target : s + (target - s) * 0.09;
    const wide = window.innerWidth > 900;

    // orientation per stage: small turns through the four IT stages, then the
    // swing to a side profile for lighting/production before the fade
    const baseYaw = s < 1 ? lerp(-0.5, -0.82, ss(0, 1, s))
                  : s < 2 ? lerp(-0.82, -0.42, ss(1, 2, s))
                  : s < 3 ? lerp(-0.42, -0.72, ss(2, 3, s))
                  : s < 4 ? lerp(-0.72, -0.35, ss(3, 4, s))
                  : lerp(-0.35, -1.28, ss(4, 5, s));
    yaw += (baseYaw - yaw) * (reduce ? 1 : 0.07);
    rack.rotation.y = yaw;
    rack.rotation.x = 0.06;

    const zoom = lerp(0, -0.8, ss(4.4, 5.2, s));
    const x = wide ? slotX(camera.position.z - zoom) : 0;
    rack.position.set(x, wide ? 0.1 : 0.9, zoom);
    key.position.set(x - 4, 5, zoom + 7); key.target.position.copy(rack.position);
    top.position.set(x, 8, zoom + 2); top.target.position.copy(rack.position);
    const sc = wide ? 1 : 0.78; rack.scale.set(sc, sc, sc);

    // units slide out on their topic's stage
    units.forEach((u) => {
      const w = u.userData.window as [number, number] | null;
      const pull = w ? ss(w[0], w[0] + 0.35, s) * (1 - ss(w[1] - 0.35, w[1], s)) : 0;
      u.userData.pull += (pull - u.userData.pull) * (reduce ? 1 : 0.12);
      u.position.z = u.userData.pull * 1.35;
      (u.userData.bodyMat as THREE.MeshStandardMaterial).emissive.copy(pullTint).multiplyScalar(u.userData.pull * PULL_EMISSIVE);
    });

    canvas!.style.opacity = String((1 - ss(5.35, 6, s) * 0.85) * (wide ? 1 : 0.6));

    // drive activity
    for (let i = 0; i < leds.length; i++) {
      const L = leds[i];
      if (L.mode === 'steady') continue;
      if (L.mode === 'breathe') { L.m.color.copy(L.off).lerp(L.on, reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 0.003 + L.ph)); continue; }
      if (reduce) { if (!L.state) { L.state = true; L.m.color.copy(L.on); } continue; }
      if (t > L.next) {
        L.state = !L.state || Math.random() < 0.25;
        L.next = t + (L.state ? 80 + Math.random() * 1100 : 25 + Math.random() * 110);
        L.m.color.copy(L.state ? L.on : L.off);
      }
    }
    renderer.render(scene, camera);
  }

  // render loop, paused while the tab is hidden
  let raf = 0;
  const loop = (t: number): void => { frame(t); raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(loop);
  });
  raf = requestAnimationFrame(loop);
}
