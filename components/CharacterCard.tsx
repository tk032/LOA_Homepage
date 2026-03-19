"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RaidBadge } from "@/components/RaidBadge"
import { RaidEditor } from "@/components/RaidEditor"
import { cn } from "@/lib/utils"
import { getRaidGold, MAX_GOLD_RAIDS } from "@/lib/raids"
import { ChevronUp, ChevronDown, Pencil } from "lucide-react"

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

function ClassPortrait({ className }: { className: string }) {
  const color = CLASS_COLOR[className] ?? "#6b7280"
  return (
    <div
      className="w-16 rounded-lg flex items-center justify-center text-xl font-bold text-white shrink-0 shadow self-stretch"
      style={{ backgroundColor: color, minHeight: "5rem" }}
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
  editMode?: boolean
  isSelected?: boolean
  onSelect?: (characterId: string) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onMoveUp?: (characterId: string) => void
  onMoveDown?: (characterId: string) => void
  onRaidUpdate?: (characterId: string, raids: RaidSelection[]) => void
}

export function CharacterCard({
  character,
  weekStart,
  onToggleComplete,
  editMode = false,
  isSelected = false,
  onSelect,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onRaidUpdate,
}: CharacterCardProps) {
  const [localSelections, setLocalSelections] = useState<RaidSelection[]>(character.raidSelections)
  const [showRaidEditor, setShowRaidEditor] = useState(false)

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
    if (!onToggleComplete || editMode) return
    let newState = false
    setLocalSelections((prev) => {
      const current = prev.find((r) => r.raidName === raidName)
      newState = current ? !current.isCompleted : false
      desiredStateRef.current[raidName] = newState
      return prev.map((r) => r.raidName === raidName ? { ...r, isCompleted: newState } : r)
    })
    if (debounceRef.current[raidName]) clearTimeout(debounceRef.current[raidName])
    debounceRef.current[raidName] = setTimeout(async () => {
      await onToggleComplete(character.id, raidName, weekStart, desiredStateRef.current[raidName])
      delete debounceRef.current[raidName]
    }, 400)
  }

  function handleRaidEditorSave(raids: string[]) {
    const newSelections: RaidSelection[] = raids.map((raidName) => {
      const existing = localSelections.find((r) => r.raidName === raidName)
      return existing ?? { id: `tmp-${raidName}`, raidName, isCompleted: false, weekStart }
    })
    setLocalSelections(newSelections)
    setShowRaidEditor(false)
    onRaidUpdate?.(character.id, newSelections)
  }

  return (
    <Card className={cn(
      "bg-gray-900 border-gray-700 transition-colors overflow-hidden",
      editMode && isSelected && "border-blue-500 bg-gray-800/80"
    )}>
      {/* Top section: portrait + info */}
      <div className="flex gap-0">
        {/* Portrait image */}
        <div className="relative shrink-0">
          {editMode && (
            <div className="absolute top-1.5 left-1.5 z-10">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect?.(character.id)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          )}
          {character.imageUrl ? (
            <div className="w-20 h-24 overflow-hidden bg-gray-800 border-r border-gray-700">
              <Image
                src={character.imageUrl}
                alt={character.name}
                width={80}
                height={96}
                className="object-cover object-top w-full h-full"
              />
            </div>
          ) : (
            <div className="w-20 h-24 border-r border-gray-700 flex items-center justify-center"
              style={{ backgroundColor: CLASS_COLOR[character.characterClass] ?? "#6b7280" }}>
              <span className="text-2xl font-bold text-white">{character.characterClass.slice(0, 1)}</span>
            </div>
          )}
        </div>

        {/* Character info */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1">
              <span className="font-bold text-white text-sm leading-tight truncate">{character.name}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Pencil always visible */}
                <button
                  onClick={() => setShowRaidEditor((v) => !v)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    showRaidEditor
                      ? "text-blue-400 bg-gray-700"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
                  )}
                  title="레이드 편집"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {/* ↑↓ only in edit mode */}
                {editMode && (
                  <>
                    <button
                      onClick={() => onMoveUp?.(character.id)}
                      disabled={!canMoveUp}
                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onMoveDown?.(character.id)}
                      disabled={!canMoveDown}
                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{character.characterClass}</p>
            <p className="text-xs font-medium text-blue-400 mt-0.5">{character.itemLevel.toLocaleString()}</p>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{completed}/{total}</span>
                {potentialGold > 0 && (
                  <span>
                    <span className="text-yellow-400 font-medium">{earnedGold.toLocaleString()}g</span>
                    <span className="text-gray-600"> / {potentialGold.toLocaleString()}g</span>
                  </span>
                )}
              </div>
              <Progress value={progressPct} className="h-1 bg-gray-700" />
            </div>
          )}
        </div>
      </div>

      <CardContent className="px-3 pb-3 pt-2 space-y-2">
        {/* Inline raid editor */}
        {showRaidEditor && (
          <RaidEditor
            characterId={character.id}
            itemLevel={character.itemLevel}
            weekStart={weekStart}
            currentRaids={localSelections.map((r) => r.raidName)}
            onSave={handleRaidEditorSave}
            onCancel={() => setShowRaidEditor(false)}
          />
        )}

        {/* Raid list - one per line */}
        {!showRaidEditor && total > 0 && (
          <div className="flex flex-col gap-1">
            {localSelections.map((selection) => {
              const isGoldRaid = goldRaidNames.has(selection.raidName)
              const gold = getRaidGold(selection.raidName)
              return (
                <button
                  key={selection.raidName}
                  onClick={() => handleToggle(selection.raidName)}
                  disabled={editMode}
                  className="flex items-center justify-between w-full rounded-md border px-2 py-1 text-xs font-medium transition-all disabled:cursor-default"
                  style={{}}
                >
                  <span className={cn(
                    "flex items-center gap-1",
                    selection.isCompleted ? "line-through text-gray-500" : ""
                  )}>
                    {selection.isCompleted ? (
                      <span className="text-gray-500">{selection.raidName}</span>
                    ) : (
                      <RaidBadge raidName={selection.raidName} />
                    )}
                  </span>
                  {isGoldRaid && gold > 0 && (
                    <span className={cn(
                      "font-normal ml-auto",
                      selection.isCompleted ? "text-yellow-700" : "text-yellow-400"
                    )}>
                      {gold.toLocaleString()}g
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {!showRaidEditor && total === 0 && (
          <p className="text-xs text-gray-500">이번 주 레이드가 없습니다.</p>
        )}
      </CardContent>
    </Card>
  )
}
