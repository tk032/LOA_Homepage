export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get("name")

  if (!name) {
    return NextResponse.json({ error: "캐릭터 이름을 입력해주세요." }, { status: 400 })
  }

  const apiKey = process.env.LOSTARK_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Lost Ark API 키가 설정되지 않았습니다." }, { status: 500 })
  }

  try {
    const url = `https://developer-lostark.game.gg/characters/${encodeURIComponent(name)}/siblings`
    const response = await fetch(url, {
      headers: {
        Authorization: `bearer ${apiKey}`,
        Accept: "application/json",
      },
    })

    if (response.status === 404) {
      return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 })
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Lost Ark API 오류: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Parse ItemMaxLevel: comes as "1,750.00" string — strip commas and parse as float
    const characters = (data as Array<{
      CharacterName: string
      CharacterClassName: string
      ItemMaxLevel: string
      ServerName: string
    }>).map((char) => ({
      CharacterName: char.CharacterName,
      CharacterClassName: char.CharacterClassName,
      ItemMaxLevel: parseFloat(char.ItemMaxLevel.replace(/,/g, "")),
      ServerName: char.ServerName,
    }))

    return NextResponse.json(characters)
  } catch (error) {
    console.error("Lost Ark API error:", error)
    return NextResponse.json(
      { error: "Lost Ark API 호출 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
