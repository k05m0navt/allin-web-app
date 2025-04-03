import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RulesPage() {
  const rules = [
    {
      title: "Tournament Structure",
      description:
        "Regular tournaments with fixed buy-in and prize pool distribution.",
    },
    {
      title: "Scoring System",
      description:
        "Points awarded based on tournament placement: 1st place gets 10 points, 2nd place 7 points, 3rd place 5 points, and so on.",
    },
    {
      title: "Eligibility",
      description: "Open to registered members. Players must be 18 or older.",
    },
    {
      title: "Fair Play",
      description:
        "Any form of cheating will result in immediate disqualification.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All In Poker Club Rules</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {rules.map((rule, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{rule.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{rule.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
        <p>
          Want to learn more? Join our Telegram channel for latest updates and
          discussions!
          <a
            href="https://t.me/allinpokerclub"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 hover:underline"
          >
            Telegram Channel
          </a>
        </p>
      </div>
    </div>
  );
}
