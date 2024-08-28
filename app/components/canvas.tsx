import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ThreeDCanvas from "./threeD_canvas"; // Import the 3D canvas component

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

const Canvas: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [processedLines, setProcessedLines] = useState<ProcessedLine[]>([]);
  const [isErasing, setIsErasing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#000000";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Delaunay Triangulation lines
        processedLines.forEach(({ x1, y1, x2, y2 }) => {
          context.strokeStyle = "#FFA3CB";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
          context.stroke();
        });

        // Draw points
        points.forEach((point) => {
          context.fillStyle = hoveredPoint && point.x === hoveredPoint.x && point.y === hoveredPoint.y ? "#00FF00" : "#F92C85";
          context.beginPath();
          context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          context.fill();
        });
      }
    }
  }, [points, processedLines, hoveredPoint]);

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (isErasing) {
        // Erase mode: find and remove the closest point
        const newPoints = points.filter(
          (point) => Math.hypot(point.x - x, point.y - y) > 10
        );
        setPoints(newPoints);

        try {
          const response = await axios.post(
            "https://home-python-sdk.onrender.com/triangulation-visualiser/get-delaunay-edges",
            newPoints
          );
          setProcessedLines(response.data);
        } catch (error) {
          console.error("Error sending points:", error);
        }
      } else {
        // Draw mode: add the new point
        const newPoints = [...points, { x, y }];
        setPoints(newPoints);

        try {
          const response = await axios.post(
            "https://home-python-sdk.onrender.com/triangulation-visualiser/get-delaunay-edges",
            newPoints
          );
          setProcessedLines(response.data);
        } catch (error) {
          console.error("Error sending points:", error);
        }
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const closestPoint = points.find(
        (point) => Math.hypot(point.x - x, point.y - y) <= 10
      );

      setHoveredPoint(closestPoint || null);
    }
  };

  const toggleEraseMode = () => {
    setIsErasing(!isErasing);
  };

  return (
    <div className="h-full pt-20">
      <div className="font-bold text-primary text-3xl pl-20 pb-20">
        <div className="text-6xl">Hello,</div>Visualise your triangles here!
      </div>
      <div className="flex flex-col justify-center items-center">
        <div className="flex flex-row items">
          <div>
            <div className="text-center mr-20 text-primary text-xl font-extralight pb-5">
              Place Your Points here!
            </div>
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              style={{ width: "500px", height: "500px" }}
              className="border-4 border-primary mb-4 mr-20"
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
            ></canvas>
            <div className="">
            <button
          onClick={toggleEraseMode}
          className={`bg-primary text-background  px-4 py-2 rounded ${
            isErasing ? "bg-primary" : "bg-primary"
          }`}
        >
          {isErasing ? "Draw" : "Erase"}
        </button>
            </div>
            
          </div>
        
          <div>
            <div className="text-center ml-40 text-primary text-xl font-extralight pb-4">
              Convex Hull
            </div>
            <ThreeDCanvas points={points} processedLines={processedLines} />
          </div>
        </div>

    
      </div>
    </div>
  );
};

export default Canvas;
