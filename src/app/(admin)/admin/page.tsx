"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { authService, supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

interface PlayerWithUserDetails {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<PlayerWithUserDetails[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const router = useRouter();

  // Validation function
  const validateForm = () => {
    if (!newPlayerName.trim()) {
      toast.error("Player name is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPlayerEmail)) {
      toast.error("Invalid email address");
      return false;
    }

    return true;
  };

  const handleEditPlayer = async (playerId: string) => {
    try {
      // Placeholder for edit functionality
      toast.info(`Editing player with ID: ${playerId}`);
      // Future implementation will likely involve:
      // 1. Opening a modal or navigating to an edit page
      // 2. Fetching current player details
      // 3. Allowing user to modify player information
    } catch (error) {
      console.error("Error editing player:", error);
      toast.error("Failed to edit player");
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    try {
      // Show confirmation dialog
      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${playerName}?`
      );

      if (!confirmDelete) return;

      // Soft delete or actual deletion logic
      await prisma.player.delete({
        where: { id: playerId },
      });

      // Remove player from local state
      setPlayers(players.filter((p) => p.id !== playerId));

      toast.success(`Player ${playerName} deleted successfully`);
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error("Failed to delete player");
    }
  };

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
          include: {
            user: {
              select: {
                email: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Transform players to include user details
        const transformedPlayers: PlayerWithUserDetails[] = fetchedPlayers.map(
          (player: any) => ({
            id: player.id,
            name: player.name,
            email: player.user.email,
            createdAt: player.user.createdAt,
          })
        );

        setPlayers(transformedPlayers);
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

    // Validate form before submission
    if (!validateForm()) return;

    try {
      // Create user in Supabase and Prisma
      const { data, error } = await authService.signUp(
        newPlayerEmail,
        "temporaryPassword123!",
        newPlayerName
      );

      if (error) {
        toast.error(error.message || "Error creating user");
        return;
      }

      // Create player linked to the new user
      const newPlayer = await prisma.player.create({
        data: {
          name: newPlayerName,
          userId: data.user?.id || "",
        },
        include: {
          user: true,
        },
      });

      // Transform player data for the UI
      const playerWithUserDetails: PlayerWithUserDetails = {
        id: newPlayer.id,
        name: newPlayer.name,
        email: newPlayer.user.email,
        createdAt: newPlayer.user.createdAt,
      };

      setPlayers([playerWithUserDetails, ...players]);
      setNewPlayerName("");
      setNewPlayerEmail("");

      // Show success toast
      toast.success("Player added successfully");
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error("Failed to add player");
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster richColors />

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
                <th className="text-left p-2 border-b">Name</th>
                <th className="text-left p-2 border-b">Email</th>
                <th className="text-left p-2 border-b">Created At</th>
                <th className="text-right p-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr
                  key={player.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2 border-b">{player.name}</td>
                  <td className="p-2 border-b">{player.email}</td>
                  <td className="p-2 border-b">
                    {new Date(player.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 border-b text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlayer(player.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleDeletePlayer(player.id, player.name)
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
