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
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const originalCanvas = originalCanvasRef.current;
    if (originalCanvas) {
      const context = originalCanvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, originalCanvas.width, originalCanvas.height);

        points.forEach((point) => {
          context.fillStyle = "#F92C85";
          context.beginPath();
          context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          context.fill();
        });
      }
    }

    const processedCanvas = processedCanvasRef.current;
    if (processedCanvas) {
      const context = processedCanvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, processedCanvas.width, processedCanvas.height);

        processedLines.forEach(({ x1, y1, x2, y2 }) => {
          context.strokeStyle = "#FFA3CB";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
          context.stroke();
        });

        points.forEach((point) => {
          context.fillStyle = "#F92C85";
          context.beginPath();
          context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          context.fill();
        });
      }
    }
  }, [points, processedLines]);

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = originalCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Add the new point
      const newPoints = [...points, { x, y }];
      setPoints(newPoints);

      try {
        // Call API to get the updated Delaunay triangulation
        const response = await axios.post(
          "https://home-python-sdk.onrender.com/triangulation-visualiser/get-delaunay-edges",
          newPoints
        );
        setProcessedLines(response.data);
      } catch (error) {
        console.error("Error sending points:", error);
      }
    }
  };

  return (
    <div className="h-screen pt-20">
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
              ref={originalCanvasRef}
              width={350}
              height={350}
              style={{ width: "350px", height: "350px" }}
              className="border-4 border-primary mb-4 mr-20"
              onClick={handleCanvasClick}
            ></canvas>
          </div>

          <div>
            <div className="text-center ml-20 text-primary text-xl font-extralight pb-5">
              Delaunay Triangulation
            </div>
            <canvas
              ref={processedCanvasRef}
              width={350}
              height={350}
              style={{ width: "350px", height: "350px" }}
              className="border-4 border-primary ml-20 mb-4"
            ></canvas>
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
