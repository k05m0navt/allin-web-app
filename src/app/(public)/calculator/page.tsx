import { PointsCalculator } from "@/components/ScoreCalculator/points-calculator";

export default function CalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Tournament Points Calculator
      </h1>
      <div className="flex justify-center">
        <PointsCalculator />
      </div>
      <div className="mt-8 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-4">How Points Work</h2>
        <p className="text-gray-600">
          Our tournament points system rewards consistent performance. The
          better you place in a tournament, the more points you earn. Points
          accumulate across tournaments to determine overall club rankings.
        </p>
      </div>
    </div>
  );
}
