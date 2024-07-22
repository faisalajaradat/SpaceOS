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
};

function simplifyPath(points: Point[], epsilon: number): Point[] {
    if (points.length < 3) return points;
  
    const dmax = points.reduce((max, point, i) => {
      if (i === 0 || i === points.length - 1) return max;
      const d = perpendicularDistance(point, points[0], points[points.length - 1]);
      return d > max ? d : max;
    }, 0);
  
    if (dmax > epsilon) {
      const index = points.findIndex(point => {
        const d = perpendicularDistance(point, points[0], points[points.length - 1]);
        return d === dmax;
      });
  
      const firstSegment = simplifyPath(points.slice(0, index + 1), epsilon);
      const secondSegment = simplifyPath(points.slice(index), epsilon);
  
      return firstSegment.slice(0, -1).concat(secondSegment);
    } else {
      return [points[0], points[points.length - 1]];
    }
  }
  
  function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const { x: x1, y: y1 } = lineStart;
    const { x: x2, y: y2 } = lineEnd;
    const { x, y } = point;
  
    const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
  
    return numerator / denominator;
  }
  
  export function createTrailsFromFile(filePath: string, epsilon: number): Record<string, Point[]> {
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
  
      trails[id] = simplifyPath(points, epsilon);
    }
  
    return trails;
  }
  
  







