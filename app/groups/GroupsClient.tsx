"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus, ChevronRight } from "lucide-react"

interface GroupData {
  id: string
  name: string
  memberCount: number
  runCount: number
  isMyGroup: boolean
  myRole: string | null
}

interface GroupsClientProps {
  groups: GroupData[]
}

export function GroupsClient({ groups: initialGroups }: GroupsClientProps) {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupData[]>(initialGroups)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setCreating(true)
    setError("")

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "그룹 생성 중 오류가 발생했습니다.")
        return
      }

      setGroups((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          memberCount: 1,
          runCount: 0,
          isMyGroup: true,
          myRole: "leader",
        },
      ])
      setNewGroupName("")
      setShowCreate(false)
      router.refresh()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          그룹 만들기
        </Button>
      </div>

      {showCreate && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="그룹 이름을 입력하세요"
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                type="submit"
                disabled={creating || !newGroupName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {creating ? "생성 중..." : "만들기"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowCreate(false); setError("") }}
                className="text-gray-400 hover:text-white"
              >
                취소
              </Button>
            </form>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          </CardContent>
        </Card>
      )}

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-12 text-center">
          <Users className="h-8 w-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">아직 그룹이 없습니다.</p>
          <p className="text-gray-500 text-xs mt-1">첫 번째 그룹을 만들어보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${encodeURIComponent(group.name)}`}
            >
              <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/80 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base">{group.name}</CardTitle>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{group.memberCount}명</span>
                    </div>
                    <span>파티 {group.runCount}개</span>
                  </div>
                  {group.isMyGroup && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-blue-900/40 border border-blue-700/50 px-2 py-0.5 text-xs text-blue-300">
                        {group.myRole === "leader" ? "리더" : "멤버"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
