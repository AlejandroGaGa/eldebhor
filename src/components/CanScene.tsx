"use client";
/* eslint-disable react-hooks/immutability -- three.js objects are mutated per frame by design (R3F idiom) */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

type Props = {
  color: string;
  colorName: string;
  shake: number;
  spraying: React.RefObject<boolean>;
  active: boolean;
};

export default function CanScene(props: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.2, 6.4], fov: 34 }}
      frameloop={props.active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} />
      <pointLight position={[-3, -1, 3]} color={props.color} intensity={25} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={5} position={[0, 4, -2]} scale={[10, 1.5, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={3} color={props.color} position={[-5, 0, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[3, 6, 1]} />
        <Lightformer form="ring" intensity={4} position={[2, 2, 4]} scale={1.5} />
      </Environment>
      <Rig {...props} />
      <ContactShadows position={[0, -1.85, 0]} opacity={0.55} blur={2.6} scale={7} far={3} />
    </Canvas>
  );
}

function Rig({ color, colorName, shake, spraying }: Props) {
  const group = useRef<THREE.Group>(null);
  const nozzle = useRef<THREE.Object3D>(null);
  const cap = useRef<THREE.Group>(null);
  const spinBoost = useRef(0);

  // shake animation whenever the counter increments
  useEffect(() => {
    if (!shake || !group.current) return;
    const g = group.current;
    gsap.timeline()
      .to(g.rotation, { z: 0.45, duration: 0.07, yoyo: true, repeat: 11, ease: "sine.inOut" })
      .to(g.position, { y: 0.35, duration: 0.07, yoyo: true, repeat: 11, ease: "sine.inOut" }, 0)
      .to(g.rotation, { z: 0, duration: 0.4, ease: "elastic.out(1,0.4)" })
      .to(g.position, { y: 0, duration: 0.4, ease: "elastic.out(1,0.4)" }, "<");
  }, [shake]);

  // color change: a quick flip
  useEffect(() => {
    spinBoost.current = Math.PI * 2;
  }, [color]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const spray = spraying.current;
    if (spray) {
      // turn the nozzle toward the left (toward the copy)
      const target = -Math.PI / 2 + 0.45;
      const cur = g.rotation.y % (Math.PI * 2);
      g.rotation.y = cur + (target - cur) * Math.min(1, dt * 8);
    } else {
      const boost = spinBoost.current * Math.min(1, dt * 4);
      spinBoost.current -= boost;
      g.rotation.y += dt * 0.5 + boost;
    }
    g.rotation.x += (state.pointer.y * -0.25 - g.rotation.x) * Math.min(1, dt * 3);
    if (cap.current) {
      cap.current.rotation.y -= dt * 0.9;
      cap.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.3) * 0.3;
    }
  });

  return (
    <>
      <Float speed={2.2} rotationIntensity={0.35} floatIntensity={0.7}>
        <group ref={group} position={[0, 0, 0]}>
          <CanBody color={color} colorName={colorName} nozzleRef={nozzle} />
        </group>
        <group ref={cap} position={[1.0, 1.15, -0.8]} scale={0.7}>
          <Cap color={color} />
        </group>
      </Float>
      <Mist color={color} nozzle={nozzle} spraying={spraying} />
    </>
  );
}

const BODY_PROFILE = [
  [0, -1.25], [0.5, -1.25], [0.56, -1.21], [0.585, -1.12], [0.585, 0.86], [0.57, 0.96], [0.5, 1.06],
  [0.38, 1.16], [0.24, 1.22], [0.18, 1.26], [0.18, 1.32], [0, 1.32],
].map(([x, y]) => new THREE.Vector2(x, y));

const CAP_PROFILE = [
  [0, 0], [0.58, 0], [0.6, 0.05], [0.6, 0.5], [0.55, 0.62], [0.4, 0.7], [0, 0.72],
].map(([x, y]) => new THREE.Vector2(x, y));

