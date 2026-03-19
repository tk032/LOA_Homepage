"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { RaidBadge } from "@/components/RaidBadge"
import { RAID_GROUPS } from "@/lib/raids"
import { Trash2, Plus, UserPlus, UserMinus } from "lucide-react"

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

interface Member {
  id: string
  userId: string
  role: string
  displayName: string
  username: string
  characters: Character[]
}

interface RunMember {
  id: string
  userId: string
  characterName: string
  itemLevel: number
  displayName: string
}

interface Run {
  id: string
  raidName: string
  note: string
  members: RunMember[]
}

interface GroupData {
  id: string
  name: string
  weekStart: string
  currentUserId: string
  isMember: boolean
  myRole: string | null
  members: Member[]
  runs: Run[]
}

interface GroupDetailClientProps {
  group: GroupData
}

export function GroupDetailClient({ group: initialGroup }: GroupDetailClientProps) {
  const router = useRouter()
  const [group, setGroup] = useState<GroupData>(initialGroup)
  const [showAddMember, setShowAddMember] = useState(false)
  const [addMemberUsername, setAddMemberUsername] = useState("")
  const [addMemberError, setAddMemberError] = useState("")
  const [addingMember, setAddingMember] = useState(false)

  const [showAddRun, setShowAddRun] = useState(false)
  const [newRunRaid, setNewRunRaid] = useState("")
  const [newRunNote, setNewRunNote] = useState("")
  const [selectedRunMembers, setSelectedRunMembers] = useState<
    { userId: string; characterName: string; itemLevel: number }[]
  >([])
  const [addRunError, setAddRunError] = useState("")
  const [addingRun, setAddingRun] = useState(false)

  const encodedName = encodeURIComponent(group.name)

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!addMemberUsername.trim()) return
    setAddingMember(true)
    setAddMemberError("")

    try {
      const res = await fetch(`/api/groups/${encodedName}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: addMemberUsername.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAddMemberError(data.error ?? "멤버 추가 중 오류가 발생했습니다.")
        return
      }

      setAddMemberUsername("")
      setShowAddMember(false)
      router.refresh()
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("정말로 이 멤버를 제거하시겠습니까?")) return

    const res = await fetch(`/api/groups/${encodedName}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    if (res.ok) {
      setGroup((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.userId !== userId),
      }))
    }
  }

  function toggleRunMember(userId: string, characterName: string, itemLevel: number) {
    setSelectedRunMembers((prev) => {
      const exists = prev.find((m) => m.userId === userId && m.characterName === characterName)
      if (exists) {
        return prev.filter((m) => !(m.userId === userId && m.characterName === characterName))
      }
      return [...prev, { userId, characterName, itemLevel }]
    })
  }

  async function handleAddRun(e: React.FormEvent) {
    e.preventDefault()
    if (!newRunRaid || selectedRunMembers.length === 0) {
      setAddRunError("레이드와 멤버를 선택해주세요.")
      return
    }
    setAddingRun(true)
    setAddRunError("")

    try {
      const res = await fetch(`/api/groups/${encodedName}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raidName: newRunRaid,
          members: selectedRunMembers,
          note: newRunNote,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAddRunError(data.error ?? "파티 생성 중 오류가 발생했습니다.")
        return
      }

      setGroup((prev) => ({
        ...prev,
        runs: [
          ...prev.runs,
          {
            id: data.id,
            raidName: data.raidName,
            note: data.note,
            members: data.members.map((rm: { id: string; userId: string; characterName: string; itemLevel: number; user: { displayName: string } }) => ({
              id: rm.id,
              userId: rm.userId,
              characterName: rm.characterName,
              itemLevel: rm.itemLevel,
              displayName: rm.user.displayName,
            })),
          },
        ],
      }))
      setNewRunRaid("")
      setNewRunNote("")
      setSelectedRunMembers([])
      setShowAddRun(false)
    } finally {
      setAddingRun(false)
    }
  }

  async function handleDeleteRun(runId: string) {
    if (!confirm("이 파티를 삭제하시겠습니까?")) return

    const res = await fetch(`/api/groups/${encodedName}/runs/${runId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      setGroup((prev) => ({
        ...prev,
        runs: prev.runs.filter((r) => r.id !== runId),
      }))
    }
  }

  // All raid names flat list
  const allRaids = Object.values(RAID_GROUPS).flatMap((g) => g.raids)

  return (
    <Tabs defaultValue="parties" className="space-y-4">
      <TabsList className="bg-gray-900 border border-gray-800">
        <TabsTrigger value="parties" className="data-[state=active]:bg-gray-800 text-gray-400 data-[state=active]:text-white">
          파티 편성
        </TabsTrigger>
        <TabsTrigger value="members" className="data-[state=active]:bg-gray-800 text-gray-400 data-[state=active]:text-white">
          멤버 현황
        </TabsTrigger>
      </TabsList>

      {/* PARTIES TAB */}
      <TabsContent value="parties" className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => setShowAddRun(!showAddRun)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            파티 추가
          </Button>
        </div>

        {showAddRun && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">새 파티 편성</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRun} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">레이드 선택</label>
                  <select
                    value={newRunRaid}
                    onChange={(e) => setNewRunRaid(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">레이드를 선택하세요</option>
                    {Object.entries(RAID_GROUPS).map(([groupName, groupData]) => (
                      <optgroup key={groupName} label={groupName}>
                        {groupData.raids.map((raid) => (
                          <option key={raid.name} value={raid.name}>
                            {raid.name} (최소 {raid.minLevel} / {raid.partySize}인)
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">메모 (선택)</label>
                  <input
                    type="text"
                    value={newRunNote}
                    onChange={(e) => setNewRunNote(e.target.value)}
                    placeholder="파티 메모"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    멤버 선택 ({selectedRunMembers.length}명 선택됨)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {group.members.map((member) =>
                      member.characters.map((char) => {
                        const isSelected = selectedRunMembers.some(
                          (m) => m.userId === member.userId && m.characterName === char.name
                        )
                        const selectedRaid = newRunRaid
                          ? allRaids.find((r) => r.name === newRunRaid)
                          : null
                        const meetsLevel = !selectedRaid || char.itemLevel >= selectedRaid.minLevel

                        return (
                          <label
                            key={`${member.userId}-${char.name}`}
                            className={`flex items-center gap-3 rounded-lg border p-2 cursor-pointer transition-colors ${
                              isSelected
                                ? "border-blue-600 bg-blue-900/20"
                                : meetsLevel
                                ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                                : "border-gray-800 bg-gray-800/50 opacity-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleRunMember(member.userId, char.name, char.itemLevel)
                              }
                              disabled={!meetsLevel}
                              className="accent-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-white">{char.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{char.characterClass}</span>
                            </div>
                            <span className="text-xs text-blue-400 shrink-0">
                              {char.itemLevel.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 shrink-0">
                              {member.displayName}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>

                {addRunError && <p className="text-sm text-red-400">{addRunError}</p>}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={addingRun}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {addingRun ? "생성 중..." : "파티 생성"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddRun(false)
                      setAddRunError("")
                      setSelectedRunMembers([])
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {group.runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-10 text-center">
            <p className="text-gray-400 text-sm">이번 주 파티가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.runs.map((run) => (
              <Card key={run.id} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <RaidBadge raidName={run.raidName} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRun(run.id)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {run.note && (
                    <p className="text-xs text-gray-400 mt-1">{run.note}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-1">
                  {run.members.map((rm, idx) => (
                    <div key={rm.id} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 w-4 text-right text-xs">{idx + 1}</span>
                      <span className="text-white font-medium">{rm.characterName}</span>
                      <span className="text-blue-400 text-xs ml-auto">{rm.itemLevel.toLocaleString()}</span>
                      <span className="text-gray-500 text-xs">{rm.displayName}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* MEMBERS TAB */}
      <TabsContent value="members" className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => setShowAddMember(!showAddMember)}
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            멤버 초대
          </Button>
        </div>

        {showAddMember && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="text"
                  value={addMemberUsername}
                  onChange={(e) => setAddMemberUsername(e.target.value)}
                  placeholder="초대할 사용자 아이디"
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={addingMember}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {addingMember ? "추가 중..." : "초대"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowAddMember(false); setAddMemberError("") }}
                  className="text-gray-400 hover:text-white"
                >
                  취소
                </Button>
              </form>
              {addMemberError && (
                <p className="text-sm text-red-400 mt-2">{addMemberError}</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {group.members.map((member) => {
            const totalRaids = member.characters.reduce(
              (sum, c) => sum + c.raidSelections.length,
              0
            )
            const completedRaids = member.characters.reduce(
              (sum, c) => sum + c.raidSelections.filter((r) => r.isCompleted).length,
              0
            )
            const progressPct = totalRaids > 0 ? Math.round((completedRaids / totalRaids) * 100) : 0

            return (
              <Card key={member.id} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{member.displayName}</span>
                      <span className="text-xs text-gray-500">@{member.username}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        member.role === "leader"
                          ? "bg-yellow-900/40 text-yellow-300 border border-yellow-700/50"
                          : "bg-gray-800 text-gray-400"
                      }`}>
                        {member.role === "leader" ? "리더" : "멤버"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {completedRaids}/{totalRaids}
                      </span>
                      {group.myRole === "leader" && member.userId !== group.currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="h-6 w-6 p-0 text-gray-600 hover:text-red-400"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {totalRaids > 0 && (
                    <Progress value={progressPct} className="h-1.5 bg-gray-700 mt-1" />
                  )}
                </CardHeader>
                {member.characters.length > 0 && (
                  <CardContent className="pt-0 space-y-3">
                    <Separator className="bg-gray-800" />
                    {member.characters.map((char) => (
                      <div key={char.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{char.name}</span>
                            <span className="text-xs text-gray-400">{char.characterClass}</span>
                          </div>
                          <span className="text-xs text-blue-400">
                            {char.itemLevel.toLocaleString()}
                          </span>
                        </div>
                        {char.raidSelections.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {char.raidSelections.map((r) => (
                              <span
                                key={r.raidName}
                                className={r.isCompleted ? "opacity-50" : ""}
                              >
                                <RaidBadge raidName={r.raidName} />
                                {r.isCompleted && (
                                  <span className="ml-1 text-xs text-gray-500">✓</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </TabsContent>
    </Tabs>
  )
}
