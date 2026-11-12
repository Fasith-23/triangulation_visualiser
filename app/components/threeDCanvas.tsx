"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type {
  ProcessedLine,
  ProcessedPoint,
} from "../lib/geometry";

interface ThreeDCanvasProps {
  points: ProcessedPoint[];
  lines: ProcessedLine[];
}

const SIZE = 500;

export default function ThreeDCanvas({
  points,
  lines,
}: ThreeDCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.rotation.x = -Math.PI / 2;

    const bounds = new THREE.Box3();

    for (const point of points) {
      bounds.expandByPoint(new THREE.Vector3(point.x, point.y, point.z));
    }

    const center =
      points.length > 0
        ? bounds.getCenter(new THREE.Vector3())
        : new THREE.Vector3();

    const rotatedCenter = center.clone().applyEuler(scene.rotation);
    scene.position.copy(rotatedCenter.negate());

    const sphereRadius =
      points.length > 0
        ? bounds.getBoundingSphere(new THREE.Sphere()).radius
        : 0;

    const distance = Math.max(sphereRadius * 1.2, 100);

    const camera = new THREE.PerspectiveCamera(
      75,
      1,
      0.1,
      distance + sphereRadius * 4
    );
    camera.position.set(distance, 0, distance);
    camera.lookAt(0, 0, 0);


    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const resizeRenderer = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
    
      if (width === 0 || height === 0) return;
    
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    
    resizeRenderer();
    
    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(container);
    

    const lineMaterial = new THREE.LineBasicMaterial({
      color: "#FFA3CB",
    });

    for (const line of lines) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(line.x1, line.y1, line.z1),
        new THREE.Vector3(line.x2, line.y2, line.z2),
      ]);

      scene.add(new THREE.Line(geometry, lineMaterial));
    }

    const minZ = points.length > 0 ? bounds.min.z : 0;
    const projectionZ = minZ - sphereRadius * 0.1;


    const projectedMaterial = new THREE.LineBasicMaterial({
      color: "#FFC7DF",
    });

    const connectorMaterial = new THREE.LineDashedMaterial({
      color: "#FFC7DF",
      dashSize: 3,
      gapSize: 2,
    });

    // Draw each 3D line's projection on the plane.
    for (const line of lines) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(line.x1, line.y1, projectionZ),
        new THREE.Vector3(line.x2, line.y2, projectionZ),
      ]);

      scene.add(new THREE.Line(geometry, projectedMaterial));
    }

    // Connect each distinct point to its projection.
    const projectedPointKeys = new Set<string>();

    for (const point of points) {
      const key = `${point.x.toFixed(5)},${point.y.toFixed(5)},${point.z.toFixed(5)}`;
      if (projectedPointKeys.has(key)) continue;
      projectedPointKeys.add(key);

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(point.x, point.y, projectionZ),
        new THREE.Vector3(point.x, point.y, point.z),
      ]);

      const connector = new THREE.Line(geometry, connectorMaterial);
      connector.computeLineDistances();
      scene.add(connector);
    }

    // Draw every returned point, not just line endpoints.
    for (const point of points) {
      const pointMesh = new THREE.Mesh(
        new THREE.SphereGeometry(5, 12, 12),
        new THREE.MeshBasicMaterial({ color: "#F92C85" })
      );

      pointMesh.position.set(point.x, point.y, point.z);
      scene.add(pointMesh);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;

    let frameId = 0;

    function animate() {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      controls.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => material.dispose());
        }
      });

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [points, lines]);

  return (
    <div
      ref={containerRef}
      className="h-[500px] w-[500px] max-w-full border-4 bg-black border-primary"
    />
  );
}
