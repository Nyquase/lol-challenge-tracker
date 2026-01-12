import { Champion, Summoner } from "./lol"
import { RawChallenge } from "./lcu"

export interface StoredSettings {
  isColoredWhenDone: boolean
  showChampionNames: boolean
}

export interface LcuData {
  summoner: Summoner
  champions: Champion[]
  challenges: Record<string, RawChallenge>
}
