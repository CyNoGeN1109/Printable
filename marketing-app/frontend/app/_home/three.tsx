"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════════════
   Shared helpers & materials
   ═══════════════════════════════════════════════════════════════════════════ */

const GREEN = "#0c831f";
const GREEN_BRIGHT = "#2fdb6e";
const CASE_DARK = "#20262a";
const BEZEL = "#171c19";
const PLASTIC_LIGHT = "#eceeea";
const PLASTIC_MID = "#d8ddd6";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

type RefLike = { current: number };

/* Render only while the canvas is near the viewport — keeps the main thread
   free for scrolling and saves battery on long pages. */
function useInViewFrameloop<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting),
      { rootMargin: "160px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, active] as const;
}

/* One media-query read per mount; camera shake/parallax honor this. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function useSRGB(path: string) {
  const tex = useTexture(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* procedural wood-grain texture — no external asset needed */
function useWoodTexture(base = "#e3cba6", grain = "rgba(120, 84, 50,") {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const x = c.getContext("2d")!;
    x.fillStyle = base;
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * 512;
      x.strokeStyle = `${grain}${0.03 + Math.random() * 0.09})`;
      x.lineWidth = 0.8 + Math.random() * 2.6;
      x.beginPath();
      x.moveTo(0, y);
      for (let px = 0; px <= 512; px += 24) {
        x.lineTo(px, y + Math.sin(px * 0.02 + i * 1.7) * 3.2 + (Math.random() - 0.5) * 2);
      }
      x.stroke();
    }
    // a few knots
    for (let i = 0; i < 4; i++) {
      const kx = Math.random() * 512, ky = Math.random() * 512;
      x.strokeStyle = `${grain}0.12)`;
      for (let r = 2; r < 12; r += 3) {
        x.beginPath();
        x.ellipse(kx, ky, r * 1.8, r, 0.3, 0, Math.PI * 2);
        x.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [base, grain]);
}

/* shop signboard texture with real text */
function useSignTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const x = c.getContext("2d")!;
    x.fillStyle = "#0b2413";
    x.fillRect(0, 0, 1024, 256);
    x.strokeStyle = "#2fdb6e";
    x.lineWidth = 10;
    x.strokeRect(16, 16, 992, 224);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#f2f7f1";
    x.font = "900 96px Inter, Arial, sans-serif";
    x.fillText("PRINTABLE", 512, 92);
    x.fillStyle = "#2fdb6e";
    x.font = "800 58px Inter, Arial, sans-serif";
    x.fillText("POWERED SHOP", 512, 188);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
}

/* the real 5★ wrapper photo, front and back of the bar */
function FiveStarLabel() {
  const tex = useSRGB("/five-star.png");
  return (
    <>
      <mesh position={[0, 0, 0.014]}>
        <planeGeometry args={[0.36, 0.11]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.014]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.36, 0.11]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </>
  );
}

/* Emissive screen showing a real product screenshot (unlit = looks lit) */
function Screen({ src, width, height, ...props }: { src: string; width: number; height: number } & ThreeElements["mesh"]) {
  const tex = useSRGB(src);
  return (
    <mesh {...props}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/* diagonal gloss streak that makes glass panels read as glass */
function GlossStreak({ w, h, ...props }: { w: number; h: number } & ThreeElements["mesh"]) {
  return (
    <mesh {...props} rotation-z={-0.5}>
      <planeGeometry args={[w * 0.18, h * 1.4]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.06} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Monitor — 16:9 panel matching the real 1600×900 dashboard screenshots
   ═══════════════════════════════════════════════════════════════════════════ */

function Monitor({ src, w = 2.1, h = 1.18, ...props }: { src: string; w?: number; h?: number } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.02, 0.1]}>
        <cylinderGeometry args={[0.28, 0.34, 0.045, 32]} />
        <meshPhysicalMaterial color={BEZEL} roughness={0.35} metalness={0.6} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.35, 0.06]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.09, 0.7, 0.05]} />
        <meshPhysicalMaterial color={BEZEL} roughness={0.35} metalness={0.6} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>
      <RoundedBox castShadow args={[w + 0.07, h + 0.07, 0.06]} radius={0.02} position={[0, 0.72 + h / 2, 0]}>
        <meshPhysicalMaterial color={BEZEL} roughness={0.3} metalness={0.55} clearcoat={0.8} clearcoatRoughness={0.2} />
      </RoundedBox>
      <Screen src={src} width={w} height={h} position={[0, 0.72 + h / 2, 0.033]} />
      <GlossStreak w={w} h={h} position={[-w * 0.28, 0.72 + h / 2, 0.036]} />
      <mesh position={[0, 0.705, 0.034]}>
        <boxGeometry args={[0.05, 0.01, 0.01]} />
        <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PC tower — glass side panel, visible fans + GPU + PSU shroud inside
   ═══════════════════════════════════════════════════════════════════════════ */

function Fan({ speed = 2.2, ...props }: { speed?: number } & ThreeElements["group"]) {
  const blades = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }, dt) => {
    if (blades.current) blades.current.rotation.z -= dt * speed;
    if (ring.current) {
      const glow = 0.75 + 0.25 * Math.sin(clock.elapsedTime * 2 + speed);
      ring.current.color.setRGB(0.18 * glow, 0.86 * glow, 0.43 * glow);
    }
  });
  return (
    <group {...props}>
      <mesh>
        <torusGeometry args={[0.13, 0.016, 10, 36]} />
        <meshBasicMaterial ref={ring} color={GREEN_BRIGHT} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[0.3, 0.3, 0.025]} />
        <meshStandardMaterial color="#14181b" roughness={0.6} />
      </mesh>
      <group ref={blades}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 7]} position={[0, 0.055, 0.005]}>
            <boxGeometry args={[0.045, 0.1, 0.008]} />
            <meshStandardMaterial color="#3a4147" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.008]}>
          <cylinderGeometry args={[0.04, 0.04, 0.025, 16]} rotation-x={Math.PI / 2} />
          <meshStandardMaterial color="#0d1113" />
        </mesh>
      </group>
    </group>
  );
}

