import { LCUCredentials, RawChallenge } from "../types/lcu"
import { Challenge, Champion } from "../types/lol"

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
  allChamps: Champion[]
): Challenge {
  return {
    name: raw.name,
    champions: allChamps.map((c) => ({
      ...c,
      done: raw.completedIds.includes(c.id),
    })),
    totalDone: raw.completedIds.length,
  }
}
