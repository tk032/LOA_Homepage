"use client"

import { useState, useRef } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RaidEditor } from "@/components/RaidEditor"
import { cn } from "@/lib/utils"
import { getRaidGold, isRaidBound, getRaidGroup, RAID_GROUP_COLORS } from "@/lib/raids"
import { Pencil, RotateCcw, Coins } from "lucide-react"

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

interface RaidSelection {
  id: string
  raidName: string
  isCompleted: boolean
  isGoldTarget: boolean
  weekStart: string
}

interface Character {
  id: string
  name: string
  characterClass: string
  itemLevel: number
  combatPower?: number
  imageUrl?: string
  isGoldCharacter: boolean
  raidSelections: RaidSelection[]
}

interface CharacterCardProps {
  character: Character
  weekStart: string
  onToggleComplete?: (characterId: string, raidName: string, weekStart: string, isCompleted: boolean) => Promise<void>
  onRaidUpdate?: (characterId: string, raids: RaidSelection[]) => void
  onGoldCharacterChange?: (characterId: string, isGold: boolean) => void
  onGoldTargetChange?: (characterId: string, raidName: string, isGoldTarget: boolean) => void
  editMode?: boolean
  isSelected?: boolean
  onSelect?: (characterId: string) => void
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

export function CharacterCard({
  character,
  weekStart,
  onToggleComplete,
  onRaidUpdate,
  onGoldCharacterChange,
  onGoldTargetChange,
  editMode = false,
  isSelected = false,
  onSelect,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CharacterCardProps) {
  const [localSelections, setLocalSelections] = useState<RaidSelection[]>(character.raidSelections)
  const [localIsGoldCharacter, setLocalIsGoldCharacter] = useState(character.isGoldCharacter)
  const [showRaidEditor, setShowRaidEditor] = useState(false)
  const [localItemLevel, setLocalItemLevel] = useState<number>(character.itemLevel)
  const [localCombatPower, setLocalCombatPower] = useState<number>(character.combatPower ?? 0)
  const [localImageUrl, setLocalImageUrl] = useState<string | undefined>(character.imageUrl)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [goldToggleError, setGoldToggleError] = useState("")

  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const desiredStateRef = useRef<Record<string, boolean>>({})

  const completed = localSelections.filter((r) => r.isCompleted).length
  const total = localSelections.length
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  const goldTargets = localSelections.filter((r) => r.isGoldTarget)
  const goldTargetNames = new Set(goldTargets.map((r) => r.raidName))

  const earnedGold = localSelections
    .filter((r) => r.isCompleted && goldTargetNames.has(r.raidName))
    .reduce((sum, r) => sum + getRaidGold(r.raidName), 0)
  const earnedBoundGold = localSelections
    .filter((r) => r.isCompleted && goldTargetNames.has(r.raidName) && isRaidBound(r.raidName))
    .reduce((sum, r) => sum + getRaidGold(r.raidName), 0)
  const potentialGold = localSelections
    .filter((r) => goldTargetNames.has(r.raidName))
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

  async function handleToggleGoldTarget(e: React.MouseEvent, raidName: string) {
    e.stopPropagation()
    if (!onToggleComplete) return // read-only week
    const current = localSelections.find((r) => r.raidName === raidName)
    if (!current) return

    // Optimistic
    setLocalSelections((prev) =>
      prev.map((r) => r.raidName === raidName ? { ...r, isGoldTarget: !r.isGoldTarget } : r)
    )

    const res = await fetch(`/api/characters/${character.id}/gold-target`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raidName, weekStart }),
    })
    if (!res.ok) {
      const data = await res.json()
      setGoldToggleError(data.error ?? "")
      // Revert
      setLocalSelections((prev) =>
        prev.map((r) => r.raidName === raidName ? { ...r, isGoldTarget: current.isGoldTarget } : r)
      )
      setTimeout(() => setGoldToggleError(""), 3000)
    } else {
      const data = await res.json() as { isGoldTarget: boolean }
      setLocalSelections((prev) =>
        prev.map((r) => r.raidName === raidName ? { ...r, isGoldTarget: data.isGoldTarget } : r)
      )
      onGoldTargetChange?.(character.id, raidName, data.isGoldTarget)
    }
  }

  async function handleToggleGoldCharacter(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !localIsGoldCharacter
    setLocalIsGoldCharacter(next)

    const res = await fetch(`/api/characters/${character.id}/gold-character`, { method: "POST" })
    if (!res.ok) {
      const data = await res.json()
      setLocalIsGoldCharacter(!next) // revert
      setGoldToggleError(data.error ?? "")
      setTimeout(() => setGoldToggleError(""), 3000)
    } else {
      const data = await res.json() as { isGoldCharacter: boolean }
      setLocalIsGoldCharacter(data.isGoldCharacter)
      onGoldCharacterChange?.(character.id, data.isGoldCharacter)
    }
  }

  async function handleRefresh(e: React.MouseEvent) {
    e.stopPropagation()
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/characters/${character.id}/refresh`, { method: "POST" })
      if (res.ok) {
        const updated = await res.json() as { itemLevel: number; combatPower?: number; imageUrl?: string }
        setLocalItemLevel(Number(updated.itemLevel))
        if (updated.combatPower) setLocalCombatPower(updated.combatPower)
        if (updated.imageUrl) setLocalImageUrl(updated.imageUrl)
      }
    } catch {
      // silent fail
    } finally {
      setIsRefreshing(false)
    }
  }

  function handleRaidEditorSave(raids: string[]) {
    const newSelections: RaidSelection[] = raids.map((raidName) => {
      const existing = localSelections.find((r) => r.raidName === raidName)
      return existing ?? { id: `tmp-${raidName}`, raidName, isCompleted: false, isGoldTarget: false, weekStart }
    })
    setLocalSelections(newSelections)
    setShowRaidEditor(false)
    onRaidUpdate?.(character.id, newSelections)
  }

  const classColor = CLASS_COLOR[character.characterClass] ?? "#6b7280"

  return (
    <Card
      draggable={editMode}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={editMode ? () => onSelect?.(character.id) : undefined}
      className={cn(
        "border-gray-700 transition-all overflow-hidden",
        localIsGoldCharacter ? "bg-gray-900" : "bg-gray-900/60",
        editMode && "cursor-grab active:cursor-grabbing select-none",
        editMode && isSelected && "border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/30",
        isDragOver && !isDragging && "border-blue-400 ring-2 ring-blue-400/50 scale-[1.02]",
        isDragging && "opacity-40 scale-95"
      )}
    >
      {/* Top: portrait + info */}
      <div className="flex">
        {/* Portrait */}
        <div className="relative shrink-0 w-20 h-24 overflow-hidden border-r border-gray-700">
          {localImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={localImageUrl}
              alt={character.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: classColor }}
            >
              <span className="text-2xl font-bold text-white">{character.characterClass.slice(0, 1)}</span>
            </div>
          )}
          {/* Gold character badge */}
          {localIsGoldCharacter && (
            <div className="absolute bottom-1 right-1 rounded-full bg-gray-900/80 p-0.5">
              <Coins className="h-3 w-3 text-yellow-400" />
            </div>
          )}
          {/* Selected overlay */}
          {editMode && isSelected && (
            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1">
              <span className={cn("font-bold text-sm leading-tight truncate", localIsGoldCharacter ? "text-white" : "text-gray-400")}>
                {character.name}
              </span>
              {/* Gold character toggle */}
              {onToggleComplete && (
                <button
                  onClick={handleToggleGoldCharacter}
                  className={cn(
                    "shrink-0 p-1 rounded transition-colors",
                    localIsGoldCharacter
                      ? "text-yellow-400 hover:text-yellow-300 hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-400 hover:bg-gray-700"
                  )}
                  title={localIsGoldCharacter ? "골드 캐릭터 해제" : "골드 캐릭터 지정 (최대 6개)"}
                >
                  <Coins className="h-3 w-3" />
                </button>
              )}
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="shrink-0 p-1 rounded transition-colors text-gray-500 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="아이템레벨 갱신"
              >
                <RotateCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              </button>
              {/* Pencil */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowRaidEditor((v) => !v)
                }}
                className={cn(
                  "shrink-0 p-1 rounded transition-colors",
                  showRaidEditor
                    ? "text-blue-400 bg-gray-700"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
                )}
                title="레이드 편집"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{character.characterClass}</p>
            <p className="text-xs font-medium text-blue-400 mt-0.5">
              {localItemLevel.toLocaleString()}
              {localCombatPower > 0 && (
                <span className="text-gray-500 font-normal ml-1.5">전투력 {localCombatPower.toLocaleString()}</span>
              )}
            </p>
          </div>

          {total > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{completed}/{total}</span>
                {localIsGoldCharacter && potentialGold > 0 && (
                  <span className="flex items-center gap-1">
                    {earnedGold - earnedBoundGold > 0 && (
                      <span className="text-yellow-400 font-medium">{(earnedGold - earnedBoundGold).toLocaleString()}g</span>
                    )}
                    {earnedBoundGold > 0 && (
                      <span className="text-violet-400 font-medium">+{earnedBoundGold.toLocaleString()}g</span>
                    )}
                    {earnedGold === 0 && (
                      <span className="text-yellow-400 font-medium">0g</span>
                    )}
                    <span className="text-gray-600">/ {potentialGold.toLocaleString()}g</span>
                  </span>
                )}
              </div>
              <Progress value={progressPct} className="h-1 bg-gray-700" />
            </div>
          )}
        </div>
      </div>

      <CardContent className="px-3 pb-3 pt-2">
        {goldToggleError && (
          <p className="text-xs text-red-400 mb-1.5">{goldToggleError}</p>
        )}
        {showRaidEditor ? (
          <RaidEditor
            characterId={character.id}
            itemLevel={character.itemLevel}
            weekStart={weekStart}
            currentRaids={localSelections.map((r) => r.raidName)}
            onSave={handleRaidEditorSave}
            onCancel={() => setShowRaidEditor(false)}
          />
        ) : total > 0 ? (
          <div className="flex flex-col gap-1">
            {[...localSelections].sort((a, b) => getRaidGold(b.raidName) - getRaidGold(a.raidName)).map((selection) => {
              const isGoldRaid = goldTargetNames.has(selection.raidName)
              const gold = getRaidGold(selection.raidName)
              const bound = isRaidBound(selection.raidName)
              const group = getRaidGroup(selection.raidName)
              const textColor = group ? RAID_GROUP_COLORS[group]?.text : "text-gray-200"
              return (
                <div key={selection.raidName} className="flex items-center gap-1">
                  {/* Gold target toggle button */}
                  {onToggleComplete && localIsGoldCharacter && gold > 0 && (
                    <button
                      onClick={(e) => handleToggleGoldTarget(e, selection.raidName)}
                      className={cn(
                        "shrink-0 rounded p-0.5 transition-colors",
                        isGoldRaid
                          ? bound ? "text-violet-400 hover:text-violet-300" : "text-yellow-400 hover:text-yellow-300"
                          : "text-gray-600 hover:text-gray-400"
                      )}
                      title={isGoldRaid ? "골드 레이드 해제" : "골드 레이드 지정 (최대 3개)"}
                    >
                      <Coins className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggle(selection.raidName)
                    }}
                    disabled={editMode}
                    className={cn(
                      "flex items-center justify-between flex-1 rounded-md border px-2 py-1 text-xs font-medium transition-all disabled:cursor-default",
                      selection.isCompleted
                        ? "border-gray-700/40 bg-gray-800/40"
                        : "border-slate-700/60 bg-slate-800/60 hover:bg-slate-700/60"
                    )}
                  >
                    <span className={cn(
                      selection.isCompleted
                        ? "text-gray-600 line-through"
                        : textColor ?? "text-gray-200"
                    )}>
                      {selection.raidName}
                    </span>
                    {gold > 0 && (
                      <span className={cn(
                        "font-normal ml-auto",
                        !isGoldRaid || !localIsGoldCharacter
                          ? "text-gray-600"
                          : bound
                          ? selection.isCompleted ? "text-violet-800" : "text-violet-400"
                          : selection.isCompleted ? "text-yellow-800" : "text-yellow-400"
                      )}>
                        {gold.toLocaleString()}g
                      </span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500">이번 주 레이드가 없습니다.</p>
        )}
      </CardContent>
    </Card>
  )
}