function useLabelTexture(color: string, colorName: string) {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 432;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { canvas, texture };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      const ctx = canvas.getContext("2d")!;
      const css = getComputedStyle(document.documentElement);
      const block = css.getPropertyValue("--ff-block") || "sans-serif";
      const tag = css.getPropertyValue("--ff-tag") || "cursive";
      const mono = css.getPropertyValue("--ff-body") || "sans-serif";
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      // diagonal racing stripes
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#000";
      for (let x = -H; x < W; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.lineTo(x + 26, H);
        ctx.lineTo(x + 26 + H, 0);
        ctx.lineTo(x + H, 0);
        ctx.fill();
      }
      ctx.restore();
      // band
      ctx.fillStyle = "#111";
      ctx.fillRect(0, H * 0.3, W, H * 0.42);
      ctx.font = `128px ${block}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#000";
      ctx.fillStyle = color;
      ctx.strokeText("ELDEBHOR", W * 0.5, H * 0.52);
      ctx.fillText("ELDEBHOR", W * 0.5, H * 0.52);
      ctx.font = `bold 26px ${mono}`;
      ctx.fillStyle = "#111";
      ctx.fillText("400 ML · ALTA PRESIÓN · PINTURA ILEGALMENTE BONITA", W * 0.5, H * 0.15);
      ctx.fillText("AGÍTESE ANTES DE USAR · NO APTO PARA PAREDES GRISES", W * 0.5, H * 0.86);
      ctx.font = `80px ${tag}`;
      ctx.fillStyle = "#fff";
      ctx.save();
      ctx.translate(W * 0.86, H * 0.3);
      ctx.rotate(-0.15);
      ctx.lineWidth = 8;
      ctx.strokeText(colorName.toLowerCase(), 0, 0);
      ctx.fillText(colorName.toLowerCase(), 0, 0);
      ctx.restore();
      texture.needsUpdate = true;
    };
    draw();
    void document.fonts?.ready.then(draw);
    return () => {
      cancelled = true;
    };
  }, [canvas, texture, color, colorName]);

  return texture;
}

function CanBody({ color, colorName, nozzleRef }: { color: string; colorName: string; nozzleRef: React.RefObject<THREE.Object3D | null> }) {
  const label = useLabelTexture(color, colorName);
  const body = useMemo(() => new THREE.LatheGeometry(BODY_PROFILE, 72), []);
  return (
    <group>
      <mesh geometry={body}>
        <meshPhysicalMaterial color="#202020" metalness={1} roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, -0.13, 0]}>
        <cylinderGeometry args={[0.592, 0.592, 1.62, 72, 1, true]} />
        <meshPhysicalMaterial map={label} roughness={0.32} metalness={0.15} clearcoat={0.9} />
      </mesh>
      {[0.88, -1.1].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.586, 0.022, 12, 72]} />
          <meshStandardMaterial color="#e8e8e8" metalness={1} roughness={0.15} />
        </mesh>
      ))}
      {/* valve + actuator */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.18, 24]} />
        <meshStandardMaterial color="#d9d9d9" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[0.26, 0.16, 0.26]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.56, 0.132]}>
        <circleGeometry args={[0.035, 16]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <object3D ref={nozzleRef} position={[0, 1.56, 0.15]} />
    </group>
  );
}

function Cap({ color }: { color: string }) {
  const geo = useMemo(() => new THREE.LatheGeometry(CAP_PROFILE, 64), []);
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial color={color} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
}

const N = 900;

function Mist({ color, nozzle, spraying }: { color: string; nozzle: React.RefObject<THREE.Object3D | null>; spraying: React.RefObject<boolean> }) {
  const points = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const pos = new Float32Array(N * 3).fill(9999);
    const vel = new Float32Array(N * 3);
    const life = new Float32Array(N);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    return { pos, vel, life, geo, cursor: 0 };
  }, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color(color) }, uScale: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float aLife;
          varying float vLife;
          uniform float uScale;
          void main() {
            vLife = aLife;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uScale * (6.0 + (1.0 - aLife) * 46.0) * (6.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vLife;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float a = smoothstep(0.5, 0.0, d) * vLife * 0.5;
            gl_FragColor = vec4(uColor, a);
          }`,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    material.uniforms.uColor.value.set(color);
  }, [color, material]);

  const origin = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, dt) => {
    const { pos, vel, life } = data;
    material.uniforms.uScale.value = state.gl.getPixelRatio();
    if (spraying.current && nozzle.current) {
      nozzle.current.getWorldPosition(origin);
      nozzle.current.getWorldQuaternion(q);
      for (let k = 0; k < 14; k++) {
        const i = data.cursor;
        data.cursor = (data.cursor + 1) % N;
        dir.set((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.35, 1).applyQuaternion(q).normalize();
        const sp = 3 + Math.random() * 3;
        pos[i * 3] = origin.x;
        pos[i * 3 + 1] = origin.y;
        pos[i * 3 + 2] = origin.z;
        vel[i * 3] = dir.x * sp;
        vel[i * 3 + 1] = dir.y * sp;
        vel[i * 3 + 2] = dir.z * sp;
        life[i] = 1;
      }
    }
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt * 0.9;
      vel[i * 3] *= 0.95;
      vel[i * 3 + 1] = vel[i * 3 + 1] * 0.95 - dt * 0.4;
      vel[i * 3 + 2] *= 0.95;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (life[i] <= 0) pos[i * 3 + 1] = 9999;
    }
    data.geo.attributes.position.needsUpdate = true;
    data.geo.attributes.aLife.needsUpdate = true;
  });

  return <points ref={points} geometry={data.geo} material={material} frustumCulled={false} />;
}
