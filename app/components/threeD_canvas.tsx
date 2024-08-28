"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


interface Point {
  x: number;
  y: number;
}

interface ProcessedLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ThreeDCanvasProps {
  points: Point[];
  processedLines: ProcessedLine[];
}

const normalizeZCoordinates = (zs: number[], targetMin = -250, targetMax = 250) => {
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const meanZ = (minZ + maxZ) / 2;
  const scale = (targetMax - targetMin) / (maxZ - minZ);
  
  return zs.map(z => (z - meanZ) * scale + (targetMin + targetMax) / 2);
};

const ThreeDCanvas: React.FC<ThreeDCanvasProps> = ({ points, processedLines }) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const width = 500;
    const height = 500;

    const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    const centeredPoints = points.map(p => ({
      x: p.x - meanX,
      y: p.y - meanY
    }));

    const centeredLines = processedLines.map(line => ({
      x1: line.x1 - meanX,
      y1: line.y1 - meanY,
      x2: line.x2 - meanX,
      y2: line.y2 - meanY
    }));

    const allZ = centeredPoints.map(p => p.x ** 2 + p.y ** 2).concat(
      centeredLines.flatMap(line => [
        line.x1 ** 2 + line.y1 ** 2,
        line.x2 ** 2 + line.y2 ** 2
      ])
    );

    const normalizedZ = normalizeZCoordinates(allZ);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.x = 500;
    camera.position.z = 500;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    if (canvasRef.current) {
      canvasRef.current.appendChild(renderer.domElement);
    }

    // Rotate the entire scene 45 degrees around the Y-axis
    scene.rotation.x = -Math.PI / 2;
    const scale = 1;

    // Calculate the minimum z-value to set the projection plane
    const minZ = Math.min(...normalizedZ);
    const projectionZ = minZ - 50; // Ensure the projection is below the lowest point

    // Render 3D convex hull points and lines
    centeredPoints.forEach((point, index) => {
      const geometry = new THREE.SphereGeometry(5, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: "#F92C85" });
      const sphere = new THREE.Mesh(geometry, material);

      const z = normalizedZ[index];
      sphere.position.set(point.x * scale, point.y * scale, z * scale);

      scene.add(sphere);
    });

    centeredLines.forEach(({ x1, y1, x2, y2 }, index) => {
      const material = new THREE.LineBasicMaterial({ color: "#FFA3CB" });
      const points = [];

      const z1 = normalizedZ[centeredPoints.length + index * 2];
      const z2 = normalizedZ[centeredPoints.length + index * 2 + 1];

      points.push(new THREE.Vector3(x1 * scale, y1 * scale, z1 * scale));
      points.push(new THREE.Vector3(x2 * scale, y2 * scale, z2 * scale));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);

      scene.add(line);
    });

    // Render 2D Delaunay triangulation on projectionZ plane (below the lowest point)
    centeredLines.forEach(({ x1, y1, x2, y2 }) => {
      const material = new THREE.LineBasicMaterial({ color: "#FFC7DF" });
      const points = [];

      points.push(new THREE.Vector3(x1 * scale, y1 * scale, projectionZ * scale));
      points.push(new THREE.Vector3(x2 * scale, y2 * scale, projectionZ * scale));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);

      scene.add(line);
    });

    // Render projection lines as dotted lines
    centeredPoints.forEach((point, index) => {
      const material = new THREE.LineDashedMaterial({
        color: 0xFFC7DF,
        dashSize: 3,
        gapSize: 2,
      });
      const points = [];

      const z = normalizedZ[index];

      points.push(new THREE.Vector3(point.x * scale, point.y * scale, projectionZ * scale));
      points.push(new THREE.Vector3(point.x * scale, point.y * scale, z * scale));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances(); // Required for dashed lines

      scene.add(line);
    });

    // Set up controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 10000;
    controls.maxPolarAngle = Math.PI / 2;

    function animate() {
      requestAnimationFrame(animate);
      controls.update(); // Update controls
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, [points, processedLines]);

  return <div ref={canvasRef} className="border-4 border-primary ml-40 mb-4" />;
};

export default ThreeDCanvas;
