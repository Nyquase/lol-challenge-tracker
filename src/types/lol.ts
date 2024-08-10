export interface Champion {
  id: string
  alias: string
}

export interface Challenge {
  name: string
  champions: Array<Champion & { done: boolean }>
  totalDone: number
}

export type Mode = "Arena" | "Aram"
