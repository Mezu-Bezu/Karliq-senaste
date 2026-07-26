"use client";

import { Center, Environment, Lightformer, Text3D } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type SignalLoomSceneProps = {
  active: boolean;
  mobile: boolean;
  onReady: () => void;
};

type InstanceKey =
  | "jointClay"
  | "jointBone"
  | "jointGraphite"
  | "jointGlass"
  | "ringClay"
  | "ringBrass"
  | "ringGraphite";

type BodyVisual =
  | { kind: "letter"; index: number }
  | { kind: "instance"; key: InstanceKey; slot: number };

type PhysicsBody = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  visual: BodyVisual;
  scale: number;
  radius: number;
  inverseMass: number;
  phase: number;
  introPosition: THREE.Vector3 | null;
  releaseVelocity: THREE.Vector3 | null;
  released: boolean;
  idleFrames: number;
  sleeping: boolean;
};

const LETTERS = ["K", "A", "R", "L", "I", "Q"] as const;
const WORD_RELEASE_TIME = 1.15;
const COLOR_PALETTES = [
  {
    accent: "#8b5cf6",
    light: "#f4effc",
    dark: "#160a24",
    metal: "#e9d5ff",
    glass: "#d8b4fe",
  },
  {
    accent: "#ff4f87",
    light: "#fff1ba",
    dark: "#34112f",
    metal: "#ff9b54",
    glass: "#ffb3d1",
  },
  {
    accent: "#15c9b7",
    light: "#edffd1",
    dark: "#062d3a",
    metal: "#71f2ca",
    glass: "#8fe9ff",
  },
] as const;

const tempObject = new THREE.Object3D();
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempD = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempColor = new THREE.Color();
const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

function lerpMaterialColor(
  material: THREE.MeshPhysicalMaterial | null,
  target: string,
  ease: number,
) {
  if (!material) return;
  tempColor.set(target);
  material.color.lerp(tempColor, ease);
}

