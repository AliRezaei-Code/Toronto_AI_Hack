"use client";

import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { Vector3 } from "three";
import { ParticleBurst } from "./ParticleBurst";
import { particleEventName } from "@/src/lib/particle-events";

type Burst = {
  id: string;
  position: Vector3;
  color?: string;
  intensity?: number;
};

export function ParticleBurstLayer() {
  const { camera, size } = useThree();
  const [bursts, setBursts] = useState<Burst[]>([]);

  const handleBurst = useCallback(
    (
      event: CustomEvent<{
        clientX: number;
        clientY: number;
        color?: string;
        intensity?: number;
      }>,
    ) => {
      const { clientX, clientY, color, intensity } = event.detail;
      const ndc = new Vector3(
        (clientX / size.width) * 2 - 1,
        -(clientY / size.height) * 2 + 1,
        0.5,
      );

      ndc.unproject(camera);
      const direction = ndc.sub(camera.position).normalize();
      const position = camera.position
        .clone()
        .add(direction.multiplyScalar(6.5));

      setBursts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          position,
          color,
          intensity,
        },
      ]);
    },
    [camera, size.height, size.width],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const listener = (event: Event) => {
      handleBurst(event as CustomEvent);
    };
    window.addEventListener(particleEventName, listener);
    return () => window.removeEventListener(particleEventName, listener);
  }, [handleBurst]);

  return (
    <>
      {bursts.map((burst) => (
        <ParticleBurst
          key={burst.id}
          position={burst.position}
          color={burst.color}
          intensity={burst.intensity}
          onComplete={() => {
            setBursts((prev) => prev.filter((item) => item.id !== burst.id));
          }}
        />
      ))}
    </>
  );
}
