import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ModelConfiguration } from "@/lib/jarvis/config";
import type { ModelDefinition, ModelKind } from "@/lib/jarvis/models";

interface Props {
  model: ModelDefinition | null;
  config: ModelConfiguration;
  detail: "low" | "medium" | "high";
}

type PartId = "base" | "body" | "crown" | "details";

function useHoloMaterial(config: ModelConfiguration, shade = 1) {
  return useMemo(() => {
    const color = new THREE.Color(config.material.color).multiplyScalar(shade);
    return new THREE.MeshStandardMaterial({
      color,
      metalness: config.material.metalness,
      roughness: config.material.roughness,
      transparent: config.material.opacity < 1,
      opacity: config.material.opacity,
      emissive: color.clone().multiplyScalar(0.6),
      emissiveIntensity: config.material.emissive,
      wireframe: config.material.wireframe,
      side: THREE.DoubleSide,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.material.color,
    config.material.metalness,
    config.material.roughness,
    config.material.opacity,
    config.material.emissive,
    config.material.wireframe,
    shade,
  ]);
}

/** Blueprint placeholder shown when a location has no reconstruction yet. */
export function BlueprintFallback({ config }: { config: ModelConfiguration }) {
  const mat = useHoloMaterial({ ...config, material: { ...config.material, wireframe: true } });
  return (
    <group>
      <mesh material={mat} position={[0, 1, 0]}>
        <icosahedronGeometry args={[1, 1]} />
      </mesh>
      <mesh material={mat} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.6, 48]} />
      </mesh>
    </group>
  );
}