export default function SignalLoomScene({ active, mobile, onReady }: SignalLoomSceneProps) {
  return (
    <Canvas
      className="signal-loom-canvas"
      camera={{ position: [0, 0, mobile ? 11.8 : 10.6], fov: mobile ? 43 : 35 }}
      dpr={mobile ? [1, 1.2] : [1, 1.6]}
      frameloop={active ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#fcf7ff", "#180a2a", 1.8]} />
      <directionalLight color="#faf5ff" intensity={3.7} position={[-4, 6, 8]} />
      <spotLight color="#9333ea" intensity={42} position={[6, -2, 6]} angle={0.48} penumbra={0.92} />
      <pointLight color="#d8b4fe" intensity={17} distance={10} position={[1, 3, 4]} />

      <Suspense fallback={null}>
        <Environment resolution={mobile ? 64 : 128}>
          <Lightformer color="#ffffff" intensity={4} position={[-5, 4, 4]} scale={[5, 5, 1]} />
          <Lightformer color="#d8b4fe" intensity={2.4} position={[5, -2, 2]} scale={[3, 5, 1]} />
          <Lightformer color="#8b5cf6" intensity={1.5} position={[0, 4, -4]} rotation-y={Math.PI} scale={[7, 2, 1]} />
        </Environment>
        <SignalField mobile={mobile} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

function SignalField({ mobile, onReady }: { mobile: boolean; onReady: () => void }) {
  const { camera, viewport } = useThree();
  const letterMeshes = useRef<Array<THREE.Group | null>>([]);
  const jointClayMesh = useRef<THREE.InstancedMesh>(null);
  const jointBoneMesh = useRef<THREE.InstancedMesh>(null);
  const jointGraphiteMesh = useRef<THREE.InstancedMesh>(null);
  const jointGlassMesh = useRef<THREE.InstancedMesh>(null);
  const ringClayMesh = useRef<THREE.InstancedMesh>(null);
  const ringBrassMesh = useRef<THREE.InstancedMesh>(null);
  const ringGraphiteMesh = useRef<THREE.InstancedMesh>(null);

  const jointClayMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const jointBoneMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const jointGraphiteMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const jointGlassMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const ringClayMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const ringBrassMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const ringGraphiteMaterial = useRef<THREE.MeshPhysicalMaterial>(null);

  const pointer = useRef(new THREE.Vector2(0.62, 0.04));
  const pointerActive = useRef(false);
  const pointerWorld = useRef(new THREE.Vector3());
  const previousPointerWorld = useRef(new THREE.Vector3());
  const pointerVelocity = useRef(new THREE.Vector3());
  const centerTarget = useRef(new THREE.Vector3());
  const scrollProgress = useRef(0);
  const accentIndex = useRef(0);
  const reportedReady = useRef(false);
  const introStartedAt = useRef<number | null>(null);

  const jointGeometry = useMemo(() => createTriJointGeometry(mobile), [mobile]);

  const ringGeometry = useMemo(
    () => createWavyRingGeometry(mobile),
    [mobile],
  );

  const letterMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: COLOR_PALETTES[0].accent,
        roughness: 0.18,
        metalness: 0.04,
        clearcoat: 0.82,
        clearcoatRoughness: 0.16,
      }),
    [],
  );

  const bodies = useMemo(() => createBodies(mobile), [mobile]);
  const instanceCounts = useMemo(() => countInstances(bodies), [bodies]);

  useEffect(() => {
    if (!reportedReady.current) {
      reportedReady.current = true;
      onReady();
    }
  }, [onReady]);

  useEffect(() => {
    introStartedAt.current = null;
  }, [bodies]);

  useEffect(() => {
    [
      jointClayMesh,
      jointBoneMesh,
      jointGraphiteMesh,
      jointGlassMesh,
      ringClayMesh,
      ringBrassMesh,
      ringGraphiteMesh,
    ].forEach((meshRef) => meshRef.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage));
  }, [mobile]);

  useEffect(
    () => () => {
      jointGeometry.dispose();
      ringGeometry.dispose();
    },
    [jointGeometry, ringGeometry],
  );
  useEffect(() => () => letterMaterial.dispose(), [letterMaterial]);

  useEffect(() => {
    const hero = document.getElementById("top");
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !hero) return;
      const bounds = hero.getBoundingClientRect();
      pointerActive.current =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      pointer.current.set(
        (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1,
        -(event.clientY / Math.max(1, window.innerHeight)) * 2 + 1,
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      if (mobile || event.button !== 0 || !hero) return;
      const target = event.target as Element | null;
      if (target?.closest("a, button, input, textarea, select, label")) return;
      const bounds = hero.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) return;

      accentIndex.current = (accentIndex.current + 1) % COLOR_PALETTES.length;
      for (const body of bodies) {
        if (!body.released) continue;
        body.sleeping = false;
        body.idleFrames = 0;
        tempA.copy(body.position).normalize();
        tempB.set(-tempA.y, tempA.x, Math.sin(body.phase) * 0.35).normalize();
        body.velocity.addScaledVector(tempA, 1.8).addScaledVector(tempB, 2.4);
        body.angularVelocity.addScaledVector(tempB, 1.8);
      }
    };

    const onScroll = () => {
      scrollProgress.current = THREE.MathUtils.clamp(
        window.scrollY / Math.max(1, window.innerHeight),
        0,
        1,
      );
    };

    onScroll();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [bodies, mobile]);

  useFrame(({ clock, raycaster }, delta) => {
    if (introStartedAt.current === null) introStartedAt.current = clock.elapsedTime;
    const introTime = clock.elapsedTime - introStartedAt.current;
    const lettersLocked = introTime < WORD_RELEASE_TIME;
    const letterReveal = easeOutExpo(THREE.MathUtils.clamp(introTime / 0.38, 0, 1));
    const abstractReveal = easeOutExpo(
      THREE.MathUtils.clamp((introTime - WORD_RELEASE_TIME + 0.04) / 0.48, 0, 1),
    );
    const frameDelta = Math.min(delta, 1 / 30);

    const target = centerTarget.current.set(
      mobile ? 0 : Math.min(3, viewport.width * 0.27),
      (mobile ? -0.55 : -0.05) - scrollProgress.current * 0.8,
      -scrollProgress.current * 1.1,
    );

    if (pointerActive.current && !mobile) {
      raycaster.setFromCamera(pointer.current, camera);
      if (raycaster.ray.intersectPlane(pointerPlane, pointerWorld.current)) {
        if (previousPointerWorld.current.lengthSq() === 0) previousPointerWorld.current.copy(pointerWorld.current);
        pointerVelocity.current
          .copy(pointerWorld.current)
          .sub(previousPointerWorld.current)
          .multiplyScalar(1 / Math.max(frameDelta, 1 / 120))
          .clampLength(0, 12);
        previousPointerWorld.current.copy(pointerWorld.current);
      }
    } else {
      pointerVelocity.current.multiplyScalar(0.8);
      previousPointerWorld.current.set(0, 0, 0);
    }

    updateLetterSequence(bodies, lettersLocked);

    if (!lettersLocked) {
      const steps = 3;
      for (let step = 0; step < steps; step += 1) {
        stepPhysics(
          bodies,
          frameDelta / steps,
          target,
          pointerWorld.current,
          pointerVelocity.current,
          pointerActive.current && !mobile,
          viewport.width,
          viewport.height,
        );
      }
    }

    updateVisuals(
      bodies,
      {
        jointClay: jointClayMesh.current,
        jointBone: jointBoneMesh.current,
        jointGraphite: jointGraphiteMesh.current,
        jointGlass: jointGlassMesh.current,
        ringClay: ringClayMesh.current,
        ringBrass: ringBrassMesh.current,
        ringGraphite: ringGraphiteMesh.current,
      },
      letterMeshes.current,
      letterReveal,
      abstractReveal,
    );

    const palette = COLOR_PALETTES[accentIndex.current];
    const colorEase = 1 - Math.exp(-frameDelta * 7.5);
    lerpMaterialColor(letterMaterial, palette.accent, colorEase);
    lerpMaterialColor(jointClayMaterial.current, palette.accent, colorEase);
    lerpMaterialColor(jointBoneMaterial.current, palette.light, colorEase);
    lerpMaterialColor(jointGraphiteMaterial.current, palette.dark, colorEase);
    lerpMaterialColor(jointGlassMaterial.current, palette.glass, colorEase);
    lerpMaterialColor(ringClayMaterial.current, palette.accent, colorEase);
    lerpMaterialColor(ringBrassMaterial.current, palette.metal, colorEase);
    lerpMaterialColor(ringGraphiteMaterial.current, palette.dark, colorEase);
  });

  return (
    <>
      {LETTERS.map((letter, index) => (
        <group
          ref={(group) => { letterMeshes.current[index] = group; }}
          key={letter}
        >
          <Center>
            <Text3D
              font="/fonts/droid_sans_bold.typeface.json"
              size={1.25}
              height={0.25}
              curveSegments={24}
              bevelEnabled
              bevelThickness={0.06}
              bevelSize={0.04}
              bevelSegments={8}
              material={letterMaterial}
            >
              {letter}
            </Text3D>
          </Center>
        </group>
      ))}

      <instancedMesh ref={jointClayMesh} args={[jointGeometry, undefined, instanceCounts.jointClay]} frustumCulled={false}>
        <meshPhysicalMaterial ref={jointClayMaterial} color={COLOR_PALETTES[0].accent} roughness={0.22} metalness={0.03} clearcoat={0.68} clearcoatRoughness={0.22} />
      </instancedMesh>
      <instancedMesh ref={jointBoneMesh} args={[jointGeometry, undefined, instanceCounts.jointBone]} frustumCulled={false}>
        <meshPhysicalMaterial ref={jointBoneMaterial} color={COLOR_PALETTES[0].light} roughness={0.48} metalness={0.01} clearcoat={0.18} clearcoatRoughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={jointGraphiteMesh} args={[jointGeometry, undefined, instanceCounts.jointGraphite]} frustumCulled={false}>
        <meshPhysicalMaterial ref={jointGraphiteMaterial} color={COLOR_PALETTES[0].dark} roughness={0.3} metalness={0.11} clearcoat={0.42} clearcoatRoughness={0.28} />
      </instancedMesh>
      {!mobile && instanceCounts.jointGlass > 0 ? (
        <instancedMesh ref={jointGlassMesh} args={[jointGeometry, undefined, instanceCounts.jointGlass]} frustumCulled={false}>
          <meshPhysicalMaterial ref={jointGlassMaterial} color={COLOR_PALETTES[0].glass} roughness={0.16} metalness={0} transmission={0.28} thickness={1.2} ior={1.38} clearcoat={0.7} clearcoatRoughness={0.16} />
        </instancedMesh>
      ) : null}

      <instancedMesh ref={ringClayMesh} args={[ringGeometry, undefined, instanceCounts.ringClay]} frustumCulled={false}>
        <meshPhysicalMaterial ref={ringClayMaterial} color={COLOR_PALETTES[0].accent} roughness={0.2} metalness={0.03} clearcoat={0.72} clearcoatRoughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={ringBrassMesh} args={[ringGeometry, undefined, instanceCounts.ringBrass]} frustumCulled={false}>
        <meshPhysicalMaterial ref={ringBrassMaterial} color={COLOR_PALETTES[0].metal} roughness={0.24} metalness={0.5} clearcoat={0.36} clearcoatRoughness={0.24} />
      </instancedMesh>
      <instancedMesh ref={ringGraphiteMesh} args={[ringGeometry, undefined, instanceCounts.ringGraphite]} frustumCulled={false}>
        <meshPhysicalMaterial ref={ringGraphiteMaterial} color={COLOR_PALETTES[0].dark} roughness={0.28} metalness={0.14} clearcoat={0.45} clearcoatRoughness={0.25} />
      </instancedMesh>
    </>
  );
}

