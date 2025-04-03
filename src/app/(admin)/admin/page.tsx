"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authService, supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchPlayers = async () => {
      try {
        const currentUser = await authService.getCurrentUser();

        if (!currentUser) {
          router.push("/login");
          return;
        }

        // Optional: Add role-based access control
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userRole = session?.user?.user_metadata?.role;

        if (userRole !== "ADMIN") {
          router.push("/login");
          return;
        }

        // Fetch players from database
        const fetchedPlayers = await prisma.player.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        setPlayers(fetchedPlayers);
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking user or fetching players:", error);
        router.push("/login");
      }
    };

    checkUserAndFetchPlayers();
  }, [router]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create user in Supabase
      const { data, error } = await authService.signUp(
        newPlayerEmail,
        "temporaryPassword123!",
        newPlayerName
      );

      if (error) {
        console.error("Error creating user:", error);
        return;
      }

      // Create player in Prisma
      const newPlayer = await prisma.player.create({
        data: {
          name: newPlayerName,
          email: newPlayerEmail,
          supabaseId: data.user?.id,
        },
      });

      setPlayers([...players, newPlayer]);
      setNewPlayerName("");
      setNewPlayerEmail("");
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Player</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <Input
              placeholder="Player Name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Player Email"
              value={newPlayerEmail}
              onChange={(e) => setNewPlayerEmail(e.target.value)}
              required
            />
            <Button type="submit">Add Player</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Player List</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-t">
                  <td>{player.name}</td>
                  <td>{player.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
