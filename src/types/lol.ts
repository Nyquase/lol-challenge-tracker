export interface Champion {
  id: string
  alias: string
}

export interface Challenge {
  name: string
  description: string
  mode: GameMode
  champions: Array<Champion & { done: boolean }>
  totalDone: number
}

export type GameMode = "Arena" | "Aram"
