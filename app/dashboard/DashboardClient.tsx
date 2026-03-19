"use client"

import { useState } from "react"
import { CharacterCard } from "@/components/CharacterCard"
import { GoldSummary } from "@/components/GoldSummary"

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

interface LostArkCharacter {
  CharacterName: string
  CharacterClassName: string
  ItemMaxLevel: number
  ServerName: string
}

interface DashboardClientProps {
  initialCharacters: Character[]
  weekStart: string
}

export function DashboardClient({ initialCharacters, weekStart }: DashboardClientProps) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const [searchName, setSearchName] = useState("")
  const [searchResults, setSearchResults] = useState<LostArkCharacter[]>([])
  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [searchError, setSearchError] = useState("")

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
      for (const char of toImport) {
        const res = await fetch("/api/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: char.CharacterName,
            characterClass: char.CharacterClassName,
            itemLevel: char.ItemMaxLevel,
          }),
        })
        if (res.ok) {
          const newChar = await res.json() as Character
          setCharacters((prev) => {
            // Avoid duplicates
            if (prev.some((c) => c.name === newChar.name)) return prev
            return [...prev, { ...newChar, itemLevel: Number(newChar.itemLevel) }].sort(
              (a, b) => b.itemLevel - a.itemLevel
            )
          })
        }
      }
      // Clear search after import
      setSearchResults([])
      setSelectedChars(new Set())
      setSearchName("")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Gold Summary */}
      <GoldSummary characters={characters} />

      {/* Character search / import section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">캐릭터 등록</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
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
        <h2 className="text-lg font-semibold text-white">내 캐릭터</h2>
        {characters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400 text-sm">등록된 캐릭터가 없습니다.</p>
            <p className="text-gray-500 text-xs mt-1">위에서 캐릭터 이름을 검색하여 추가하세요.</p>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  )
}
