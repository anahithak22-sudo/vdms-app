import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const COUNT = 4600;
const SIDE = 0.98;
const SCATTER = 1.7;

const COLORS = ['#8052ff', '#8052ff', '#8052ff', '#a855f7', '#ffffff', '#ffffff', '#ffb829', '#15846e', '#c026d3', '#3b82f6'];

function fib(i: number, n: number): THREE.Vector3 {
  const phi = Math.acos(1 - 2 * (i + 0.5) / n);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
}

/** Rasterize a 2D drawing and sample COUNT particle targets from opaque pixels,
 *  auto-centered and normalized so the shape fits a consistent size. */
function sampleCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, target: number, depth: number): THREE.Vector3[] {
  const w = 480, h = 320;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  draw(ctx, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x, y });
    }
  }
  if (pts.length === 0) return Array.from({ length: COUNT }, () => new THREE.Vector3());
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const p of pts) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const half = Math.max(maxX - minX, maxY - minY) / 2;
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < COUNT; i++) {
    const p = pts[(Math.random() * pts.length) | 0];
    out.push(new THREE.Vector3(
      ((p.x - cx) / half) * target + (Math.random() - 0.5) * 0.015,
      ((cy - p.y) / half) * target + (Math.random() - 0.5) * 0.015,
      (Math.random() - 0.5) * depth,
    ));
  }
  return out;
}

/** VDMS mark — three right-leaning parallelogram bars. */
function vdmsLogo(): THREE.Vector3[] {
  return sampleCanvas((ctx, w, h) => {
    const bw = w * 0.5, bh = h * 0.14, gap = h * 0.09, s = bh * 1.1;
    const x0 = w * 0.24, y0 = h * 0.26;
    for (let k = 0; k < 3; k++) {
      const y = y0 + k * (bh + gap);
      ctx.beginPath();
      ctx.moveTo(x0 + s, y);
      ctx.lineTo(x0 + s + bw, y);
      ctx.lineTo(x0 + bw, y + bh);
      ctx.lineTo(x0, y + bh);
      ctx.closePath();
      ctx.fill();
    }
  }, 1.05, 0.08);
}

/** VTB wordmark. */
function vtbLogo(): THREE.Vector3[] {
  return sampleCanvas((ctx, w, h) => {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "900 200px 'Inter', Arial, sans-serif";
    ctx.fillText('VTB', w / 2, h / 2 + 6);
  }, 1.15, 0.08);
}

/** Clean tilted 3D lightbulb (surface of revolution). */
function bulbShape(n: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.14, 0, -0.30));
  const cy = 0.42, R = 0.6;
  const profileR = (y: number): number => {
    if (y >= -0.05) return Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
    if (y >= -0.30) return 0.24 + (0.37 - 0.24) * ((y + 0.30) / 0.25);
    return 0.25 + Math.sin(y * 40) * 0.014;
  };
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let y: number;
    if (t < 0.66) y = -0.05 + Math.random() * 1.05;
    else if (t < 0.74) y = -0.30 + Math.random() * 0.25;
    else y = -0.92 + Math.random() * 0.62;
    const a = Math.random() * Math.PI * 2;
    const r = profileR(y);
    out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).applyQuaternion(q));
  }
  return out;
}

function smooth(x: number): number { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

export function ParticleBrain() {
  const mountRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 3.7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Three shapes: VDMS logo → VTB → lightbulb
    const s0 = vdmsLogo();
    const s1 = vtbLogo();
    const s2 = bulbShape(COUNT);
    void fib; // (kept for potential reuse)

    const scatterDir: THREE.Vector3[] = [];
    const current: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      scatterDir.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.5 + Math.random()));
      current.push(s0[i].clone());
    }

    const geo = new THREE.TetrahedronGeometry(0.018);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const floatPhase = new Float32Array(COUNT);
    const scaleArr = new Float32Array(COUNT);
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      floatPhase[i] = Math.random() * Math.PI * 2;
      scaleArr[i] = 0.6 + Math.random() * 1.0;
      c.set(COLORS[(Math.random() * COLORS.length) | 0]);
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    const group = new THREE.Group();
    group.add(mesh);
    scene.add(group);
    const dummy = new THREE.Object3D();
    const tmp = new THREE.Vector3();
    let groupX = SIDE;

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);
    function onScroll() {
      const max = document.body.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let raf = 0, t = 0;
    function animate() {
      t += 0.016;
      const p = progress.current;

      // Wider holds + wider transitions → slower, smoother, easier to read.
      let gx: number, scatter: number, A: THREE.Vector3[], B: THREE.Vector3[], mix: number;
      if (p < 0.26) { gx = SIDE; scatter = 0; A = s0; B = s0; mix = 0; }
      else if (p < 0.44) { const l = (p - 0.26) / 0.18; gx = lerp(SIDE, -SIDE, smooth(l)); scatter = SCATTER * Math.sin(Math.PI * l); A = s0; B = s1; mix = smooth(l); }
      else if (p < 0.60) { gx = -SIDE; scatter = 0; A = s1; B = s1; mix = 1; }
      else if (p < 0.78) { const l = (p - 0.60) / 0.18; gx = lerp(-SIDE, SIDE, smooth(l)); scatter = SCATTER * Math.sin(Math.PI * l); A = s1; B = s2; mix = smooth(l); }
      else { gx = SIDE; scatter = 0; A = s2; B = s2; mix = 1; }

      for (let i = 0; i < COUNT; i++) {
        tmp.copy(A[i]).lerp(B[i], mix);
        if (scatter > 0.0001) tmp.addScaledVector(scatterDir[i], scatter);
        tmp.x += Math.sin(t * 0.6 + floatPhase[i]) * 0.010;
        tmp.y += Math.cos(t * 0.5 + floatPhase[i]) * 0.010;
        current[i].lerp(tmp, 0.075);           // slower, smoother settle
        dummy.position.copy(current[i]);
        dummy.rotation.set(floatPhase[i] + t * 0.15, floatPhase[i], 0);
        dummy.scale.setScalar(scaleArr[i]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      groupX += (gx - groupX) * 0.09;           // eased horizontal move
      group.position.x = groupX;
      // Minimal sway so flat logos stay legible facing the camera.
      group.rotation.y = Math.sin(t * 0.16) * 0.09;
      group.rotation.x = Math.sin(t * 0.2) * 0.04;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0 }} />;
}
