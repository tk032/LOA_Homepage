"use client"

import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RaidBadge } from "@/components/RaidBadge"
import { cn } from "@/lib/utils"
import { getRaidGold, MAX_GOLD_RAIDS } from "@/lib/raids"

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

interface CharacterCardProps {
  character: Character
  weekStart: string
  onToggleComplete?: (characterId: string, raidName: string, weekStart: string) => Promise<void>
}

export function CharacterCard({ character, weekStart, onToggleComplete }: CharacterCardProps) {
  const [loadingRaid, setLoadingRaid] = useState<string | null>(null)
  const [localSelections, setLocalSelections] = useState<RaidSelection[]>(
    character.raidSelections
  )

  const completed = localSelections.filter((r) => r.isCompleted).length
  const total = localSelections.length
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Determine gold raids: top MAX_GOLD_RAIDS by gold amount
  const goldRaidNames = new Set(
    [...localSelections]
      .sort((a, b) => getRaidGold(b.raidName) - getRaidGold(a.raidName))
      .slice(0, MAX_GOLD_RAIDS)
      .map((r) => r.raidName)
  )

  const earnedGold = localSelections
    .filter((r) => r.isCompleted && goldRaidNames.has(r.raidName))
    .reduce((sum, r) => sum + getRaidGold(r.raidName), 0)

  const potentialGold = localSelections
    .filter((r) => goldRaidNames.has(r.raidName))
    .reduce((sum, r) => sum + getRaidGold(r.raidName), 0)

  async function handleToggle(raidName: string) {
    if (!onToggleComplete || loadingRaid) return
    setLoadingRaid(raidName)
    try {
      await onToggleComplete(character.id, raidName, weekStart)
      setLocalSelections((prev) =>
        prev.map((r) =>
          r.raidName === raidName ? { ...r, isCompleted: !r.isCompleted } : r
        )
      )
    } finally {
      setLoadingRaid(null)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{character.name}</CardTitle>
          <span className="text-sm font-medium text-blue-400">
            {character.itemLevel.toLocaleString()}
          </span>
        </div>
        <CardDescription className="text-gray-400">
          {character.characterClass}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {total > 0 ? (
          <>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>진행도</span>
              <span>{completed} / {total}</span>
            </div>
            <Progress value={progressPct} className="h-1.5 bg-gray-700" />
            <div className="flex flex-wrap gap-2 pt-1">
              {localSelections.map((selection) => {
                const isGoldRaid = goldRaidNames.has(selection.raidName)
                const gold = getRaidGold(selection.raidName)
                return (
                  <button
                    key={selection.raidName}
                    onClick={() => handleToggle(selection.raidName)}
                    disabled={loadingRaid === selection.raidName}
                    className={cn(
                      "transition-opacity",
                      loadingRaid === selection.raidName && "opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-all",
                        selection.isCompleted
                          ? "bg-gray-700 text-gray-500 border-gray-600 line-through opacity-60"
                          : "cursor-pointer hover:brightness-110"
                      )}
                    >
                      {selection.isCompleted ? (
                        <span className="line-through text-gray-500">
                          {selection.raidName}
                        </span>
                      ) : (
                        <RaidBadge raidName={selection.raidName} />
                      )}
                      {isGoldRaid && gold > 0 && (
                        <span
                          className={cn(
                            "font-normal",
                            selection.isCompleted
                              ? "text-yellow-600"
                              : "text-yellow-400"
                          )}
                        >
                          {gold.toLocaleString()}g
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            {/* Weekly gold summary */}
            {potentialGold > 0 && (
              <div className="pt-1 border-t border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-400">주간 골드</span>
                <span>
                  <span className="text-yellow-400 font-medium">
                    {earnedGold.toLocaleString()}g
                  </span>
                  <span className="text-gray-500">
                    {" "}/ {potentialGold.toLocaleString()}g
                  </span>
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-500">이번 주 레이드가 없습니다.</p>
        )}
      </CardContent>
    </Card>
  )
}
