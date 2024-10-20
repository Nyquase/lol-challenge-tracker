import { LCUCredentials, RawChallenge } from "../types/lcu"
import { AramStats, Challenge, Champion, GameMode, Stat } from "../types/lol"

export async function makeLCURequest<T = any>(
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

const formatStat = (stat: Stat) => {
  return Math.round((stat.flat * 100 - 100) * 10) / 10
}

export function parseMerakiFile(json: object): AramStats {
  const result: AramStats = {}
  for (let [champion, value] of Object.entries(json)) {
    if (champion === "Fiddlesticks") {
      champion = "FiddleSticks"
    }
    result[champion] = {
      aramAbilityHaste: value.stats.aramAbilityHaste.flat,
      aramAttackSpeed: formatStat(value.stats.aramAttackSpeed),
      aramDamageDealt: formatStat(value.stats.aramDamageDealt),
      aramDamageTaken: formatStat(value.stats.aramDamageTaken),
      aramEnergyRegen: formatStat(value.stats.aramEnergyRegen),
      aramHealing: formatStat(value.stats.aramHealing),
      aramShielding: formatStat(value.stats.aramShielding),
      aramTenacity: formatStat(value.stats.aramTenacity),
    }
  }

  return result
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
