"use client"

import { useState, useRef } from "react"
import Image from "next/image"
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
import { Settings, Trash2, X } from "lucide-react"

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
      className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow"
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
  imageUrl?: string
  raidSelections: RaidSelection[]
}

interface CharacterCardProps {
  character: Character
  weekStart: string
  onToggleComplete?: (characterId: string, raidName: string, weekStart: string, isCompleted: boolean) => Promise<void>
  onDelete?: (characterId: string) => void
}

export function CharacterCard({ character, weekStart, onToggleComplete, onDelete }: CharacterCardProps) {
  const [localSelections, setLocalSelections] = useState<RaidSelection[]>(character.raidSelections)
  const [showSettings, setShowSettings] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Debounce refs per raid
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const desiredStateRef = useRef<Record<string, boolean>>({})

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

  function handleToggle(raidName: string) {
    if (!onToggleComplete) return

    // Immediate optimistic flip
    let newState = false
    setLocalSelections((prev) => {
      const current = prev.find((r) => r.raidName === raidName)
      newState = current ? !current.isCompleted : false
      desiredStateRef.current[raidName] = newState
      return prev.map((r) => r.raidName === raidName ? { ...r, isCompleted: newState } : r)
    })

    // Debounce API call — cancel previous pending call for this raid
    if (debounceRef.current[raidName]) {
      clearTimeout(debounceRef.current[raidName])
    }
    debounceRef.current[raidName] = setTimeout(async () => {
      const targetState = desiredStateRef.current[raidName]
      await onToggleComplete(character.id, raidName, weekStart, targetState)
      delete debounceRef.current[raidName]
    }, 400)
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/characters/${character.id}`, { method: "DELETE" })
      if (res.ok) {
        onDelete?.(character.id)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {character.imageUrl ? (
            <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-gray-700 bg-gray-800">
              <Image
                src={character.imageUrl}
                alt={character.name}
                width={48}
                height={48}
                className="object-cover object-top w-full h-full"
              />
            </div>
          ) : (
            <ClassIcon className={character.characterClass} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-white text-base truncate">{character.name}</CardTitle>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-sm font-medium text-blue-400">
                  {character.itemLevel.toLocaleString()}
                </span>
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  className="ml-1 p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  {showSettings ? <X className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{character.characterClass}</p>
          </div>
        </div>

        {showSettings && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-md bg-red-900/60 hover:bg-red-800 border border-red-700/50 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "삭제 중..." : "캐릭터 삭제"}
            </button>
          </div>
        )}
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
                    className="transition-opacity"
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
