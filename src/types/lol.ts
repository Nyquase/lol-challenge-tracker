export interface Champion {
  id: string
  alias: string
  name: string
  roles: ChampionRole[]
}

export const ChampionRoles = [
  "assassin",
  "fighter",
  "mage",
  "marksman",
  "support",
  "tank",
] as const
export type ChampionRole = (typeof ChampionRoles)[number]

export interface Challenge {
  name: string
  description: string
  mode: GameMode
  champions: Array<Champion & { done: boolean }>
  totalDone: number
}

export type GameMode = "Arena" | "Aram" | "Rift"

export interface Stat {
  flat: number
  percent: number
  perLevel: number
  percentPerLevel: number
}

export interface ChampionStats {
  aramAbilityHaste: number
  aramAttackSpeed: number
  aramDamageDealt: number
  aramDamageTaken: number
  aramEnergyRegen: number
  aramHealing: number
  aramShielding: number
  aramTenacity: number
}

export type AramStats = Record<string, ChampionStats>