function createBodies(mobile: boolean) {
  const random = seededRandom(mobile ? 31415 : 27182);
  const bodies: PhysicsBody[] = [];

  for (let index = 0; index < LETTERS.length; index += 1) {
    const introPosition = mobile
      ? new THREE.Vector3((index % 3 - 1) * 1.12, index < 3 ? -0.22 : -1.44, 0.72)
      : new THREE.Vector3(2.3 + (index - 2.5) * 0.76, 0.4, 0.72);
    const scale = mobile ? 0.66 : 0.72;
    const direction = new THREE.Vector3(
      (index - 2.5) * 0.42,
      index % 2 === 0 ? 0.86 : -0.72,
      (random() - 0.5) * 1.4,
    ).normalize();

    bodies.push({
      position: introPosition.clone(),
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      visual: { kind: "letter", index },
      scale,
      radius: scale * 0.58,
      inverseMass: 1,
      phase: random() * Math.PI * 2,
      introPosition,
      releaseVelocity: direction.multiplyScalar(2.5 + random() * 0.9),
      released: false,
      idleFrames: 0,
      sleeping: false,
    });
  }

  const abstractKeys: InstanceKey[] = mobile
    ? ["jointBone", "jointGraphite", "jointClay", "ringBrass", "jointBone", "ringClay"]
    : [
        "jointBone",
        "jointGraphite",
        "jointClay",
        "ringBrass",
        "jointBone",
        "jointGraphite",
        "ringClay",
        "jointGlass",
        "ringGraphite",
      ];

  const slots = emptyInstanceCounts();

  abstractKeys.forEach((key, index) => {
    const isRing = key.startsWith("ring");
    const angle = random() * Math.PI * 2;
    const distance = 4.4 + random() * (mobile ? 3.0 : 4.8);
    const scale =
      (mobile ? 0.7 : 0.77)
      * (isRing ? 1 : 1.38)
      * (0.88 + random() * 0.25);
    const position = new THREE.Vector3(
      Math.cos(angle) * distance + (mobile ? 0 : 2.0),
      Math.sin(angle) * distance * 0.62 - (mobile ? 0.5 : 0),
      (random() - 0.5) * 4.2,
    );
    const velocity = position
      .clone()
      .sub(new THREE.Vector3(mobile ? 0 : 2.2, mobile ? -0.5 : 0, 0))
      .multiplyScalar(-(0.56 + random() * 0.25));
    velocity.x += (random() - 0.5) * 1.6;
    velocity.y += (random() - 0.5) * 1.6;

    bodies.push({
      position,
      velocity,
      angularVelocity: new THREE.Vector3(
        (random() - 0.5) * 1.7,
        (random() - 0.5) * 1.7,
        (random() - 0.5) * 1.7,
      ),
      quaternion: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI),
      ),
      visual: { kind: "instance", key, slot: slots[key]++ },
      scale,
      radius: scale * (isRing ? 0.78 : 0.7),
      inverseMass: 1,
      phase: random() * Math.PI * 2 + index * 0.17,
      introPosition: null,
      releaseVelocity: null,
      released: true,
      idleFrames: 0,
      sleeping: false,
    });
  });

  return bodies;
}

