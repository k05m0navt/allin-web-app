import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const features = [
    {
      title: "Tournament Tracking",
      description:
        "Keep track of all tournament results and player performances.",
    },
    {
      title: "Points System",
      description: "Earn points based on your tournament rankings.",
    },
    {
      title: "Player Profiles",
      description: "View detailed statistics and tournament history.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to All In Poker Club
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your ultimate platform for poker tournament management and tracking
        </p>
        <div className="flex justify-center space-x-4">
          <Button asChild>
            <Link href="/scoreboard">View Scoreboard</Link>
          </Button>
          <Button asChild>
            <Link href="/tournaments">View Tournaments</Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
