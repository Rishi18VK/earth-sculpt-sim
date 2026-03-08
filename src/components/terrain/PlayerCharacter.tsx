import { useRef, useEffect, useCallback, Suspense } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { BiomeConfig, biomeNoise } from "@/lib/biomes";
import type { ModPlayerOverrides } from "@/lib/mod-types";

interface PlayerCharacterProps {
  biome: BiomeConfig;
  seed: number;
  playMode: boolean;
  onPositionUpdate?: (pos: [number, number, number]) => void;
  mobileInput?: { moveX: number; moveZ: number; cameraX: number; cameraY: number };
  modOverrides?: ModPlayerOverrides | null;
}

const MOVE_SPEED = 8;
const SPRINT_SPEED = 14;
const ROTATION_SPEED = 2.5;
const CAMERA_DISTANCE = 8;
const CAMERA_HEIGHT = 4;
const CAMERA_LERP = 5;
const TERRAIN_HALF = 38;
const GRAVITY = -25;
const JUMP_FORCE = 10;

export default function PlayerCharacter({ biome, seed, playMode, onPositionUpdate, mobileInput, modOverrides }: PlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cameraAngleRef = useRef(0);
  const cameraPitchRef = useRef(0.3);
  const cameraDistRef = useRef(modOverrides?.cameraDistance ?? CAMERA_DISTANCE);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseDownRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const walkPhaseRef = useRef(0);
  const velocityYRef = useRef(0);
  const isGroundedRef = useRef(true);
  const { camera, gl } = useThree();

  // Spawn position
  const spawnHeight = biomeNoise(0, 0, biome, seed);
  const posRef = useRef(new THREE.Vector3(0, Math.max(spawnHeight, biome.waterLevel + 0.5), 0));
  const facingRef = useRef(0);

  // Reset position on biome/seed change
  useEffect(() => {
    const h = biomeNoise(0, 0, biome, seed);
    posRef.current.set(0, Math.max(h, biome.waterLevel + 0.5), 0);
  }, [biome, seed]);

  // Keyboard handlers
  useEffect(() => {
    if (!playMode) return;
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === " ") e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      keysRef.current.clear();
    };
  }, [playMode]);

  // Mouse handlers for camera rotation
  useEffect(() => {
    if (!playMode) return;
    const canvas = gl.domElement;
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        mouseDownRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseUp = () => { mouseDownRef.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDownRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      cameraAngleRef.current -= dx * 0.005;
      cameraPitchRef.current = Math.max(0.05, Math.min(1.2, cameraPitchRef.current + dy * 0.005));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e: WheelEvent) => {
      cameraDistRef.current = Math.max(3, Math.min(20, cameraDistRef.current + e.deltaY * 0.01));
    };
    const onContext = (e: Event) => e.preventDefault();

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel);
    canvas.addEventListener("contextmenu", onContext);
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContext);
    };
  }, [playMode, gl]);

  useFrame((_, delta) => {
    if (!playMode || !groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const pos = posRef.current;
    const keys = keysRef.current;

    // Sprint check - use mod overrides if available
    const isSprinting = keys.has("shift");
    const baseSpeed = modOverrides?.speed ?? MOVE_SPEED;
    const sprintSpeed = modOverrides?.sprintSpeed ?? SPRINT_SPEED;
    const speed = isSprinting ? sprintSpeed : baseSpeed;

    // Movement input
    let moveX = 0, moveZ = 0;
    if (keys.has("w") || keys.has("arrowup")) moveZ -= 1;
    if (keys.has("s") || keys.has("arrowdown")) moveZ += 1;
    if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
    if (keys.has("d") || keys.has("arrowright")) moveX += 1;

    // Jump
    if (keys.has(" ") && isGroundedRef.current) {
      velocityYRef.current = modOverrides?.jumpForce ?? JUMP_FORCE;
      isGroundedRef.current = false;
    }

    // Mobile joystick input
    if (mobileInput) {
      moveX += mobileInput.moveX;
      moveZ += mobileInput.moveZ;
      cameraAngleRef.current -= mobileInput.cameraX * dt * ROTATION_SPEED;
      cameraPitchRef.current = Math.max(0.05, Math.min(1.2, cameraPitchRef.current + mobileInput.cameraY * dt * ROTATION_SPEED));
    }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    const isMoving = len > 0.1;

    if (isMoving) {
      const nx = moveX / len;
      const nz = moveZ / len;

      // Move relative to camera angle
      const angle = cameraAngleRef.current;
      const worldX = nx * Math.cos(angle) - nz * Math.sin(angle);
      const worldZ = nx * Math.sin(angle) + nz * Math.cos(angle);

      pos.x = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, pos.x + worldX * speed * dt));
      pos.z = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, pos.z + worldZ * speed * dt));

      // Face movement direction
      facingRef.current = Math.atan2(worldX, worldZ);

      // Walk animation phase (faster when sprinting)
      walkPhaseRef.current += dt * (isSprinting ? 16 : 10);
    }

    // Gravity & terrain collision
    const terrainH = biomeNoise(pos.x, pos.z, biome, seed);
    const groundY = Math.max(terrainH, biome.waterLevel + 0.3);
    const gravity = modOverrides?.gravity ?? GRAVITY;

    velocityYRef.current += gravity * dt;
    pos.y += velocityYRef.current * dt;

    if (pos.y <= groundY) {
      pos.y = groundY;
      velocityYRef.current = 0;
      isGroundedRef.current = true;
    }

    // Update group position
    groupRef.current.position.copy(pos);
    groupRef.current.rotation.y = facingRef.current;

    // Animate legs
    const leftLeg = groupRef.current.getObjectByName("leftLeg");
    const rightLeg = groupRef.current.getObjectByName("rightLeg");
    const leftArm = groupRef.current.getObjectByName("leftArm");
    const rightArm = groupRef.current.getObjectByName("rightArm");
    if (isMoving) {
      const swing = Math.sin(walkPhaseRef.current) * 0.5;
      if (leftLeg) leftLeg.rotation.x = swing;
      if (rightLeg) rightLeg.rotation.x = -swing;
      if (leftArm) leftArm.rotation.x = -swing * 0.6;
      if (rightArm) rightArm.rotation.x = swing * 0.6;
    } else {
      if (leftLeg) leftLeg.rotation.x *= 0.9;
      if (rightLeg) rightLeg.rotation.x *= 0.9;
      if (leftArm) leftArm.rotation.x *= 0.9;
      if (rightArm) rightArm.rotation.x *= 0.9;
    }

    // Third-person camera
    const dist = cameraDistRef.current;
    const pitch = cameraPitchRef.current;
    const camAngle = cameraAngleRef.current;
    const camTargetX = pos.x + Math.sin(camAngle) * Math.cos(pitch) * dist;
    const camTargetZ = pos.z + Math.cos(camAngle) * Math.cos(pitch) * dist;
    const camTargetY = pos.y + (modOverrides?.cameraHeight ?? CAMERA_HEIGHT) + Math.sin(pitch) * dist * 0.5;

    camera.position.x += (camTargetX - camera.position.x) * Math.min(dt * CAMERA_LERP, 1);
    camera.position.y += (camTargetY - camera.position.y) * Math.min(dt * CAMERA_LERP, 1);
    camera.position.z += (camTargetZ - camera.position.z) * Math.min(dt * CAMERA_LERP, 1);
    camera.lookAt(pos.x, pos.y + 1, pos.z);

    onPositionUpdate?.([
      Math.round(pos.x * 10) / 10,
      Math.round(pos.y * 10) / 10,
      Math.round(pos.z * 10) / 10,
    ]);
  });

  if (!playMode) return null;

  const scale = modOverrides?.scale ?? 1;

  return (
    <group ref={groupRef}>
      <group scale={[scale, scale, scale]}>
        {modOverrides?.modelUrl ? (
          <Suspense fallback={<DefaultPlayerModel />}>
            <CustomModelLoader url={modOverrides.modelUrl} />
          </Suspense>
        ) : (
          <DefaultPlayerModel />
        )}
      </group>
      {/* Shadow indicator */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4 * scale, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function CustomModelLoader({ url }: { url: string }) {
  try {
    const { scene } = useGLTF(url);
    return <primitive object={scene.clone()} castShadow />;
  } catch {
    return <DefaultPlayerModel />;
  }
}

function DefaultPlayerModel() {
  return (
    <>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.08, 1.45, 0.17]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.08, 1.45, 0.17]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Left Arm */}
      <group name="leftArm" position={[0.38, 0.9, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.8} />
        </mesh>
      </group>
      {/* Right Arm */}
      <group name="rightArm" position={[-0.38, 0.9, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.8} />
        </mesh>
      </group>
      {/* Left Leg */}
      <group name="leftLeg" position={[0.12, 0.55, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          <meshStandardMaterial color="#1e40af" roughness={0.8} />
        </mesh>
      </group>
      {/* Right Leg */}
      <group name="rightLeg" position={[-0.12, 0.55, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          <meshStandardMaterial color="#1e40af" roughness={0.8} />
        </mesh>
      </group>
    </>
  );
}