function Parts({ kind, detail, mat, matDim, visible }: {
  kind: ModelKind;
  detail: "low" | "medium" | "high";
  mat: THREE.Material;
  matDim: THREE.Material;
  visible: Record<string, boolean>;
}) {
  const seg = detail === "low" ? 12 : detail === "medium" ? 24 : 48;
  const count = detail === "low" ? 4 : detail === "medium" ? 7 : 11;
  const show = (p: PartId) => visible[p] !== false;

  const ring = (n: number, radius: number, fn: (i: number, a: number) => JSX.Element) =>
    Array.from({ length: n }, (_, i) => fn(i, (i / n) * Math.PI * 2 + radius * 0));

  switch (kind) {
    case "tower":
      return (
        <group>
          {show("base") && (
            <mesh material={mat} position={[0, 0.15, 0]}>
              <cylinderGeometry args={[1.3, 1.5, 0.3, seg]} />
            </mesh>
          )}
          {show("body") && (
            <>
              <mesh material={mat} position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.45, 1.15, 2.1, 4, 1, true]} />
              </mesh>
              <mesh material={matDim} position={[0, 2.6, 0]}>
                <cylinderGeometry args={[0.2, 0.45, 1.6, 4, 1, true]} />
              </mesh>
            </>
          )}
          {show("crown") && (
            <mesh material={mat} position={[0, 3.9, 0]}>
              <coneGeometry args={[0.16, 1.1, seg / 2] as [number, number, number]} />
            </mesh>
          )}
          {show("details") &&
            [0.6, 1.9, 3.3].map((y, i) => (
              <mesh key={i} material={matDim} position={[0, y, 0]}>
                <boxGeometry args={[1.4 - i * 0.4, 0.08, 1.4 - i * 0.4]} />
              </mesh>
            ))}
        </group>
      );

    case "wall":
      return (
        <group>
          {show("base") && (
            <mesh material={matDim} position={[0, 0.1, 0]}>
              <boxGeometry args={[6, 0.2, 1.6]} />
            </mesh>
          )}
          {show("body") &&
            Array.from({ length: count }, (_, i) => (
              <mesh key={i} material={mat} position={[-2.8 + (i * 5.6) / (count - 1), 0.5 + Math.sin(i) * 0.15, Math.sin(i * 0.8) * 0.5]}>
                <boxGeometry args={[5.8 / count, 0.9, 1] as [number, number, number]} />
              </mesh>
            ))}
          {show("crown") &&
            [-2.2, 0.4, 2.6].map((x, i) => (
              <mesh key={i} material={mat} position={[x, 1.1, Math.sin(x) * 0.4]}>
                <boxGeometry args={[0.7, 1.3, 0.7]} />
              </mesh>
            ))}
          {show("details") &&
            Array.from({ length: count * 2 }, (_, i) => (
              <mesh key={i} material={matDim} position={[-2.8 + (i * 5.6) / (count * 2 - 1), 1.05, Math.sin(i * 0.4) * 0.5]}>
                <boxGeometry args={[0.12, 0.22, 1]} />
              </mesh>
            ))}
        </group>
      );

    case "citadel":
      return (
        <group>
          {show("base") &&
            [0, 1, 2].map((i) => (
              <mesh key={i} material={matDim} position={[0, 0.15 + i * 0.3, 0]}>
                <cylinderGeometry args={[2.2 - i * 0.45, 2.4 - i * 0.45, 0.3, seg]} />
              </mesh>
            ))}
          {show("body") &&
            ring(count, 1, (i, a) => (
              <mesh key={i} material={mat} position={[Math.cos(a) * 1.1, 1.35, Math.sin(a) * 1.1]}>
                <boxGeometry args={[0.4, 0.7, 0.4]} />
              </mesh>
            ))}
          {show("crown") && (
            <mesh material={mat} position={[0, 1.7, 0]}>
              <boxGeometry args={[0.9, 1.2, 0.9]} />
            </mesh>
          )}
          {show("details") && (
            <mesh material={matDim} position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 1.7, seg]} />
            </mesh>
          )}
        </group>
      );

    case "peak":
      return (
        <group>
          {show("base") && (
            <mesh material={matDim} position={[0, 0.2, 0]}>
              <cylinderGeometry args={[2.4, 2.8, 0.4, seg]} />
            </mesh>
          )}
          {show("body") && (
            <mesh material={mat} position={[0, 1.6, 0]}>
              <coneGeometry args={[2, 3, seg, 3] as [number, number, number, number]} />
            </mesh>
          )}
          {show("crown") && (
            <mesh material={mat} position={[0, 2.85, 0]}>
              <coneGeometry args={[0.65, 0.9, seg] as [number, number, number]} />
            </mesh>
          )}
          {show("details") &&
            ring(count, 1, (i, a) => (
              <mesh key={i} material={matDim} position={[Math.cos(a) * 1.5, 0.9, Math.sin(a) * 1.5]} rotation={[0, -a, 0.35]}>
                <boxGeometry args={[0.1, 1.4, 0.1]} />
              </mesh>
            ))}
        </group>
      );

    case "falls":
      return (
        <group>
          {show("base") && (
            <mesh material={matDim} position={[0, 0.08, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.5, seg]} />
            </mesh>
          )}
          {show("body") && (
            <mesh material={mat} position={[0, 1.6, -0.6]}>
              <boxGeometry args={[3.2, 3.2, 1.2]} />
            </mesh>
          )}
          {show("crown") &&
            [-0.7, 0, 0.7].map((x, i) => (
              <mesh key={i} material={mat} position={[x, 1.6, 0.05]}>
                <boxGeometry args={[0.5, 3.1, 0.12]} />
              </mesh>
            ))}
          {show("details") &&
            Array.from({ length: count }, (_, i) => (
              <mesh key={i} material={matDim} position={[(i - count / 2) * 0.35, 0.25 + (i % 3) * 0.12, 0.9]}>
                <sphereGeometry args={[0.12, 8, 8]} />
              </mesh>
            ))}
        </group>
      );

    case "dome":
      return (
        <group>
          {show("base") && (
            <mesh material={matDim} position={[0, 0.15, 0]}>
              <boxGeometry args={[3.6, 0.3, 3.6]} />
            </mesh>
          )}
          {show("body") && (
            <mesh material={mat} position={[0, 0.95, 0]}>
              <boxGeometry args={[2.4, 1.3, 2.4]} />
            </mesh>
          )}
          {show("crown") && (
            <mesh material={mat} position={[0, 1.6, 0]}>
              <sphereGeometry args={[1.05, seg, seg / 2, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          )}
          {show("details") &&
            [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z], i) => (
              <mesh key={i} material={matDim} position={[x, 1.1, z]}>
                <cylinderGeometry args={[0.14, 0.18, 2.2, 8]} />
              </mesh>
            ))}
        </group>
      );

    case "arena":
      return (
        <group>
          {show("base") && (
            <mesh material={matDim} position={[0, 0.1, 0]}>
              <cylinderGeometry args={[2.6, 2.8, 0.2, seg]} />
            </mesh>
          )}
          {show("body") && (
            <mesh material={mat} position={[0, 0.9, 0]}>
              <cylinderGeometry args={[2.4, 2.5, 1.5, seg, 1, true]} />
            </mesh>
          )}
          {show("crown") && (
            <mesh material={mat} position={[0, 1.9, 0]}>
              <cylinderGeometry args={[2.3, 2.4, 0.6, seg, 1, true]} />
            </mesh>
          )}
          {show("details") &&
            ring(count * 2, 1, (i, a) => (
              <mesh key={i} material={matDim} position={[Math.cos(a) * 2.45, 0.9, Math.sin(a) * 2.45]} rotation={[0, -a, 0]}>
                <boxGeometry args={[0.1, 1.4, 0.16]} />
              </mesh>
            ))}
        </group>
      );

    case "forest":
      return (
        <group>
          {show("base") && (
            <mesh material={matDim} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[3, seg]} />
            </mesh>
          )}
          {show("body") &&
            Array.from({ length: count * 2 }, (_, i) => {
              const a = (i / (count * 2)) * Math.PI * 2;
              const r = 0.6 + ((i * 7) % 20) / 10;
              return (
                <mesh key={i} material={mat} position={[Math.cos(a) * r, 0.6 + (i % 3) * 0.15, Math.sin(a) * r]}>
                  <coneGeometry args={[0.28, 1 + (i % 3) * 0.3, 7] as [number, number, number]} />
                </mesh>
              );
            })}
          {show("crown") && (
            <mesh material={matDim} position={[0, 0.5, -1.6]}>
              <coneGeometry args={[1.6, 1.6, seg] as [number, number, number]} />
            </mesh>
          )}
          {show("details") && (
            <mesh material={matDim} position={[0, 0.14, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.1, 1.35, seg]} />
            </mesh>
          )}
        </group>
      );

    case "canyon":
    default:
      return (
        <group>
          {show("base") && (
            <mesh material={matDim} position={[0, 0.08, 0]}>
              <boxGeometry args={[5.5, 0.16, 1]} />
            </mesh>
          )}
          {show("body") &&
            Array.from({ length: count }, (_, i) => {
              const h = 0.5 + ((i * 5) % 9) / 6;
              const z = i % 2 === 0 ? 1.3 : -1.3;
              return (
                <mesh key={i} material={mat} position={[-2.4 + (i * 4.8) / (count - 1), h / 2, z]}>
                  <boxGeometry args={[4.8 / count, h, 1.6] as [number, number, number]} />
                </mesh>
              );
            })}
          {show("crown") &&
            [1.9, -1.9].map((z, i) => (
              <mesh key={i} material={mat} position={[0, 1.55, z]}>
                <boxGeometry args={[5.4, 0.35, 1.4]} />
              </mesh>
            ))}
          {show("details") &&
            [0.4, 0.8, 1.2].map((y, i) => (
              <mesh key={i} material={matDim} position={[0, y, 0]}>
                <boxGeometry args={[5.2, 0.04, 3.4]} />
              </mesh>
            ))}
        </group>
      );
  }
}

export default function HoloModel({ model, config, detail }: Props) {
  const group = useRef<THREE.Group>(null);
  const mat = useHoloMaterial(config, 1);
  const matDim = useHoloMaterial(config, 0.62);

  useFrame((_, dt) => {
    if (!group.current) return;
    if (config.environment.autoRotate) group.current.rotation.y += dt * 0.25;
    else group.current.rotation.y = THREE.MathUtils.degToRad(config.transform.rotationY);
  });

  const s = config.transform.scale;

  return (
    <group
      ref={group}
      scale={[s, s, s]}
      position={[0, config.transform.height, 0]}
      rotation={[0, THREE.MathUtils.degToRad(config.transform.rotationY), 0]}
    >
      {model ? (
        <Parts kind={model.kind} detail={detail} mat={mat} matDim={matDim} visible={config.parts} />
      ) : (
        <BlueprintFallback config={config} />
      )}
    </group>
  );
}