function updateLetterSequence(bodies: PhysicsBody[], locked: boolean) {
  for (const body of bodies) {
    if (body.visual.kind !== "letter" || !body.introPosition) continue;
    if (locked) {
      body.position.copy(body.introPosition);
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
      body.quaternion.identity();
      body.idleFrames = 0;
      body.sleeping = false;
      continue;
    }
    if (!body.released) {
      body.released = true;
      body.velocity.copy(body.releaseVelocity ?? tempA.set(0, 0, 0));
      body.angularVelocity.set(
        Math.sin(body.phase) * 1.2,
        Math.cos(body.phase * 0.7) * 1.35,
        Math.sin(body.phase * 1.3) * 1.1,
      );
      body.idleFrames = 0;
      body.sleeping = false;
    }
  }
}

function countInstances(bodies: PhysicsBody[]) {
  const counts = emptyInstanceCounts();
  for (const body of bodies) {
    if (body.visual.kind === "instance") counts[body.visual.key] += 1;
  }
  return counts;
}

function emptyInstanceCounts(): Record<InstanceKey, number> {
  return {
    jointClay: 0,
    jointBone: 0,
    jointGraphite: 0,
    jointGlass: 0,
    ringClay: 0,
    ringBrass: 0,
    ringGraphite: 0,
  };
}

