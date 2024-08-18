"use client";

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Point {
  x: number;
  y: number;
}

type ProcessedPoint = [number, number, number,number, number, number];

const Canvas: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [processedPoints, setProcessedPoints] = useState<ProcessedPoint[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        // Set the canvas background color
        context.fillStyle = '#FFFAE5';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw original points
        points.forEach(point => {
          context.fillStyle = '#D1D5DB'; // Gray color for the points
          context.beginPath();
          context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          context.fill();
        });
        
        
        // Optionally, you can draw lines for processed points or any other visualization
        processedPoints.forEach(([x1, y1,z1, x2, y2,z2]) => {
          context.strokeStyle = '#FF5733'; // Color for processed points
          context.beginPath();
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
          context.stroke();
        });
      }
    }
  }, [points, processedPoints]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setPoints([...points, { x, y }]);
    }
  };

  const handleSendPoints = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5001/triangulation-visualiser/get-delaunay-edges', { points });
      console.log('Processed points received:', response.data);
      setProcessedPoints(response.data);
    } catch (error) {
      console.error('Error sending points:', error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="border border-gray-300 mb-4"
        onClick={handleCanvasClick}
      ></canvas>
      
      <button
        onClick={handleSendPoints}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Send Points
      </button>
      <div className="bg-gray-100 p-4 w-1/2 mt-4">
        <h2 className="text-lg font-semibold mb-2">Processed Points:</h2>
        <ul>
          {processedPoints.map(([x1, y1,z1, x2, y2,z2], index) => (
            <li key={index} className="text-gray-800">
              {`(${x1.toFixed(2)}, ${y1.toFixed(2)}, ${x2.toFixed(2)}, ${y2.toFixed(2)})`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Canvas;
