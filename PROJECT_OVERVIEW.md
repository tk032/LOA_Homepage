# LOA 레이드 관리 시스템 — 프로젝트 전체 정리

## 프로젝트 구성

이 프로젝트는 두 개의 독립된 서비스로 구성돼 있어.

```
repos/
├── LOA_BOT/        Discord 봇 (Python)
└── LOA_Homepage/   웹사이트 (Next.js)
```

---

## 🤖 LOA_BOT — Discord 봇

### 언어 & 라이브러리

| 항목 | 내용 |
|------|------|
| Python | 메인 언어 |
| discord.py | Discord API 연동. 슬래시 커맨드 처리 |
| aiosqlite | 비동기 SQLite DB 처리 |
| aiohttp | Lost Ark Open API 호출 (캐릭터 정보) |
| python-dotenv | .env 파일에서 환경변수 로드 |

### 주요 파일

| 파일 | 역할 |
|------|------|
| `bot.py` | 봇 시작점. Discord 연결, 주간 자동 리셋 |
| `database.py` | SQLite DB 초기화 + 모든 쿼리 메서드 |
| `data/raids.py` | 레이드 데이터 (이름, 최소 아이템레벨, 인원) |
| `cogs/character_cog.py` | `/등록` `/캐릭터삭제` 커맨드 |
| `cogs/raid_cog.py` | `/레이드` 커맨드 (완료 체크 UI) |
| `cogs/group_cog.py` | `/그룹생성` `/그룹현황` 커맨드 |
| `cogs/admin_cog.py` | `/완료초기화` `/데이터초기화` (관리자 전용) |

### 커맨드 목록

| 커맨드 | 설명 |
|--------|------|
| `/등록 [캐릭터명]` | Lost Ark API로 원정대 상위 6캐릭 자동 등록 |
| `/레이드` | 내 캐릭터별 레이드 완료 체크 UI |
| `/그룹생성 [그룹명]` | 멤버 선택해서 레이드 그룹 생성 |
| `/그룹현황 [그룹명]` | 그룹 파티 현황 + 멤버 레이드 상태 |
| `/그룹삭제 [그룹명]` | 그룹 삭제 |
| `/완료초기화` | 이번 주 완료 체크 전체 초기화 (관리자) |
| `/데이터초기화` | 모든 데이터 삭제 (관리자) |

---

## 🌐 LOA_Homepage — 웹사이트

### 언어 & 프레임워크

| 항목 | 내용 |
|------|------|
| TypeScript | JavaScript + 타입 체크. 오타/버그를 코드 작성 시 미리 잡아줌 |
| React | UI를 컴포넌트 단위로 만드는 라이브러리 |
| Next.js 16 | React 기반 풀스택 프레임워크. 프론트 + API 서버 한 프로젝트 |
| Tailwind CSS | 클래스명으로 스타일 적용 (`bg-gray-900`, `text-white` 등) |
| shadcn/ui | Tailwind 기반 UI 컴포넌트 모음 (Card, Badge, Button 등) |
| Prisma 5 | TypeScript용 ORM. DB 테이블을 코드로 정의하고 타입 안전하게 쿼리 |
| NextAuth v4 | 로그인/세션 관리. Discord OAuth 지원 |
| bcryptjs | 비밀번호 해싱 (평문 저장 방지) |

### 파일 구조

```
LOA_Homepage/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   NextAuth 핸들러
│   │   ├── characters/           캐릭터 CRUD API
│   │   ├── groups/               그룹 CRUD API
│   │   └── register/             회원가입 API
│   ├── dashboard/                내 캐릭터 & 레이드 현황
│   ├── groups/                   그룹 목록 & 상세
│   ├── login/                    로그인 페이지
│   └── register/                 회원가입 페이지
├── components/
│   ├── ui/                       shadcn 컴포넌트
│   ├── Navbar.tsx                상단 네비게이션
│   ├── CharacterCard.tsx         캐릭터 카드 (레이드 토글)
│   ├── RaidBadge.tsx             레이드명 색상 배지
│   └── WeekLabel.tsx             현재 주차 표시
├── lib/
│   ├── prisma.ts                 Prisma 클라이언트 싱글톤
│   ├── auth.ts                   NextAuth 설정
│   └── raids.ts                  레이드 데이터 + 주차 계산
└── prisma/
    └── schema.prisma             DB 테이블 구조 정의
```

### DB 테이블