function stepPhysics(
  bodies: PhysicsBody[],
  delta: number,
  center: THREE.Vector3,
  pointer: THREE.Vector3,
  pointerMove: THREE.Vector3,
  hasPointer: boolean,
  viewportWidth: number,
  viewportHeight: number,
) {
  const pointerMoving = hasPointer && pointerMove.lengthSq() > 0.0025;
  const pointerRadius = 0.62;

  for (const body of bodies) {
    if (!body.sleeping) {
      tempA.copy(center).sub(body.position);
      const centerDistance = tempA.length();
      if (centerDistance > 0.0001) {
        body.velocity.addScaledVector(tempA, (8.5 * delta) / centerDistance);
      }
      body.velocity.z += (center.z - body.position.z) * 4.5 * delta;
    }

    if (hasPointer) {
      tempA.set(
        body.position.x - pointer.x,
        body.position.y - pointer.y,
        body.position.z * 0.055,
      );
      const distance = Math.max(0.0001, tempA.length());
      const minimumDistance = body.radius + pointerRadius;
      if (distance < minimumDistance) {
        tempA.multiplyScalar(1 / distance);
        const overlap = minimumDistance - distance;
        body.sleeping = false;
        body.idleFrames = 0;
        body.position.addScaledVector(tempA, overlap * 0.82);

        if (pointerMoving) {
          const normalSpeed = Math.max(0, pointerMove.dot(tempA));
          body.velocity
            .addScaledVector(tempA, overlap * 6 * delta + normalSpeed * 0.06)
            .addScaledVector(pointerMove, 0.045);
          tempB.crossVectors(tempA, pointerMove).multiplyScalar(0.075);
          body.angularVelocity.add(tempB);
        }
      }
    }
  }

  for (let index = 0; index < bodies.length; index += 1) {
    const first = bodies[index];
    for (let otherIndex = index + 1; otherIndex < bodies.length; otherIndex += 1) {
      const second = bodies[otherIndex];
      tempA.copy(second.position).sub(first.position);
      const distanceSquared = tempA.lengthSq();
      const minimumDistance = first.radius + second.radius;
      if (distanceSquared >= minimumDistance * minimumDistance) continue;
      if (first.sleeping && second.sleeping) continue;

      first.sleeping = false;
      second.sleeping = false;
      first.idleFrames = 0;
      second.idleFrames = 0;
      const distance = Math.max(0.0001, Math.sqrt(distanceSquared));
      tempA.multiplyScalar(1 / distance);
      const overlap = minimumDistance - distance;
      const inverseMassTotal = first.inverseMass + second.inverseMass;

      first.position.addScaledVector(
        tempA,
        -overlap * 0.92 * (first.inverseMass / inverseMassTotal),
      );
      second.position.addScaledVector(
        tempA,
        overlap * 0.92 * (second.inverseMass / inverseMassTotal),
      );

      tempB.copy(second.velocity).sub(first.velocity);
      const normalSpeed = tempB.dot(tempA);
      if (normalSpeed < 0) {
        const impulse = (-(1 + 0.28) * normalSpeed) / inverseMassTotal;
        first.velocity.addScaledVector(tempA, -impulse * first.inverseMass);
        second.velocity.addScaledVector(tempA, impulse * second.inverseMass);
        tempC.copy(tempB).addScaledVector(tempA, -normalSpeed);
        first.velocity.addScaledVector(tempC, 0.055);
        second.velocity.addScaledVector(tempC, -0.055);
        tempD.crossVectors(tempA, tempC).multiplyScalar(0.055);
        first.angularVelocity.add(tempD);
        second.angularVelocity.sub(tempD);
      }
    }
  }

  for (const body of bodies) {
    if (body.sleeping) continue;

    body.position.addScaledVector(body.velocity, delta);
    containBodyInViewport(body, viewportWidth, viewportHeight);
    body.velocity.multiplyScalar(Math.exp(-2.8 * delta));
    if (body.velocity.lengthSq() > 0.04) {
      tempA.copy(body.position).sub(center);
      tempB.crossVectors(tempA, body.velocity).multiplyScalar(0.022 * delta);
      body.angularVelocity.add(tempB);
    }
    body.angularVelocity.multiplyScalar(Math.exp(-2.15 * delta));

    const angularSpeed = body.angularVelocity.length();
    if (angularSpeed > 0.0001) {
      tempA.copy(body.angularVelocity).multiplyScalar(1 / angularSpeed);
      tempQuaternion.setFromAxisAngle(tempA, angularSpeed * delta);
      body.quaternion.premultiply(tempQuaternion).normalize();
    }

    if (
      !pointerMoving
      && body.velocity.lengthSq() < 0.0196
      && body.angularVelocity.lengthSq() < 0.0144
    ) {
      body.idleFrames += delta * 60;
      if (body.idleFrames > 20) {
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.sleeping = true;
      }
    } else {
      body.idleFrames = 0;
    }
  }
}

