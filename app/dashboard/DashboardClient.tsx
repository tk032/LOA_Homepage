"use client"

import { useState } from "react"
import { CharacterCard } from "@/components/CharacterCard"

interface RaidSelection {
  id: string
  raidName: string
  isCompleted: boolean
  weekStart: string
}

interface Character {
  id: string
  name: string
  characterClass: string
  itemLevel: number
  raidSelections: RaidSelection[]
}

interface DashboardClientProps {
  initialCharacters: Character[]
  weekStart: string
}

export function DashboardClient({ initialCharacters, weekStart }: DashboardClientProps) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)

  async function handleToggleComplete(
    characterId: string,
    raidName: string,
    ws: string
  ) {
    const res = await fetch(`/api/characters/${characterId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raidName, weekStart: ws }),
    })

    if (!res.ok) {
      console.error("Failed to toggle completion")
      return
    }

    const updated = await res.json()

    setCharacters((prev) =>
      prev.map((c) => {
        if (c.id !== characterId) return c
        return {
          ...c,
          raidSelections: c.raidSelections.map((r) =>
            r.raidName === raidName
              ? { ...r, isCompleted: updated.isCompleted }
              : r
          ),
        }
      })
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          weekStart={weekStart}
          onToggleComplete={handleToggleComplete}
        />
      ))}
    </div>
  )
}