| 테이블 | 설명 |
|--------|------|
| User | 사용자 (Discord ID, 닉네임, 아바타) |
| Character | 캐릭터 (이름, 직업, 아이템레벨) |
| RaidSelection | 주간 레이드 선택 + 완료 여부 |
| Group | 레이드 그룹 |
| GroupMember | 그룹 멤버 |
| GroupRun | 파티 편성 (레이드 + 주차) |
| RunMember | 파티 참여 캐릭터 |

---

## 🚀 배포 인프라

### 전체 흐름

```
[코드 수정] → git push → [GitHub]
                              ├→ LOA_BOT:      GitHub Actions → Fly.io 자동 배포
                              └→ LOA_Homepage: Vercel 자동 감지 → 자동 배포

[Discord Bot]                    [웹사이트]
Fly.io (Python 서버)      ←→     Vercel (Next.js 서버리스)
        ↓                                  ↓
SQLite (Fly.io 볼륨)              PostgreSQL (Neon)
```

### Fly.io (Discord 봇 서버)

- **역할**: LOA_BOT을 24시간 실행하는 클라우드 서버
- **무료 플랜**: 소규모(4~5명) 사용에 충분
- **Docker**: 코드를 컨테이너로 패키징해서 배포
- **Volume**: `/data` 경로에 SQLite DB 파일 영구 저장
- **fly.toml**: 설정 파일 (메모리 256MB, 리전 nrt=도쿄)
- **Secrets**: `DISCORD_TOKEN`, `LOSTARK_API_KEY` 암호화 저장

### GitHub Actions (LOA_BOT CI/CD)

- **파일**: `.github/workflows/fly-deploy.yml`
- **동작**: `main` 브랜치에 push → 자동으로 Fly.io 재배포
- **FLY_API_TOKEN**: GitHub Secrets에 저장

### Vercel (웹사이트 서버)

- **역할**: LOA_Homepage 호스팅
- **무료 플랜**: 개인/소규모 프로젝트 무료
- **CI/CD 내장**: GitHub push → 자동 재배포 (Actions 불필요)
- **도메인**: `mary-hompage.vercel.app`
- **환경변수**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`

### Neon (PostgreSQL DB)

- **역할**: 웹사이트 데이터베이스
- **왜 SQLite 안 쓰나**: Vercel은 서버리스라 파일이 재시작마다 초기화됨
- **무료 플랜**: 0.5GB, 소규모 사용에 충분
- **리전**: Asia Pacific (Singapore)

---

## 인증

### Discord OAuth (웹사이트)

- Discord 계정으로 로그인 → 별도 회원가입 불필요
- Discord Developer Portal에서 OAuth2 앱 등록 필요
- NextAuth가 Discord 로그인 흐름 자동 처리
- 첫 로그인 시 자동으로 User 레코드 생성

### Discord Bot 토큰

- Discord Developer Portal에서 봇 토큰 발급
- Fly.io Secrets에 `DISCORD_TOKEN`으로 저장

---

## 레이드 데이터

| 레이드 그룹 | 레이드 | 최소 아이템레벨 |
|------------|--------|----------------|
| 지평의 성당 | 3단계 / 2단계 / 1단계 | 1750 / 1720 / 1700 |
| 세르카 | 나메 / 하드 / 노말 | 1740 / 1730 / 1710 |
| 종막 | 하드 / 노말 | 1730 / 1710 |
| 4막 | 하드 / 노말 | 1720 / 1700 |
| 둠 | 하르둠 / 노르둠 | 1700 / 1680 |
| 브 | 하브 / 노브 | 1690 / 1670 |
| 기르 | 하기르 / 노기르 | 1680 / 1660 |

규칙:
- 같은 그룹 내 1개만 선택 가능
- 캐릭터당 최대 골드 레이드 3개
- 주간 리셋: 매주 수요일 오전 6시 KST

---

## 환경변수 정리

### LOA_BOT (.env)

| 변수 | 설명 |
|------|------|
| `DISCORD_TOKEN` | Discord 봇 토큰 |
| `LOSTARK_API_KEY` | Lost Ark Open API 키 |
| `DATABASE_PATH` | SQLite DB 경로 (`/data/loa.db`) |

### LOA_Homepage (.env)

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL 연결 문자열 |
| `NEXTAUTH_SECRET` | NextAuth 암호화 키 (랜덤 문자열) |
| `NEXTAUTH_URL` | 사이트 URL (`https://mary-hompage.vercel.app`) |
| `DISCORD_CLIENT_ID` | Discord OAuth 앱 클라이언트 ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth 앱 클라이언트 시크릿 |
