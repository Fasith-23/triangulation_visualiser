"use client";

import { useEffect, useRef, useState } from "react";
import ThreeDCanvas from "./threeDCanvas";
import {
  addPoint,
  deleteAllPoints,
  deletePointAt,
  getSessionState,
} from "../lib/triangulationApi";

import type {
  CanvasResponse,
  Point,
  ProcessedLine,
  ProcessedPoint,
} from "../lib/geometry";

const SIZE = 500;
const POINT_RADIUS = 5;

export default function Canvas() {
  const pointCanvasRef = useRef<HTMLCanvasElement>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);

  const [points, setPoints] = useState<ProcessedPoint[]>([]);
  const [lines, setLines] = useState<ProcessedLine[]>([]);
  const [isErasing, setIsErasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyResponse(response: CanvasResponse) {
    setPoints(response.points);
    setLines(response.lines);
  }

  function getCanvasPoint(
    event: React.MouseEvent<HTMLCanvasElement>
  ): Point | null {
    const canvas = pointCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  async function handleCanvasClick(
    event: React.MouseEvent<HTMLCanvasElement>
  ) {
    const point = getCanvasPoint(event);
    if (!point) return;

    setError(null);

    try {
      const response = isErasing
        ? await deletePointAt(point.x, point.y)
        : await addPoint(point);

      applyResponse(response);
    } catch {
      setError(
        isErasing
          ? "Could not erase a point near that location."
          : "Could not add the point."
      );
    }
  }

  async function handleDeleteAll() {
    setError(null);

    try {
      const response = await deleteAllPoints();
      applyResponse(response);
    } catch {
      setError("Could not delete all points.");
    }
  }

  // Draw the points returned by the backend.
  useEffect(() => {
    const canvas = pointCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#F92C85";

    for (const point of points) {
      context.beginPath();
      context.arc(point.x, point.y, POINT_RADIUS, 0, 2 * Math.PI);
      context.fill();
    }
  }, [points]);

  // Draw the triangulation lines returned by the backend.
  useEffect(() => {
    const canvas = lineCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#FFA3CB";
    context.lineWidth = 1;

    for (const line of lines) {
      context.beginPath();
      context.moveTo(line.x1, line.y1);
      context.lineTo(line.x2, line.y2);
      context.stroke();
    }
  }, [lines]);

  useEffect(() => {
    let cancelled = false;
    
    getSessionState()
      .then((response) => {
        if (cancelled) return;
        setPoints(response.points);
        setLines(response.lines);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load your session.");
        }
      });
    
    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <section className="h-full pt-10">
      <h1 className="pb-10 text-4xl text-center font-bold text-primary ">
        <span className="block text-6xl pb-2">Hello,</span>
        Visualise your triangles here!
      </h1>

      <div className="mx-auto w-full max-w-6xl px-4">
  <div className="grid grid-cols-1 justify-items-center gap-10 lg:grid-cols-2">
    <div className="w-full max-w-[500px]">
      <p className="pb-1 text-center text-xl font-medium text-primary">
        Delaunay Triangulation
      </p>
      <p className="pb-5 text-center text-md font-light text-primary">
        (Tap / Click to Place your points!)
      </p>

      <div className="relative aspect-square w-full border-4 border-primary">
        <canvas
          ref={lineCanvasRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 h-full w-full bg-black"
        />
        <canvas
          ref={pointCanvasRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 h-full w-full"
          onClick={handleCanvasClick}
          aria-label="Point drawing canvas"
        />
      </div>

      <div className="flex flex-wrap pb-5 justify-center gap-20 pt-4">
        <button
          type="button"
          onClick={() => setIsErasing((value) => !value)}
          aria-pressed={isErasing}
          className="rounded bg-primary px-4 py-2 text-background"
        >
          {isErasing ? "Draw" : "Erase"}
        </button>

        <button
          type="button"
          onClick={handleDeleteAll}
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Delete
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-center text-red-500">
          {error}
        </p>
      )}
    </div>

    <div className="w-full max-w-[500px]">
      <p className="pb-1 text-center text-xl font-medium text-primary">
        3D Convex Hull
      </p>
      <p className="pb-5 text-center text-md font-light text-primary">
        (Pinch / Scroll to zoom and Drag to rotate)
      </p>
      <ThreeDCanvas points={points} lines={lines} />
    </div>
  </div>
</div>

    </section>
  );
}