function containBodyInViewport(
  body: PhysicsBody,
  viewportWidth: number,
  viewportHeight: number,
) {
  const visualRadius =
    body.visual.kind === "letter"
      ? body.scale * 0.74
      : body.scale * (body.visual.key.startsWith("ring") ? 0.94 : 1);
  const horizontalLimit = Math.max(visualRadius, viewportWidth * 0.5 - visualRadius);
  const verticalLimit = Math.max(visualRadius, viewportHeight * 0.5 - visualRadius);
  const bounce = 0.42;

  if (body.position.x < -horizontalLimit) {
    body.position.x = -horizontalLimit;
    if (body.velocity.x < 0) body.velocity.x *= -bounce;
  } else if (body.position.x > horizontalLimit) {
    body.position.x = horizontalLimit;
    if (body.velocity.x > 0) body.velocity.x *= -bounce;
  }

  if (body.position.y < -verticalLimit) {
    body.position.y = -verticalLimit;
    if (body.velocity.y < 0) body.velocity.y *= -bounce;
  } else if (body.position.y > verticalLimit) {
    body.position.y = verticalLimit;
    if (body.velocity.y > 0) body.velocity.y *= -bounce;
  }
}

function updateVisuals(
  bodies: PhysicsBody[],
  meshes: Record<InstanceKey, THREE.InstancedMesh | null>,
  letters: Array<THREE.Group | null>,
  letterReveal: number,
  abstractReveal: number,
) {
  for (const body of bodies) {
    if (body.visual.kind === "letter") {
      const mesh = letters[body.visual.index];
      if (!mesh) continue;
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
      mesh.scale.setScalar(body.scale * letterReveal);
      continue;
    }

    const mesh = meshes[body.visual.key];
    if (!mesh) continue;
    tempObject.position.copy(body.position);
    tempObject.quaternion.copy(body.quaternion);
    tempObject.scale.setScalar(body.scale * abstractReveal);
    tempObject.updateMatrix();
    mesh.setMatrixAt(body.visual.slot, tempObject.matrix);
  }

  for (const mesh of Object.values(meshes)) {
    if (mesh) mesh.instanceMatrix.needsUpdate = true;
  }
}

