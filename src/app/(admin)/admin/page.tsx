"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

export default function AdminPage() {
  const [players, setPlayers] = useState([
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" }
  ]);

  const [newPlayer, setNewPlayer] = useState({ name: "", email: "" });

  const handleAddPlayer = () => {
    if (newPlayer.name && newPlayer.email) {
      setPlayers([
        ...players, 
        { 
          id: (players.length + 1).toString(), 
          ...newPlayer 
        }
      ]);
      setNewPlayer({ name: "", email: "" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Player Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Add New Player</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Player</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input 
                    placeholder="Player Name" 
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer, 
                      name: e.target.value
                    })}
                  />
                  <Input 
                    placeholder="Player Email" 
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer, 
                      email: e.target.value
                    })}
                  />
                  <Button onClick={handleAddPlayer}>
                    Save Player
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Current Players</h3>
              {players.map(player => (
                <div 
                  key={player.id} 
                  className="flex justify-between items-center p-2 border-b"
                >
                  <span>{player.name}</span>
                  <span className="text-gray-500">{player.email}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tournament Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Create New Tournament</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}