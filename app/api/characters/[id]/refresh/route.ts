export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface LostArkSibling {
  CharacterName: string
  ItemAvgLevel: string
  [key: string]: unknown
}

interface LostArkProfile {
  CharacterImage?: string
  Stats?: { Type: string; Value: string }[]
  [key: string]: unknown
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { id } = await params

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!character) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 })
  }

  const apiKey = process.env.LOSTARK_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 })
  }

  try {
    // 1. Get siblings to find updated item level
    const siblingsRes = await fetch(
      `https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(character.name)}/siblings`,
      {
        headers: {
          Authorization: `bearer ${apiKey}`,
          Accept: "application/json",
        },
      }
    )
    if (!siblingsRes.ok) {
      return NextResponse.json({ error: "Lost Ark API 호출에 실패했습니다." }, { status: 502 })
    }
    const siblings = await siblingsRes.json() as LostArkSibling[]
    const match = siblings.find((s) => s.CharacterName === character.name)
    if (!match) {
      return NextResponse.json({ error: "캐릭터를 Lost Ark API에서 찾을 수 없습니다." }, { status: 404 })
    }
    const newItemLevel = parseFloat(match.ItemAvgLevel.replace(/,/g, ""))

    // 2. Get updated profile image and combat power
    let newImageUrl = character.imageUrl ?? ""
    let newCombatPower = character.combatPower ?? 0
    let debugStats: unknown = null
    try {
      const profileRes = await fetch(
        `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(character.name)}/profiles`,
        {
          headers: {
            Authorization: `bearer ${apiKey}`,
            Accept: "application/json",
          },
        }
      )
      if (profileRes.ok) {
        const profile = await profileRes.json() as LostArkProfile
        newImageUrl = profile?.CharacterImage ?? newImageUrl
        debugStats = profile
        const cpStat = profile?.Stats?.find((s) => s.Type === "전투력")
        if (cpStat) {
          newCombatPower = parseInt(cpStat.Value.replace(/,/g, ""), 10) || 0
        }
      }
    } catch {
      // Non-fatal
    }

    // 3. Update DB
    const updated = await prisma.character.update({
      where: { id },
      data: {
        itemLevel: newItemLevel,
        combatPower: newCombatPower,
        imageUrl: newImageUrl,
      },
    })

    return NextResponse.json({ ...updated, _debugStats: debugStats })
  } catch (error) {
    console.error("Refresh character error:", error)
    return NextResponse.json({ error: "아이템 레벨 갱신 중 오류가 발생했습니다." }, { status: 500 })
  }
}
