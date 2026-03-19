"use client"

import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RaidBadge } from "@/components/RaidBadge"
import { cn } from "@/lib/utils"
import { getRaidGold, MAX_GOLD_RAIDS } from "@/lib/raids"

// Class archetype color mapping
const CLASS_COLOR: Record<string, string> = {
  워로드: "#e74c3c", 버서커: "#c0392b", 홀리나이트: "#f39c12", 슬레이어: "#e67e22",
  배틀마스터: "#e67e22", 인파이터: "#d35400", 기공사: "#f39c12", 창술사: "#e74c3c",
  스트라이커: "#e74c3c", 브레이커: "#c0392b",
  데빌헌터: "#b8860b", 블래스터: "#e67e22", 호크아이: "#2ecc71", 스카우터: "#16a085",
  건슬링어: "#b8860b",
  바드: "#9b59b6", 소서리스: "#3498db", 아르카나: "#8e44ad", 서머너: "#2980b9",
  암살자: "#555", 스피어베어러: "#7f8c8d", 블레이드: "#1abc9c", 데모닉: "#c0392b",
  도화가: "#e91e8c", 기상술사: "#00bcd4",
}

function ClassIcon({ className }: { className: string }) {
  const color = CLASS_COLOR[className] ?? "#6b7280"
  return (
    <div
      className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow"
      style={{ backgroundColor: color }}
      title={className}
    >
      {className.slice(0, 1)}
    </div>
  )
}

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
    // Optimistic update: flip immediately
    setLocalSelections((prev) =>
      prev.map((r) => r.raidName === raidName ? { ...r, isCompleted: !r.isCompleted } : r)
    )
    try {
      await onToggleComplete(character.id, raidName, weekStart)
    } catch {
      // Revert on error
      setLocalSelections((prev) =>
        prev.map((r) => r.raidName === raidName ? { ...r, isCompleted: !r.isCompleted } : r)
      )
    } finally {
      setLoadingRaid(null)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <ClassIcon className={character.characterClass} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-white text-base truncate">{character.name}</CardTitle>
              <span className="text-sm font-medium text-blue-400 shrink-0">
                {character.itemLevel.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{character.characterClass}</p>
          </div>
        </div>
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
                            selection.isCompleted ? "text-yellow-600" : "text-yellow-400"
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