function easeOutExpo(value: number) {
  return value === 1 ? 1 : 1 - 2 ** (-10 * value);
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createTriJointGeometry(mobile: boolean) {
  const radialSegments = mobile ? 48 : 72;
  const heightSegments = mobile ? 18 : 28;
  const positions: number[] = [0, 0, 0.4];
  const indices: number[] = [];

  for (let latitude = 1; latitude < heightSegments; latitude += 1) {
    const phi = (latitude / heightSegments) * Math.PI;
    const horizontal = Math.sin(phi) ** 0.76;
    const vertical = Math.cos(phi);

    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = (segment / radialSegments) * Math.PI * 2;
      const lobe = ((Math.cos(angle * 3) + 1) * 0.5) ** 2.05;
      const asymmetry = 1 + Math.sin(angle + 0.55) * 0.026;
      const radius = horizontal * (0.36 + lobe * 0.64) * asymmetry;
      const twist = vertical * 0.045;

      positions.push(
        Math.cos(angle + twist) * radius,
        Math.sin(angle + twist) * radius,
        vertical * (0.35 + lobe * 0.05),
      );
    }
  }

  const bottomIndex = positions.length / 3;
  positions.push(0, 0, -0.4);

  for (let segment = 0; segment < radialSegments; segment += 1) {
    const next = (segment + 1) % radialSegments;
    indices.push(0, 1 + segment, 1 + next);
  }

  for (let ring = 0; ring < heightSegments - 2; ring += 1) {
    const upper = 1 + ring * radialSegments;
    const lower = upper + radialSegments;
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const next = (segment + 1) % radialSegments;
      indices.push(
        upper + segment,
        lower + segment,
        lower + next,
        upper + segment,
        lower + next,
        upper + next,
      );
    }
  }

  const lastRing = 1 + (heightSegments - 2) * radialSegments;
  for (let segment = 0; segment < radialSegments; segment += 1) {
    const next = (segment + 1) % radialSegments;
    indices.push(bottomIndex, lastRing + next, lastRing + segment);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createWavyRingGeometry(mobile: boolean) {
  const pointCount = mobile ? 36 : 54;
  const points: THREE.Vector3[] = [];

  for (let index = 0; index < pointCount; index += 1) {
    const angle = (index / pointCount) * Math.PI * 2;
    const wave = angle * 6 + 0.38;
    const radius =
      0.72
      + Math.cos(wave) * 0.026
      + Math.sin(angle * 2 - 0.45) * 0.008;
    const depth =
      Math.sin(wave) * 0.105
      + Math.sin(angle - 0.7) * 0.014;

    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        depth,
      ),
    );
  }

  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.5);
  return new THREE.TubeGeometry(
    curve,
    mobile ? 52 : 84,
    0.185,
    mobile ? 10 : 16,
    true,
  );
}