function Tower(props: ThreeElements["group"]) {
  const W = 0.56, H = 1.18, D = 1.06;
  return (
    <group {...props}>
      {[[-0.2, -0.42], [0.2, -0.42], [-0.2, 0.42], [0.2, 0.42]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]}>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color="#0d1113" />
        </mesh>
      ))}
      <group position={[0, 0.04 + H / 2, 0]}>
        <mesh castShadow position={[W / 2 - 0.01, 0, 0]}>
          <boxGeometry args={[0.02, H, D]} />
          <meshPhysicalMaterial color={CASE_DARK} roughness={0.35} metalness={0.7} clearcoat={0.4} />
        </mesh>
        <mesh castShadow position={[0, H / 2 - 0.015, 0]}>
          <boxGeometry args={[W, 0.03, D]} />
          <meshPhysicalMaterial color={CASE_DARK} roughness={0.35} metalness={0.7} clearcoat={0.4} />
        </mesh>
        {[-0.28, -0.14, 0, 0.14, 0.28].map((z, i) => (
          <mesh key={i} position={[0, H / 2 + 0.002, z]}>
            <boxGeometry args={[W - 0.14, 0.008, 0.05]} />
            <meshStandardMaterial color="#14181b" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, -H / 2 + 0.015, 0]}>
          <boxGeometry args={[W, 0.03, D]} />
          <meshPhysicalMaterial color={CASE_DARK} roughness={0.35} metalness={0.7} clearcoat={0.4} />
        </mesh>
        <mesh castShadow position={[0, 0, -D / 2 + 0.01]}>
          <boxGeometry args={[W, H, 0.02]} />
          <meshPhysicalMaterial color={CASE_DARK} roughness={0.35} metalness={0.7} clearcoat={0.4} />
        </mesh>
        <mesh castShadow position={[0, 0, D / 2 - 0.015]}>
          <boxGeometry args={[W, H, 0.03]} />
          <meshPhysicalMaterial color="#191e22" roughness={0.3} metalness={0.7} clearcoat={0.5} />
        </mesh>
        <mesh position={[-W / 2 + 0.045, 0, D / 2 + 0.001]}>
          <planeGeometry args={[0.03, H - 0.12]} />
          <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0.16, H / 2 - 0.1, D / 2 + 0.002]}>
          <circleGeometry args={[0.022, 20]} />
          <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} />
        </mesh>
        {/* interior */}
        <mesh position={[W / 2 - 0.06, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[D - 0.06, H - 0.06]} />
          <meshStandardMaterial color="#0c0f11" roughness={0.8} />
        </mesh>
        <Fan position={[0.02, 0.33, 0.36]} rotation={[0, -Math.PI / 2, 0]} speed={2.6} />
        <Fan position={[0.02, 0.0, 0.36]} rotation={[0, -Math.PI / 2, 0]} speed={2.1} />
        <Fan position={[0.02, -0.33, 0.36]} rotation={[0, -Math.PI / 2, 0]} speed={2.9} />
        <group position={[0.05, 0.02, -0.12]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.06, 0.56]} />
            <meshPhysicalMaterial color="#14181b" roughness={0.3} metalness={0.7} clearcoat={0.5} />
          </mesh>
          <mesh position={[-0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <planeGeometry args={[0.05, 0.54]} rotation-z={Math.PI / 2} />
            <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <mesh castShadow position={[0.03, -H / 2 + 0.13, 0]}>
          <boxGeometry args={[W - 0.12, 0.2, D - 0.1]} />
          <meshStandardMaterial color="#12161a" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* tempered glass */}
        <mesh position={[-W / 2 + 0.005, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[D - 0.02, H - 0.02]} />
          <meshPhysicalMaterial color="#9fb2ac" metalness={0.1} roughness={0.03} transparent opacity={0.16} side={THREE.DoubleSide} />
        </mesh>
        <GlossStreak w={D} h={H} position={[-W / 2 + 0.002, 0.1, 0.1]} rotation={[0, -Math.PI / 2, -0.5]} />
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Keyboard / mouse / speaker
   ═══════════════════════════════════════════════════════════════════════════ */

function Keyboard(props: ThreeElements["group"]) {
  const inst = useRef<THREE.InstancedMesh>(null);
  const COLS = 14;
  const ROWS = 5;
  useLayoutEffect(() => {
    if (!inst.current) return;
    const m = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        m.setPosition(-0.585 + c * 0.09, 0.032, -0.16 + r * 0.08);
        inst.current.setMatrixAt(i++, m);
      }
    }
    inst.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group {...props}>
      <RoundedBox castShadow args={[1.34, 0.05, 0.5]} radius={0.02}>
        <meshPhysicalMaterial color="#2b3236" roughness={0.4} metalness={0.4} clearcoat={0.3} />
      </RoundedBox>
      <instancedMesh ref={inst} args={[undefined, undefined, COLS * ROWS]}>
        <boxGeometry args={[0.075, 0.025, 0.065]} />
        <meshStandardMaterial color="#40484d" roughness={0.55} />
      </instancedMesh>
    </group>
  );
}

function Mouse(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 0.45]} />
        <meshStandardMaterial color="#232a2e" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.045, 0]} scale={[1, 0.55, 1.4]}>
        <sphereGeometry args={[0.085, 20, 16]} />
        <meshPhysicalMaterial color="#333b40" roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.2} />
      </mesh>
    </group>
  );
}

function Speaker(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <RoundedBox castShadow args={[0.22, 0.4, 0.2]} radius={0.03} position={[0, 0.2, 0]}>
        <meshStandardMaterial color={CASE_DARK} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.26, 0.101]}>
        <circleGeometry args={[0.07, 24]} />
        <meshStandardMaterial color="#0d1113" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.11, 0.101]}>
        <circleGeometry args={[0.024, 20]} />
        <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Printer — realistic front-eject MFP
   ═══════════════════════════════════════════════════════════════════════════ */

