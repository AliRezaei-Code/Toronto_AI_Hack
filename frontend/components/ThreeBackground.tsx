'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * THREE.JS ANIMATED BACKGROUND
 *
 * Creates a subtle, professional 3D particle system that:
 * - Floats golden particles in 3D space
 * - Connects nearby particles with lines
 * - Responds to mouse movement (parallax)
 * - Maintains editor tool aesthetic
 *
 * Per Business Ethos: Environmental creativity, not interruption
 */
export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create particles
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const velocities: number[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;     // x
      positions[i + 1] = (Math.random() - 0.5) * 100; // y
      positions[i + 2] = (Math.random() - 0.5) * 100; // z

      velocities.push(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Gold particles
    const material = new THREE.PointsMaterial({
      color: 0xD4AF37, // Luxury Gold
      size: 1.5,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Connection lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });

    const lineGeometry = new THREE.BufferGeometry();
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse parallax
    const handleMouseMove = (event: MouseEvent) => {
      mouseX.current = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY.current = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Update particle positions
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Boundary check
        if (Math.abs(positions[i]) > 50) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 50) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 50) velocities[i + 2] *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Update connection lines
      const linePositions: number[] = [];
      const maxDistance = 15;

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < maxDistance) {
            linePositions.push(
              positions[i * 3],
              positions[i * 3 + 1],
              positions[i * 3 + 2],
              positions[j * 3],
              positions[j * 3 + 1],
              positions[j * 3 + 2]
            );
          }
        }
      }

      lineGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(linePositions), 3)
      );

      // Subtle camera parallax
      camera.position.x += (mouseX.current * 2 - camera.position.x) * 0.02;
      camera.position.y += (mouseY.current * 2 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      // Slow rotation
      particles.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      lineMaterial.dispose();
      lineGeometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 opacity-60 pointer-events-none"
      aria-hidden="true"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
