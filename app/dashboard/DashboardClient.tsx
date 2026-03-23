"use client"

import { useState, useEffect } from "react"
import { CharacterCard } from "@/components/CharacterCard"
import { GoldSummary } from "@/components/GoldSummary"
import { GoldHistoryChart } from "@/components/GoldHistoryChart"
import { Settings, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface LostArkCharacter {
  CharacterName: string
  CharacterClassName: string
  ItemMaxLevel: number
  ServerName: string
}

interface GoldHistoryEntry {
  weekStart: string
  earned: number
  potential: number
}

interface DashboardClientProps {
  initialCharacters: Character[]
  weekStart: string
  availableWeeks: string[]
}

function weekRelativeLabel(weekStart: string, availableWeeks: string[]): string {
  // availableWeeks is sorted desc (newest first)
  const idx = availableWeeks.indexOf(weekStart)
  if (idx === 0) return "이번 주"
  if (idx === 1) return "1주 전"
  if (idx === 2) return "2주 전"
  return `${idx}주 전`
}

export function DashboardClient({ initialCharacters, weekStart, availableWeeks }: DashboardClientProps) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [isRefreshingAll, setIsRefreshingAll] = useState(false)

  // Week switcher state
  const [selectedWeek, setSelectedWeek] = useState<string>(weekStart)
  const [isLoadingWeek, setIsLoadingWeek] = useState(false)

  // Gold history
  const [goldHistory, setGoldHistory] = useState<GoldHistoryEntry[]>([])

  // Character import / search state
  const [searchName, setSearchName] = useState("")
  const [searchResults, setSearchResults] = useState<LostArkCharacter[]>([])
  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [searchError, setSearchError] = useState("")

  // Fetch gold history on mount
  useEffect(() => {
    fetch("/api/characters/gold-history")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setGoldHistory(data as GoldHistoryEntry[]))
      .catch(() => {})
  }, [])

  // When selectedWeek changes, fetch characters for that week
  useEffect(() => {
    if (selectedWeek === weekStart) {
      setCharacters(initialCharacters)
      return
    }
    setIsLoadingWeek(true)
    fetch(`/api/characters?week=${encodeURIComponent(selectedWeek)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setCharacters(
            (data as Character[]).map((c) => ({
              ...c,
              itemLevel: Number(c.itemLevel),
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingWeek(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek])

  async function handleToggleComplete(
    characterId: string,
    raidName: string,
    ws: string,
    isCompleted: boolean
  ) {
    const res = await fetch(`/api/characters/${characterId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raidName, weekStart: ws, isCompleted }),
    })
    if (!res.ok) {
      console.error("Failed to toggle completion")
    }
  }

  // Single delete (used internally by batch delete)
  async function deleteCharacter(characterId: string): Promise<boolean> {
    const res = await fetch(`/api/characters/${characterId}`, { method: "DELETE" })
    return res.ok
  }

  // Batch delete all selected characters
  async function handleBatchDelete() {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    try {
      const ids = [...selectedIds]
      const results = await Promise.all(ids.map((id) => deleteCharacter(id)))
      const deleted = ids.filter((_, i) => results[i])
      setCharacters((prev) => prev.filter((c) => !deleted.includes(c.id)))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        deleted.forEach((id) => next.delete(id))
        return next
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function handleSelect(characterId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(characterId)) {
        next.delete(characterId)
      } else {
        next.add(characterId)
      }
      return next
    })
  }

  async function handleReorder(newOrder: Character[]) {
    setCharacters(newOrder)
    await fetch("/api/characters/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newOrder.map((c) => c.id) }),
    })
  }

  function handleDragStart(id: string) {
    setDraggedId(id)
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (id !== draggedId) setDragOverId(id)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    const next = [...characters]
    const fromIdx = next.findIndex((c) => c.id === draggedId)
    const toIdx = next.findIndex((c) => c.id === targetId)
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    handleReorder(next)
    setDraggedId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverId(null)
  }

  function handleRaidUpdate(characterId: string, raids: RaidSelection[]) {
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId ? { ...c, raidSelections: raids } : c
      )
    )
  }

  function exitEditMode() {
    setEditMode(false)
    setSelectedIds(new Set())
  }

  async function handleRefreshAll() {
    if (isRefreshingAll || characters.length === 0) return
    setIsRefreshingAll(true)
    try {
      const results = await Promise.all(
        characters.map((c) =>
          fetch(`/api/characters/${c.id}/refresh`, { method: "POST" })
            .then((r) => r.ok ? r.json() as Promise<{ itemLevel: number; imageUrl?: string }> : null)
            .then((data) => ({ id: c.id, data }))
        )
      )
      setCharacters((prev) =>
        prev.map((c) => {
          const result = results.find((r) => r.id === c.id)
          if (!result?.data) return c
          return {
            ...c,
            itemLevel: Number(result.data.itemLevel),
            ...(result.data.imageUrl ? { imageUrl: result.data.imageUrl } : {}),
          }
        })
      )
    } finally {
      setIsRefreshingAll(false)
    }
  }

  async function handleSearch() {
    if (!searchName.trim()) return
    setIsSearching(true)
    setSearchError("")
    setSearchResults([])
    setSelectedChars(new Set())
    try {
      const res = await fetch(`/api/lostark?name=${encodeURIComponent(searchName.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setSearchError(data.error ?? "검색 중 오류가 발생했습니다.")
        return
      }
      setSearchResults(data as LostArkCharacter[])
      if ((data as LostArkCharacter[]).length === 0) {
        setSearchError("원정대 캐릭터를 찾을 수 없습니다.")
      }
    } catch {
      setSearchError("검색 중 오류가 발생했습니다.")
    } finally {
      setIsSearching(false)
    }
  }

  function toggleSelect(charName: string) {
    setSelectedChars((prev) => {
      const next = new Set(prev)
      if (next.has(charName)) next.delete(charName)
      else next.add(charName)
      return next
    })
  }

  async function handleImport() {
    if (selectedChars.size === 0) return
    setIsImporting(true)
    try {
      const toImport = searchResults.filter((c) => selectedChars.has(c.CharacterName))
      // All imports in parallel
      const results = await Promise.all(
        toImport.map((char) =>
          fetch("/api/characters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: char.CharacterName,
              characterClass: char.CharacterClassName,
              itemLevel: char.ItemMaxLevel,
            }),
          }).then((res) => res.ok ? res.json() as Promise<Character> : null)
        )
      )
      const newChars = (results.filter(Boolean) as Character[]).map((c) => ({
        ...c,
        itemLevel: Number(c.itemLevel),
      }))
      setCharacters((prev) => {
        const existingNames = new Set(prev.map((c) => c.name))
        const toAdd = newChars.filter((c) => !existingNames.has(c.name))
        return [...prev, ...toAdd]
      })
      setSearchResults([])
      setSelectedChars(new Set())
      setSearchName("")
    } finally {
      setIsImporting(false)
    }
  }

  const isCurrentWeek = selectedWeek === weekStart

  return (
    <div className="space-y-6">
      {/* Gold Summary */}
      <GoldSummary characters={characters} />

      {/* Gold History Chart */}
      {goldHistory.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400">주간 골드 현황</h2>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <GoldHistoryChart data={goldHistory} />
          </div>
        </section>
      )}

      {/* Character search / import section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">캐릭터 등록</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value)
              if (!e.target.value.trim()) {
                setSearchResults([])
                setSearchError("")
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="캐릭터 이름 검색"
            className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchName.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? "검색 중..." : "검색"}
          </button>
        </div>

        {searchError && (
          <p className="text-sm text-red-400">{searchError}</p>
        )}

        {searchResults.length > 0 && (
          <div className="rounded-xl border border-gray-700 bg-gray-900 divide-y divide-gray-800">
            {searchResults
              .sort((a, b) => b.ItemMaxLevel - a.ItemMaxLevel)
              .map((char) => {
                const isSelected = selectedChars.has(char.CharacterName)
                const alreadyAdded = characters.some((c) => c.name === char.CharacterName)
                return (
                  <label
                    key={char.CharacterName}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-800/60 transition-colors ${alreadyAdded ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={alreadyAdded}
                      onChange={() => !alreadyAdded && toggleSelect(char.CharacterName)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500"
                    />
                    <span className="text-sm text-white font-medium flex-1">
                      {char.CharacterName}
                    </span>
                    <span className="text-xs text-gray-400">{char.CharacterClassName}</span>
                    <span className="text-xs text-blue-400 font-medium">
                      {char.ItemMaxLevel.toLocaleString()}
                    </span>
                    {alreadyAdded && (
                      <span className="text-xs text-gray-500">등록됨</span>
                    )}
                  </label>
                )
              })}
            <div className="px-4 py-3 flex justify-end">
              <button
                onClick={handleImport}
                disabled={isImporting || selectedChars.size === 0}
                className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? "등록 중..." : `선택 등록 (${selectedChars.size})`}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Characters grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">내 캐릭터</h2>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    disabled={isDeleting}
                    className="rounded-md bg-red-700 hover:bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? "삭제 중..." : `선택 삭제 (${selectedIds.size})`}
                  </button>
                )}
                <button
                  onClick={exitEditMode}
                  className="rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors"
                >
                  완료
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleRefreshAll}
                  disabled={isRefreshingAll}
                  className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  title="전체 아이템레벨 갱신"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshingAll && "animate-spin")} />
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  title="편집 모드"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Week switcher */}
        {availableWeeks.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {availableWeeks.map((week) => (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  selectedWeek === week
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                )}
              >
                {weekRelativeLabel(week, availableWeeks)}
              </button>
            ))}
          </div>
        )}

        {isLoadingWeek ? (
          <div className="flex justify-center py-8">
            <span className="text-sm text-gray-500">불러오는 중...</span>
          </div>
        ) : characters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400 text-sm">
              {isCurrentWeek ? "등록된 캐릭터가 없습니다." : "해당 주차에 레이드 기록이 없습니다."}
            </p>
            {isCurrentWeek && (
              <p className="text-gray-500 text-xs mt-1">위에서 캐릭터 이름을 검색하여 추가하세요.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                weekStart={selectedWeek}
                onToggleComplete={isCurrentWeek ? handleToggleComplete : undefined}
                onRaidUpdate={isCurrentWeek ? handleRaidUpdate : undefined}
                onGoldCharacterChange={(id, isGold) => {
                  setCharacters((prev) =>
                    prev.map((c) => c.id === id ? { ...c, isGoldCharacter: isGold } : c)
                  )
                }}
                onGoldTargetChange={(id, raidName, isGoldTarget) => {
                  setCharacters((prev) =>
                    prev.map((c) =>
                      c.id === id
                        ? {
                            ...c,
                            raidSelections: c.raidSelections.map((r) =>
                              r.raidName === raidName ? { ...r, isGoldTarget } : r
                            ),
                          }
                        : c
                    )
                  )
                }}
                editMode={isCurrentWeek && editMode}
                isSelected={selectedIds.has(character.id)}
                onSelect={handleSelect}
                isDragging={draggedId === character.id}
                isDragOver={dragOverId === character.id}
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; handleDragStart(character.id) }}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, character.id)}
                onDrop={(e) => handleDrop(e, character.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