function Printer({ sheetRef, loop = false, ...props }: { sheetRef?: RefLike; loop?: boolean } & ThreeElements["group"]) {
  const sheet = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const k = loop ? smooth(clamp01(((t % 4) - 0.8) / 1.8)) : sheetRef ? sheetRef.current : 1;
    if (sheet.current) {
      sheet.current.position.z = 0.2 + k * 0.42;
      sheet.current.position.y = 0.33 - k * 0.045;
      sheet.current.visible = k > 0.02;
      // paper flutter as it ejects
      sheet.current.rotation.z = Math.sin(t * 9) * 0.015 * (k > 0.05 && k < 0.95 ? 1 : 0);
    }
    if (led.current) led.current.opacity = 0.55 + 0.45 * Math.sin(t * 4);
  });
  return (
    <group {...props}>
      <RoundedBox castShadow args={[1.0, 0.34, 0.74]} radius={0.05} position={[0, 0.17, 0]}>
        <meshPhysicalMaterial color={PLASTIC_LIGHT} roughness={0.4} clearcoat={0.35} clearcoatRoughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.055, 0.372]}>
        <boxGeometry args={[0.96, 0.018, 0.005]} />
        <meshBasicMaterial color={GREEN} toneMapped={false} />
      </mesh>
      <RoundedBox castShadow args={[1.0, 0.12, 0.74]} radius={0.04} position={[0, 0.4, 0]}>
        <meshPhysicalMaterial color={PLASTIC_MID} roughness={0.45} clearcoat={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.462, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.94, 0.66]} />
        <meshStandardMaterial color={PLASTIC_LIGHT} roughness={0.35} />
      </mesh>
      <group position={[0.3, 0.475, 0.28]} rotation={[-0.55, 0, 0]}>
        <RoundedBox args={[0.34, 0.02, 0.2]} radius={0.008}>
          <meshStandardMaterial color="#22282c" roughness={0.4} />
        </RoundedBox>
        <mesh position={[-0.05, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 0.11]} />
          <meshBasicMaterial color="#123c1d" toneMapped={false} />
        </mesh>
        <mesh position={[-0.05, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 0.02]} />
          <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} />
        </mesh>
        {[0.08, 0.13].map((x, i) => (
          <mesh key={i} position={[x, 0.011, 0.02]}>
            <cylinderGeometry args={[0.016, 0.016, 0.012, 14]} />
            <meshStandardMaterial color={i ? "#3a4147" : GREEN} roughness={0.5} />
          </mesh>
        ))}
      </group>
      <mesh position={[-0.38, 0.3, 0.373]}>
        <circleGeometry args={[0.02, 16]} />
        <meshBasicMaterial ref={led} color={GREEN_BRIGHT} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.28, 0.372]}>
        <planeGeometry args={[0.58, 0.06]} />
        <meshStandardMaterial color="#101413" />
      </mesh>
      <mesh receiveShadow position={[0, 0.235, 0.52]} rotation={[-Math.PI / 2 + 0.12, 0, 0]}>
        <planeGeometry args={[0.56, 0.36]} />
        <meshStandardMaterial color={PLASTIC_MID} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      <group ref={sheet} position={[0, 0.33, 0.2]} rotation={[-Math.PI / 2 + 0.1, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.5, 0.62]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {[0.22, 0.13, 0.05, -0.03, -0.11, -0.19].map((y, i) => (
          <mesh key={i} position={[i === 0 ? -0.07 : 0, y, 0.003]}>
            <planeGeometry args={[i === 0 ? 0.26 : 0.38, i === 0 ? 0.035 : 0.018]} />
            <meshBasicMaterial color={i === 0 ? GREEN : "#b8c2ba"} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      <group position={[0, 0.5, -0.28]} rotation={[0.28, 0, 0]}>
        <RoundedBox castShadow args={[0.62, 0.3, 0.03]} radius={0.01}>
          <meshStandardMaterial color={PLASTIC_MID} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.06, 0.02]}>
          <planeGeometry args={[0.5, 0.3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {[[-0.42, 0.3], [0.42, 0.3], [-0.42, -0.3], [0.42, -0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.008, z]}>
          <boxGeometry args={[0.08, 0.016, 0.08]} />
          <meshStandardMaterial color="#22282c" />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Phone
   ═══════════════════════════════════════════════════════════════════════════ */

function Phone({ src, lying = false, ...props }: { src: string; lying?: boolean } & ThreeElements["group"]) {
  return (
    <group {...props} rotation={lying ? [-Math.PI / 2, 0, 0.5] : props.rotation}>
      <RoundedBox castShadow args={[0.62, 1.28, 0.05]} radius={0.06}>
        <meshPhysicalMaterial color={BEZEL} roughness={0.25} metalness={0.7} clearcoat={1} clearcoatRoughness={0.12} />
      </RoundedBox>
      <Screen src={src} width={0.56} height={1.2} position={[0, 0, 0.028]} />
      <GlossStreak w={0.56} h={1.2} position={[-0.14, 0.1, 0.03]} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   QR standee (real scannable QR texture)
   ═══════════════════════════════════════════════════════════════════════════ */

function QRStandee(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <RoundedBox castShadow args={[0.3, 0.03, 0.18]} radius={0.01} position={[0, 0.015, 0]}>
        <meshPhysicalMaterial color="#22282c" roughness={0.3} metalness={0.6} clearcoat={0.5} />
      </RoundedBox>
      <mesh castShadow position={[0, 0.24, -0.045]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[0.05, 0.42, 0.02]} />
        <meshStandardMaterial color="#22282c" roughness={0.4} />
      </mesh>
      <group position={[0, 0.3, -0.02]} rotation={[0.18, 0, 0]}>
        <RoundedBox castShadow args={[0.42, 0.5, 0.02]} radius={0.02}>
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </RoundedBox>
        <Screen src="/qr-dummy.png" width={0.34} height={0.34} position={[0, -0.05, 0.011]} />
        <mesh position={[0, 0.215, 0.011]}>
          <planeGeometry args={[0.42, 0.07]} />
          <meshBasicMaterial color={GREEN} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.225, 0.011]}>
          <planeGeometry args={[0.26, 0.022]} />
          <meshBasicMaterial color="#c8d2c9" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* expanding pulse ring on the standee while the kid scans (stage 0) */
function ScanPulse({ progressRef }: { progressRef: RefLike }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!ref.current || !mat.current) return;
    const t = progressRef.current * 5;
    const active = 1 - smooth(clamp01((t - 0.55) / 0.35));
    const cycle = (clock.elapsedTime % 1.6) / 1.6;
    ref.current.scale.setScalar(0.25 + cycle * 1.1);
    mat.current.opacity = active * (1 - cycle) * 0.5;
    ref.current.visible = active > 0.01;
  });
  return (
    <mesh ref={ref} position={[-2.68, 1.2, 0.1]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.22, 0.012, 8, 40]} />
      <meshBasicMaterial ref={mat} color={GREEN_BRIGHT} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Kid v2 — capsule anatomy, ears/nose/smile, breathing idle
   ═══════════════════════════════════════════════════════════════════════════ */

function Kid({ src, ...props }: { src: string } & ThreeElements["group"]) {
  const SKIN = "#f0c49b";
  const TEE = "#16a34a";
  const JEANS = "#2e3d55";
  const HAIR = "#2b2320";
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 2.1) * 0.014;
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 1.6) * 0.03 - 0.04;
      head.current.rotation.y = Math.sin(t * 0.9) * 0.04;
    }
    if (arm.current) arm.current.position.y = Math.sin(t * 2.1) * 0.006;
  });

  return (
    <group {...props}>
      {/* legs */}
      {[-0.09, 0.09].map((z, i) => (
        <mesh castShadow key={i} position={[0, 0.31, z]}>
          <capsuleGeometry args={[0.065, 0.42, 6, 14]} />
          <meshStandardMaterial color={JEANS} roughness={0.85} />
        </mesh>
      ))}
      {/* shoes */}
      {[-0.09, 0.09].map((z, i) => (
        <mesh castShadow key={i} position={[0.05, 0.045, z]}>
          <capsuleGeometry args={[0.055, 0.1, 6, 12]} rotation-z={Math.PI / 2} />
          <meshStandardMaterial color="#f4f6f2" roughness={0.5} />
        </mesh>
      ))}
      {/* torso (breathing) */}
      <group ref={torso} position={[0, 0.84, 0]}>
        <mesh castShadow scale={[1, 1, 1.2]}>
          <capsuleGeometry args={[0.165, 0.3, 8, 18]} />
          <meshStandardMaterial color={TEE} roughness={0.8} />
        </mesh>
        {/* collar */}
        <mesh position={[0.02, 0.24, 0]}>
          <torusGeometry args={[0.075, 0.018, 8, 20]} rotation-x={Math.PI / 2} />
          <meshStandardMaterial color="#128a3e" roughness={0.8} />
        </mesh>
      </group>
      {/* left arm hanging */}
      <mesh castShadow position={[0, 0.82, -0.25]} rotation={[0.12, 0, 0]}>
        <capsuleGeometry args={[0.048, 0.32, 6, 12]} />
        <meshStandardMaterial color={TEE} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.02, 0.6, -0.27]}>
        <sphereGeometry args={[0.05, 14, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      {/* right arm — raised, holding the phone (micro bob) */}
      <group ref={arm}>
        <mesh castShadow position={[0.1, 0.94, 0.24]} rotation={[0, 0, -0.9]}>
          <capsuleGeometry args={[0.048, 0.18, 6, 12]} />
          <meshStandardMaterial color={TEE} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.26, 1.02, 0.2]} rotation={[0, 0, -0.5]}>
          <capsuleGeometry args={[0.042, 0.18, 6, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        <mesh castShadow position={[0.33, 1.13, 0.17]}>
          <sphereGeometry args={[0.052, 14, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        {/* the phone in hand */}
        <group position={[0.37, 1.16, 0.15]} rotation={[0, -Math.PI / 2 + 0.12, -0.08]}>
          <Phone src={src} scale={0.24} />
        </group>
      </group>
      {/* neck + head (idle nod) */}
      <mesh position={[0, 1.14, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.09, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      <group ref={head} position={[0, 1.31, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.155, 26, 22]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
        {/* hair */}
        <mesh position={[-0.03, 0.06, 0]} scale={[1, 0.78, 1.02]}>
          <sphereGeometry args={[0.158, 26, 22]} />
          <meshStandardMaterial color={HAIR} roughness={0.9} />
        </mesh>
        {/* ears */}
        {[-0.15, 0.15].map((z, i) => (
          <mesh key={i} position={[0, -0.01, z]} scale={[0.6, 1, 0.5]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
        ))}
        {/* nose */}
        <mesh position={[0.15, -0.02, 0]} scale={[0.8, 1, 0.8]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshStandardMaterial color="#e9b587" roughness={0.65} />
        </mesh>
        {/* eyes */}
        {[-0.055, 0.055].map((z, i) => (
          <mesh key={i} position={[0.14, 0.015, z]}>
            <sphereGeometry args={[0.016, 10, 10]} />
            <meshStandardMaterial color="#1b1b1b" roughness={0.3} />
          </mesh>
        ))}
        {/* smile */}
        <mesh position={[0.14, -0.055, 0]} rotation={[0, Math.PI / 2, Math.PI + 0.35]}>
          <torusGeometry args={[0.035, 0.006, 6, 14, Math.PI * 0.7]} />
          <meshStandardMaterial color="#a8663c" roughness={0.6} />
        </mesh>
      </group>
      {/* backpack */}
      <RoundedBox castShadow args={[0.14, 0.36, 0.3]} radius={0.05} position={[-0.2, 0.86, 0]}>
        <meshStandardMaterial color="#e8862c" roughness={0.7} />
      </RoundedBox>
      {[-0.1, 0.1].map((z, i) => (
        <mesh key={i} position={[-0.11, 0.95, z]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.03, 0.3, 0.05]} />
          <meshStandardMaterial color="#c96f1d" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Vendor — reclined on an office chair, feet up on vibes, munching a 5-Star.
   Faces +z. The whole point: he does absolutely nothing.
   ═══════════════════════════════════════════════════════════════════════════ */

function Vendor(props: ThreeElements["group"]) {
  const SKIN = "#e8b48c";
  const SHIRT = "#4053b8";
  const PANTS = "#39424a";
  const HAIR = "#211a16";
  const arm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const munch = (Math.sin(t * 1.4) + 1) / 2; // slow raise-lower of the chocolate
    if (arm.current) arm.current.rotation.x = -0.25 - munch * 0.4;
    if (head.current) {
      head.current.rotation.x = -0.06 - munch * 0.08;
      head.current.scale.y = 1 + (munch > 0.75 ? Math.sin(t * 9) * 0.015 : 0); // chewing
    }
    if (body.current) body.current.rotation.x = -0.1 + Math.sin(t * 0.7) * 0.02; // lazy recline sway
  });

  return (
    <group {...props}>
      {/* office chair */}
      <group>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[Math.cos((i / 5) * Math.PI * 2) * 0.22, 0.03, Math.sin((i / 5) * Math.PI * 2) * 0.22]}
            rotation={[0, -(i / 5) * Math.PI * 2, 0]}
          >
            <boxGeometry args={[0.2, 0.03, 0.06]} />
            <meshPhysicalMaterial color="#191e22" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 12]} />
          <meshPhysicalMaterial color="#2a3138" metalness={0.8} roughness={0.25} />
        </mesh>
        <RoundedBox castShadow args={[0.52, 0.07, 0.5]} radius={0.03} position={[0, 0.47, 0]}>
          <meshStandardMaterial color="#23282e" roughness={0.7} />
        </RoundedBox>
        <RoundedBox castShadow args={[0.5, 0.56, 0.07]} radius={0.03} position={[0, 0.82, -0.26]} rotation={[-0.16, 0, 0]}>
          <meshStandardMaterial color="#23282e" roughness={0.7} />
        </RoundedBox>
      </group>
      {/* thighs + shins + shoes */}
      {[-0.09, 0.09].map((x, i) => (
        <group key={i}>
          <mesh castShadow position={[x, 0.55, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.066, 0.26, 6, 12]} />
            <meshStandardMaterial color={PANTS} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[x, 0.33, 0.31]}>
            <capsuleGeometry args={[0.055, 0.3, 6, 12]} />
            <meshStandardMaterial color={PANTS} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[x, 0.06, 0.37]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.05, 0.1, 6, 12]} />
            <meshStandardMaterial color="#20262a" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* reclining upper body */}
      <group ref={body} position={[0, 0.62, -0.05]}>
        <mesh castShadow position={[0, 0.35, 0]} scale={[1.1, 1, 1]}>
          <capsuleGeometry args={[0.175, 0.32, 8, 18]} />
          <meshStandardMaterial color={SHIRT} roughness={0.8} />
        </mesh>
        {/* left arm — one connected chain hanging onto the lap */}
        <group position={[-0.24, 0.5, 0.04]} rotation={[0.45, 0, 0.18]}>
          <mesh castShadow>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color={SHIRT} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.13, 0]}>
            <capsuleGeometry args={[0.047, 0.17, 6, 12]} />
            <meshStandardMaterial color={SHIRT} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.24, 0]}>
            <capsuleGeometry args={[0.04, 0.1, 6, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          <mesh castShadow position={[0, -0.32, 0]}>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
        </group>
        {/* right arm — shoulder → elbow → hand chain, brings the 5★ up for a bite */}
        <group ref={arm} position={[0.24, 0.5, 0.04]}>
          {/* shoulder joint */}
          <mesh castShadow>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color={SHIRT} roughness={0.8} />
          </mesh>
          {/* upper arm: down-forward to the elbow */}
          <mesh castShadow position={[0.02, -0.1, 0.07]} rotation={[0.6, 0, -0.12]}>
            <capsuleGeometry args={[0.047, 0.15, 6, 12]} />
            <meshStandardMaterial color={SHIRT} roughness={0.8} />
          </mesh>
          {/* elbow joint */}
          <mesh castShadow position={[0.04, -0.19, 0.15]}>
            <sphereGeometry args={[0.048, 12, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* forearm: up-forward from the elbow to the hand */}
          <mesh castShadow position={[0.02, -0.08, 0.22]} rotation={[0.55, 0, 0.1]}>
            <capsuleGeometry args={[0.04, 0.17, 6, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* hand */}
          <mesh castShadow position={[0, 0.03, 0.29]}>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* the real 5★ bar, held up mid-bite */}
          <group position={[0, 0.1, 0.33]} rotation={[0.2, -0.55, 0.25]}>
            <mesh castShadow>
              <boxGeometry args={[0.34, 0.1, 0.025]} />
              <meshStandardMaterial color="#d9a30f" roughness={0.4} metalness={0.3} />
            </mesh>
            <FiveStarLabel />
          </group>
        </group>
        {/* neck + head */}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.05, 0.062, 0.09, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        <group ref={head} position={[0, 0.8, 0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.16, 26, 22]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.06, -0.03]} scale={[1.02, 0.75, 1]}>
            <sphereGeometry args={[0.163, 26, 22]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} />
          </mesh>
          {/* face toward +z */}
          {[-0.055, 0.055].map((x, i) => (
            <mesh key={i} position={[x, 0.02, 0.148]}>
              <sphereGeometry args={[0.015, 10, 10]} />
              <meshStandardMaterial color="#1b1b1b" roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, -0.02, 0.155]} scale={[0.8, 1, 0.8]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshStandardMaterial color="#dba06f" roughness={0.65} />
          </mesh>
          {/* moustache */}
          <mesh position={[0, -0.055, 0.148]}>
            <boxGeometry args={[0.09, 0.02, 0.02]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* shop counter with a real signboard */
function Counter(props: ThreeElements["group"]) {
  const wood = useWoodTexture();
  const sign = useSignTexture();
  return (
    <group {...props}>
      <RoundedBox castShadow receiveShadow args={[0.95, 0.07, 0.7]} radius={0.02} position={[0, 0.95, 0]}>
        <meshStandardMaterial map={wood} roughness={0.65} />
      </RoundedBox>
      <mesh castShadow position={[0, 0.47, 0]}>
        <boxGeometry args={[0.8, 0.9, 0.56]} />
        <meshStandardMaterial color="#3c433d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0.283]}>
        <planeGeometry args={[0.7, 0.08]} />
        <meshBasicMaterial color={GREEN} toneMapped={false} />
      </mesh>
      {/* signboard on two rear posts — clear of the QR standee in front */}
      {[-0.42, 0.42].map((x, i) => (
        <mesh castShadow key={i} position={[x, 1.32, -0.3]}>
          <cylinderGeometry args={[0.018, 0.018, 0.68, 10]} />
          <meshStandardMaterial color="#22282c" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 1.68, -0.3]}>
        <boxGeometry args={[1.15, 0.3, 0.04]} />
        <meshStandardMaterial map={sign} roughness={0.55} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Draggable + cables (unchanged behaviour)
   ═══════════════════════════════════════════════════════════════════════════ */

const dragState = { active: false };

function Draggable({
  children,
  bounds,
  forwardRef,
  ...groupProps
}: {
  children: React.ReactNode;
  bounds: [number, number, number, number];
  forwardRef?: React.RefObject<THREE.Group | null>;
} & ThreeElements["group"]) {
  const inner = useRef<THREE.Group>(null);
  const ref = forwardRef ?? inner;
  const dragging = useRef(false);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const wp = useMemo(() => new THREE.Vector3(), []);

  return (
    <group
      ref={ref}
      {...groupProps}
      onPointerOver={() => {
        if (!dragState.active) document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        if (!dragging.current) document.body.style.cursor = "auto";
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        dragging.current = true;
        dragState.active = true;
        ref.current?.getWorldPosition(wp);
        plane.constant = -wp.y;
        (e.target as Element & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(e.pointerId);
        document.body.style.cursor = "grabbing";
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !ref.current?.parent) return;
        e.stopPropagation();
        if (e.ray.intersectPlane(plane, hit)) {
          const local = ref.current.parent.worldToLocal(hit.clone());
          ref.current.position.x = THREE.MathUtils.clamp(local.x, bounds[0], bounds[1]);
          ref.current.position.z = THREE.MathUtils.clamp(local.z, bounds[2], bounds[3]);
        }
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        dragState.active = false;
        (e.target as Element & { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(e.pointerId);
        document.body.style.cursor = "grab";
      }}
    >
      {children}
    </group>
  );
}

function makeCableCurve(a: THREE.Vector3, b: THREE.Vector3, lift: number) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y = Math.min(a.y, b.y) - lift;
  return new THREE.CatmullRomCurve3([a, mid, b]);
}

function Cable({ from, to, lift = 0.35 }: {
  from: [number, number, number]; to: [number, number, number]; lift?: number;
}) {
  const curve = useMemo(
    () => makeCableCurve(new THREE.Vector3(...from), new THREE.Vector3(...to), lift),
    [from, to, lift]
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 32, 0.014, 8]} />
      <meshStandardMaterial color="#2c3336" roughness={0.6} />
    </mesh>
  );
}

function DynamicCable({ from, targetRef, offset = [0, 0, 0], lift = 0.35 }: {
  from: [number, number, number];
  targetRef: React.RefObject<THREE.Group | null>;
  offset?: [number, number, number];
  lift?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const a = useMemo(() => new THREE.Vector3(...from), [from]);
  const last = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const target = targetRef.current;
    const m = mesh.current;
    if (!target || !m || !m.parent) return;
    target.getWorldPosition(tmp);
    m.parent.worldToLocal(tmp);
    tmp.x += offset[0];
    tmp.y += offset[1];
    tmp.z += offset[2];
    if (tmp.distanceTo(last.current) < 0.015) return;
    last.current.copy(tmp);
    const g = new THREE.TubeGeometry(makeCableCurve(a, tmp.clone(), lift), 32, 0.014, 8);
    m.geometry.dispose();
    m.geometry = g;
  });

  return (
    <mesh ref={mesh}>
      <tubeGeometry args={[makeCableCurve(a, a.clone(), lift), 4, 0.014, 8]} />
      <meshStandardMaterial color="#2c3336" roughness={0.6} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Desk / floor / lights
   ═══════════════════════════════════════════════════════════════════════════ */

function Desk({ w = 5.4, d = 2.2, ...props }: { w?: number; d?: number } & ThreeElements["group"]) {
  const wood = useWoodTexture();
  const legX = w / 2 - 0.22;
  const legZ = d / 2 - 0.18;
  return (
    <group {...props}>
      <RoundedBox castShadow receiveShadow args={[w, 0.12, d]} radius={0.04} position={[0, 0.7, 0]}>
        <meshStandardMaterial map={wood} roughness={0.6} />
      </RoundedBox>
      {[[-legX, -legZ], [legX, -legZ], [-legX, legZ], [legX, legZ]].map(([x, z], i) => (
        <mesh castShadow key={i} position={[x, 0.32, z]}>
          <boxGeometry args={[0.09, 0.64, 0.09]} />
          <meshPhysicalMaterial color="#3c433d" roughness={0.35} metalness={0.7} clearcoat={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* invisible floor that only shows received shadows — keeps the page bg visible */
function ShadowFloor({ radius = 8, x = 0 }: { radius?: number; x?: number }) {
  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[x, 0.001, 0]}>
      <circleGeometry args={[radius, 48]} />
      <shadowMaterial transparent opacity={0.3} color="#12301c" />
    </mesh>
  );
}

function Lights({ size = 8 }: { size?: number }) {
  return (
    <>
      <hemisphereLight args={["#ffffff", "#cfe0d0", 1.15]} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-5, 4, 2]} intensity={0.6} color="#eafff0" />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO — interactive vendor workstation
   ═══════════════════════════════════════════════════════════════════════════ */

const DESK_BOUNDS: [number, number, number, number] = [-2.3, 2.3, -0.5, 0.72];

function HeroDeskScene({ shift = 0, still = false }: { shift?: number; still?: boolean }) {
  const look = useMemo(() => new THREE.Vector3(shift, 1.05, 0), [shift]);
  const printerRef = useRef<THREE.Group>(null);
  useFrame(({ camera, pointer }, dt) => {
    if (dragState.active) return;
    // frame-rate-independent damping so the drift feels identical at 30 or 144 fps
    const k = still ? 1 : 1 - Math.exp(-dt * 3.2);
    const tx = still ? shift : shift + pointer.x * 0.4;
    const ty = still ? 2.0 : 2.0 - pointer.y * 0.25;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, tx, k);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, ty, k);
    camera.lookAt(look);
  });

  return (
    <group position={[shift, 0, 0]}>
      <Desk />
      <group position={[0, 0.76, 0]}>
        <Monitor src="/screenshots/screen-11.png" position={[0.1, 0, -0.5]} />
        <Speaker position={[-1.35, 0, -0.58]} rotation={[0, 0.3, 0]} />
        <Speaker position={[1.5, 0, -0.58]} rotation={[0, -0.3, 0]} />
        <Tower position={[2.1, 0, -0.15]} />
        <Draggable bounds={DESK_BOUNDS} position={[0.05, 0.035, 0.42]} rotation={[0, 0.02, 0]}>
          <Keyboard />
        </Draggable>
        <Draggable bounds={DESK_BOUNDS} position={[0.95, 0, 0.48]}>
          <Mouse />
        </Draggable>
        <Draggable bounds={DESK_BOUNDS} position={[-0.85, 0.035, 0.55]}>
          <Phone lying src="/screenshots/screen-01.png" scale={0.5} />
        </Draggable>
        <QRStandee position={[-1.25, 0, 0.45]} rotation={[0, 0.5, 0]} />
        <Draggable bounds={[-2.25, 2.25, -0.45, 0.55]} position={[-1.95, 0, -0.12]} forwardRef={printerRef}>
          <Printer loop />
        </Draggable>
      </group>
      <DynamicCable from={[1.82, 0.95, -0.5]} targetRef={printerRef} offset={[0.15, 0.15, -0.38]} lift={0.45} />
      <ShadowFloor radius={7} x={0} />
    </group>
  );
}

export function Hero3D() {
  const [narrow, setNarrow] = useState(false);
  const [wrapRef, active] = useInViewFrameloop<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 920px)");
    const fn = () => setNarrow(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return (
    <div className="hero-canvas" ref={wrapRef}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "never"}
        camera={{ fov: narrow ? 42 : 33, position: [0, 2.0, narrow ? 7.0 : 5.9] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Lights size={7} />
        <Suspense fallback={null}>
          <HeroDeskScene still={reduced} />
        </Suspense>
      </Canvas>
      <div className="hero-canvas-hint" aria-hidden>
        🖱️ Try it — drag the printer, keyboard or mouse
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL STORY — kid scans → phone → desktop → print, with extra life
   ═══════════════════════════════════════════════════════════════════════════ */

const STORY_STEPS = [
  { icon: "📷", title: "Scan the QR", desc: "A student walks up and points their camera at the shop's counter code. No app, no login." },
  { icon: "📄", title: "Upload & set", desc: "Add your file, pick colour, copies, sides — see the price live." },
  { icon: "💳", title: "Pay online or cash", desc: "UPI, card, wallet or cash at the counter. Transparent pricing, zero haggling." },
  { icon: "🖥️", title: "The dashboard takes over", desc: "The job lands on the partner's dashboard — file queued, settings pre-applied, nothing to download." },
  { icon: "🍫", title: "The vendor? Chilling.", desc: "Fully autonomous — no downloads, no configuration, no clicking print. 90% of his job is gone; he's on a 5-Star break." },
  { icon: "✅", title: "Prints itself. Collect.", desc: "The page ejects on its own — walk in, grab your prints, track status the whole time." },
];

const CAM_KEYS: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [-4.9, 1.7, 3.6], look: [-2.9, 1.1, 0] },
  { pos: [-3.58, 1.28, 0.78], look: [-3.13, 1.16, 0.15] },
  { pos: [-3.42, 1.42, 0.95], look: [-3.12, 1.15, 0.12] },
  { pos: [0.65, 2.1, 3.6], look: [1.15, 1.7, -0.3] },
  { pos: [3.35, 1.55, 2.75], look: [1.72, 1.02, 1.0] },
  { pos: [2.55, 1.75, 2.6], look: [3.2, 0.95, -0.1] },
];

const KID_SCREENS = ["/screenshots/screen-01.png", "/screenshots/screen-05.png", "/screenshots/screen-09.png"];

function StoryKid({ progressRef }: { progressRef: RefLike }) {
  const refs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  useFrame(() => {
    const t = progressRef.current * 5;
    const idx = t < 1 ? 0 : t < 2 ? 1 : 2;
    refs.forEach((r, i) => {
      if (r.current) r.current.visible = i === idx;
    });
  });
  return (
    <>
      {KID_SCREENS.map((src, i) => (
        <group key={src} ref={refs[i]} visible={i === 0}>
          <Kid src={src} position={[-3.5, 0, 0]} />
        </group>
      ))}
    </>
  );
}

function ScanBeam({ progressRef }: { progressRef: RefLike }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    const t = progressRef.current * 5;
    const fade = 1 - smooth(clamp01((t - 0.55) / 0.35));
    mat.current.opacity = fade * (0.16 + 0.05 * Math.sin(clock.elapsedTime * 6));
  });
  return (
    <mesh position={[-2.88, 1.17, 0.12]} rotation={[0, 0, Math.PI / 2]}>
      <coneGeometry args={[0.12, 0.45, 24, 1, true]} />
      <meshBasicMaterial ref={mat} color={GREEN_BRIGHT} transparent opacity={0.18} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/* flying job with a fading dot trail */
function FlyingJob({ progressRef }: { progressRef: RefLike }) {
  const ref = useRef<THREE.Group>(null);
  const trail = useRef<THREE.Mesh[]>([]);
  const history = useMemo(() => Array.from({ length: 7 }, () => new THREE.Vector3()), []);
  const from = useMemo(() => new THREE.Vector3(-3.12, 1.2, 0.2), []);
  const to = useMemo(() => new THREE.Vector3(1.15, 1.5, -0.3), []);

  useFrame(() => {
    const t = progressRef.current * 5;
    const k = clamp01((t - 2.15) / 0.85);
    if (!ref.current) return;
    const active = k > 0.001 && k < 0.999;
    ref.current.visible = active;
    const p = from.clone().lerp(to, smooth(k));
    p.y += Math.sin(k * Math.PI) * 0.75;
    if (active) {
      for (let i = history.length - 1; i > 0; i--) history[i].copy(history[i - 1]);
      history[0].copy(p);
    }
    ref.current.position.copy(p);
    ref.current.rotation.z = -k * 0.5;
    ref.current.rotation.y = k * Math.PI * 0.5;
    trail.current.forEach((m, i) => {
      if (!m) return;
      m.visible = active && history[i].lengthSq() > 0.01;
      m.position.copy(history[i]);
      m.scale.setScalar(1 - i / 8);
    });
  });

  return (
    <>
      <group ref={ref} visible={false}>
        <mesh>
          <planeGeometry args={[0.4, 0.52]} />
          <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
        {[0.15, 0.07, -0.01, -0.09].map((y, i) => (
          <mesh key={i} position={[0, y, 0.002]}>
            <planeGeometry args={[i === 0 ? 0.2 : 0.28, i === 0 ? 0.033 : 0.018]} />
            <meshBasicMaterial color={i === 0 ? GREEN : "#b8c2ba"} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      {history.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) trail.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color={GREEN_BRIGHT} transparent opacity={0.5 - i * 0.06} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* green flash across the dashboard when the job lands */
function ReceiveFlash({ progressRef }: { progressRef: RefLike }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    if (!mat.current) return;
    const t = progressRef.current * 5;
    const k = clamp01((t - 2.95) / 0.4);
    mat.current.opacity = Math.sin(k * Math.PI) * 0.35;
  });
  return (
    <mesh position={[1.15, 2.045, -0.51]}>
      <planeGeometry args={[2.0, 1.125]} />
      <meshBasicMaterial ref={mat} color={GREEN_BRIGHT} transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

/* confetti burst above the printer at the very end */
function Confetti({ progressRef }: { progressRef: RefLike }) {
  const N = 28;
  const inst = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        dir: new THREE.Vector3((Math.random() - 0.5) * 1.7, 0.9 + Math.random() * 1.0, (Math.random() - 0.5) * 1.7),
        speed: 1.3 + Math.random() * 1.4,
        spin: (Math.random() - 0.5) * 12,
        off: Math.random() * Math.PI * 2,
      })),
    []
  );
  const colors = useMemo(() => {
    const cols = ["#2fdb6e", "#f59e0b", "#6366f1", "#ffffff", "#e64980"];
    const arr = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      c.set(cols[i % cols.length]);
      arr.set([c.r, c.g, c.b], i * 3);
    }
    return arr;
  }, []);

  useFrame(() => {
    const m = inst.current;
    if (!m) return;
    const t = progressRef.current * 5;
    const life = clamp01((t - 4.76) / 0.24);
    m.visible = life > 0.001;
    if (!m.visible) return;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      dummy.position.set(
        3.2 + s.dir.x * s.speed * life,
        1.35 + s.dir.y * s.speed * life - 2.4 * life * life,
        -0.1 + s.dir.z * s.speed * life
      );
      dummy.rotation.set(s.spin * life, s.off + s.spin * life * 0.7, s.spin * life * 0.5);
      dummy.scale.setScalar(0.055 * (1 - life * 0.45));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={inst} args={[undefined, undefined, N]} visible={false}>
      <boxGeometry args={[1, 1.6, 0.15]} />
      <meshBasicMaterial toneMapped={false} />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}

function DoneRing({ progressRef }: { progressRef: RefLike }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = progressRef.current * 5;
    const k = smooth(clamp01((t - 4.72) / 0.28));
    if (!ref.current) return;
    ref.current.visible = k > 0.01;
    ref.current.scale.setScalar(k);
    ref.current.position.y = 1.95 + Math.sin(clock.elapsedTime * 2) * 0.04;
  });
  return (
    <group ref={ref} position={[3.2, 1.95, -0.1]} visible={false}>
      <mesh>
        <torusGeometry args={[0.26, 0.032, 12, 40]} />
        <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} />
      </mesh>
      <mesh position={[-0.055, -0.04, 0]} rotation={[0, 0, -0.8]}>
        <boxGeometry args={[0.045, 0.15, 0.02]} />
        <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} />
      </mesh>
      <mesh position={[0.05, -0.005, 0]} rotation={[0, 0, 0.7]}>
        <boxGeometry args={[0.045, 0.24, 0.02]} />
        <meshBasicMaterial color={GREEN_BRIGHT} toneMapped={false} />
      </mesh>
    </group>
  );
}

function StoryScene({ progressRef, still = false }: { progressRef: RefLike; still?: boolean }) {
  const smoothP = useRef(0);
  const sheetK = useRef(0);
  const damped: RefLike = smoothP;

  useFrame(({ camera, clock }, dt) => {
    smoothP.current += (progressRef.current - smoothP.current) * Math.min(1, dt * 7);
    const t = Math.min(smoothP.current * 5, 4.999);
    const i = Math.floor(t);
    const f = smooth(t - i);
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[Math.min(i + 1, 5)];
    camera.position.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], f),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], f),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], f)
    );
    camera.lookAt(
      THREE.MathUtils.lerp(a.look[0], b.look[0], f),
      THREE.MathUtils.lerp(a.look[1], b.look[1], f),
      THREE.MathUtils.lerp(a.look[2], b.look[2], f)
    );
    // handheld micro-motion (applied after aiming so it doesn't re-aim)
    if (!still) {
      const e = clock.elapsedTime;
      camera.position.x += Math.sin(e * 1.1) * 0.01;
      camera.position.y += Math.sin(e * 1.7 + 1) * 0.008;
    }
    sheetK.current = smooth(clamp01((t - 4.3) / 0.55));
  });

  return (
    <group>
      <StoryKid progressRef={damped} />
      <Counter position={[-2.55, 0, 0]} />
      <QRStandee position={[-2.62, 0.985, 0.1]} rotation={[0, -Math.PI / 2, 0]} scale={0.72} />
      <ScanBeam progressRef={damped} />
      <ScanPulse progressRef={damped} />

      <Desk w={4.6} d={1.9} position={[2.15, 0, -0.3]} />
      <group position={[2.15, 0.76, -0.3]}>
        <Monitor src="/screenshots/screen-13.png" w={2.0} h={1.125} position={[-1.0, 0, -0.25]} />
        <Keyboard position={[-1.0, 0.035, 0.42]} scale={0.85} />
        <Printer sheetRef={sheetK} position={[1.05, 0, 0.05]} />
      </group>
      {/* the print partner — at his desk on the working side, chair swivelled
          away from the screen for a chocolate break. Zero work happening. */}
      <Vendor position={[1.75, 0, 1.05]} rotation={[0, 0.7, 0]} />
      <Cable from={[1.35, 1.0, -0.5]} to={[2.85, 0.95, -0.35]} lift={0.3} />

      <FlyingJob progressRef={damped} />
      <ReceiveFlash progressRef={damped} />
      <DoneRing progressRef={damped} />
      <Confetti progressRef={damped} />

      <ShadowFloor radius={9} x={0} />
    </group>
  );
}

export function FlowStory3D() {
  const wrapRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [stage, setStage] = useState(0);
  const [active, setActive] = useState(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const p = clamp01(-r.top / Math.max(total, 1));
        progressRef.current = p;
        const s = Math.min(5, Math.floor(p * 6));
        setStage((prev) => (prev === s ? prev : s));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* only run the render loop while the story section is on screen */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "160px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="flow" className="fs" ref={wrapRef}>
      <div className="fs-sticky">
        <div className="fs-canvas">
          <Canvas
            shadows
            dpr={[1, 1.5]}
            frameloop={active ? "always" : "never"}
            camera={{ fov: 40, position: [-4.9, 1.7, 3.6] }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <Lights size={9} />
            <Suspense fallback={null}>
              <StoryScene progressRef={progressRef} still={reduced} />
            </Suspense>
          </Canvas>
        </div>

        <div className="fs-head">
          <div className="chapter-meta">
            <span className="chapter-no">03</span>
            <span className="chapter-rule" />
            <span className="chapter-kicker">The Flow — in 3D</span>
          </div>
          <h2 className="fs-title">
            Scroll to follow one print job, <em>end to end.</em>
          </h2>
        </div>

        <div className="fs-caption" key={stage}>
          <span className="fs-caption-icon">{STORY_STEPS[stage].icon}</span>
          <div>
            <div className="fs-caption-step">Step {stage + 1} of {STORY_STEPS.length}</div>
            <h3 className="fs-caption-title">{STORY_STEPS[stage].title}</h3>
            <p className="fs-caption-desc">{STORY_STEPS[stage].desc}</p>
          </div>
        </div>

        <div className="fs-dots" aria-hidden>
          {STORY_STEPS.map((s, i) => (
            <span key={s.title} className={`fs-dot ${i <= stage ? "is-on" : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
