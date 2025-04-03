export enum LCUEvents {
  EndOfGameStats = "OnJsonApiEvent_lol-end-of-game_v1_eog-stats-block",
  ChampSelectSession = "OnJsonApiEvent_lol-champ-select_v1_session",
}

export type LCUEventMessage =
  | {
      type: LCUEvents.ChampSelectSession
      data: ChampSelectSessionEvent
    }
  | {
      type: LCUEvents.EndOfGameStats
      data: any
    }

export interface ChampSelectSessionEvent {
  actions: {
    type: string
    actorCellId: number
    championId: number
    isAllyAction: boolean
  }[][]
  localPlayerCellId: number
}
