import * as fs from 'fs';

// Define types
type Coordinate = {
  "x-coord": string;
  "y-coord": string;
};

type DataPoint = {
  id: string;
  coordinates: Coordinate;
  timeStamp: string;
};

type Point = {
  x: number;
  y: number;
  timeStamp: Date;
  area?: number; 
};

// Visvalingam-Whyatt algorithm
function simplifyPathVW(points: Point[], threshold: number): Point[] {
  if (points.length < 3) return points;


  for (let i = 1; i < points.length - 1; i++) {
    points[i].area = triangleArea(points[i - 1], points[i], points[i + 1]);
  }

  while (true) {

    let minArea = Infinity;
    let minIndex = -1;
    for (let i = 1; i < points.length - 1; i++) {
      if (points[i].area !== undefined && points[i].area! < minArea) {
        minArea = points[i].area!;
        minIndex = i;
      }
    }

    if (minArea >= threshold) break;

    points.splice(minIndex, 1);

    if (minIndex > 1) points[minIndex - 1].area = triangleArea(points[minIndex - 2], points[minIndex - 1], points[minIndex]);
    if (minIndex < points.length - 1) points[minIndex].area = triangleArea(points[minIndex - 1], points[minIndex], points[minIndex + 1]);
  }

  return points;
}

function triangleArea(p1: Point, p2: Point, p3: Point): number {
  return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
}

export function createTrailsFromFile(filePath: string, threshold: number): Record<string, Point[]> {
  const rawData = fs.readFileSync(filePath, 'utf8');
  const data: DataPoint[] = JSON.parse(rawData);


  const groupedData: Record<string, DataPoint[]> = data.reduce((acc, point) => {
    acc[point.id] = acc[point.id] || [];
    acc[point.id].push(point);
    return acc;
  }, {} as Record<string, DataPoint[]>);

  const trails: Record<string, Point[]> = {};

  for (const id in groupedData) {
    const points: Point[] = groupedData[id].map(point => ({
      x: parseFloat(point.coordinates["x-coord"]),
      y: parseFloat(point.coordinates["y-coord"]),
      timeStamp: new Date(point.timeStamp)
    }));

    points.sort((a, b) => a.timeStamp.getTime() - b.timeStamp.getTime());

    trails[id] = simplifyPathVW(points, threshold);
  }

  return trails;
}

