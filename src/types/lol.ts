export interface Champion {
  id: string
  alias: string
}

export interface Challenge {
  name: string
  description: string
  champions: Array<Champion & { done: boolean }>
  totalDone: number
}

export type Mode = "Arena" | "Aram"
