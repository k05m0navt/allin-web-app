// File: src/components/points-calculator.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const POINT_SYSTEM = {
  1: 10, // 1st place
  2: 7, // 2nd place
  3: 5, // 3rd place
  4: 3, // 4th place
  5: 2, // 5th place
  6: 1, // 6th place and below
};

export function PointsCalculator() {
  const [placement, setPlacement] = useState<number | "">("");
  const [points, setPoints] = useState<number | null>(null);

  const calculatePoints = () => {
    if (placement === "" || placement < 1 || placement > 6) {
      setPoints(null);
      return;
    }

    const calculatedPoints =
      POINT_SYSTEM[placement as keyof typeof POINT_SYSTEM] || 0;
    setPoints(calculatedPoints);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Tournament Points Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="number"
            min={1}
            max={6}
            placeholder="Enter Tournament Placement (1-6)"
            value={placement}
            onChange={(e) =>
              setPlacement(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <Button onClick={calculatePoints} className="w-full">
            Calculate Points
          </Button>
          {points !== null && (
            <div className="text-center">
              <p className="text-xl font-bold">Points Earned: {points}</p>
            </div>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <h4 className="font-semibold mb-2">Point System:</h4>
          <ul>
            {Object.entries(POINT_SYSTEM).map(([place, points]) => (
              <li key={place}>
                {place} Place: {points} points
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
