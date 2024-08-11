import {
  ARAM_CHAMPS_CHALLENGE_ID,
  ARENA_CHAMPION_CHALLENGE_ID,
  ARENA_OCEAN_CHALLENGE_ID,
} from "../constants"
import { LCUCredentials, RawChallenge } from "../types/lcu"
import { Challenge, Champion, GameMode } from "../types/lol"

export async function makeRequest<T = any>(
  credentials: LCUCredentials,
  path: string
): Promise<T> {
  const { address, port, username, password, protocol } = credentials
  const url = `${protocol}://${address}:${port}`
  const headers = new Headers({
    accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`,
  })

  const res = await fetch(`${url}${path}`, { headers })
  return await res.json()
}

export function challengeFromCompletedIds(
  raw: RawChallenge,
  allChamps: Champion[],
  mode: GameMode
): Challenge {
  return {
    name: raw.name,
    description: raw.description,
    champions: allChamps.map((c) => ({
      ...c,
      done: raw.completedIds.includes(c.id),
    })),
    totalDone: raw.completedIds.length,
    mode,
  }
}

export const challengeIdToMode: Record<string, GameMode> = {
  [ARENA_OCEAN_CHALLENGE_ID]: "Arena",
  [ARENA_CHAMPION_CHALLENGE_ID]: "Arena",
  [ARAM_CHAMPS_CHALLENGE_ID]: "Aram",
}
