<script setup lang="ts">
import { onMounted, ref, computed } from "vue"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faGear } from "@fortawesome/free-solid-svg-icons"

import { LCUCredentials, RawChallenge } from "./types/lcu"
import { AramStats, Challenge, Champion, Summoner } from "./types/lol"
import { StoredSettings } from "./types/app"
import {
  challengeFromCompletedIds as challengeFromRaw,
  makeLCURequest,
  parseMerakiFile,
} from "./helpers/utils"
import { challengeWithCompletion } from "./constants"
import ChallengeSection from "./components/ChallengeSection.vue"
import Settings from "./components/Settings.vue"
import LeagueDropdown from "./components/LeagueDropdown.vue"

const credentials = ref<LCUCredentials | null>(null)

const allChampions = ref<Champion[] | null>(null)
const summoner = ref<Summoner | null>(null)
const challenges = ref<Challenge[]>([])
const stats = ref<AramStats | null>(null)
const selectedChamp = ref<Challenge["champions"][number] | null>(null)

onMounted(async () => {
  window.ipcRenderer.send("app-ready")
  const storedAramStats = await window.ipcRenderer.invoke(
    "store-get",
    "aram-stats"
  )
  if (storedAramStats) {
    stats.value = JSON.parse(storedAramStats)
  } else {
    await fetchAramStats()
  }
})

const fetchAramStats = async () => {
  const res = await fetch(
    `https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json`,
    { cache: "no-cache" }
  )
  const parsed = parseMerakiFile(await res.json())
  window.ipcRenderer.send("store-set", "aram-stats", JSON.stringify(parsed))
  stats.value = parsed
}

const fetchLCU = async () => {
  if (credentials.value === null) return
  try {
    const summonerRes = await makeLCURequest<Summoner>(
      credentials.value,
      "/lol-summoner/v1/current-summoner"
    )

    summoner.value = summonerRes

    const champsRes = await makeLCURequest<Champion[]>(
      credentials.value,
      `/lol-champions/v1/inventories/${summonerRes.summonerId}/champions-minimal`
    )

    // Remove the first champ ("None" champion)
    champsRes.shift()
    const allChamps = champsRes.filter(c => c.active).sort((a, b) => a.name.localeCompare(b.name))
    allChampions.value = allChamps

    const allChallenges: Record<string, RawChallenge> = await makeLCURequest(
      credentials.value,
      "/lol-challenges/v1/challenges/local-player"
    )

    challenges.value = challengeWithCompletion.map((c) =>
      challengeFromRaw(allChallenges[c.id], allChamps, c.gameMode)
    )
  } catch (e) {}
}

const selectedChallengeIndex = ref(0)
const isColoredWhenDone = ref(false)
const showChampionNames = ref(false)

const updateSettings = (settings: StoredSettings) => {
  isColoredWhenDone.value = settings.isColoredWhenDone
  showChampionNames.value = settings.showChampionNames
  window.ipcRenderer.send("store-set", "settings", JSON.stringify(settings))
}

const handlePickEvent = (champId: number | null) => {
  if (champId === null) {
    selectedChamp.value = null
  }
  const champ = challenges.value[selectedChallengeIndex.value]?.champions.find(
    (c) => c.id === champId
  )
  if (champ) {
    selectedChamp.value = champ
  }
}

window.ipcRenderer.on("end-of-game", () => {
  selectedChamp.value = null
  fetchLCU()
})

window.ipcRenderer.on("pick", async (_event, champId: number | null) => {
  handlePickEvent(champId)
})

window.ipcRenderer.on(
  "credentials",
  async (_event, newCredentials: LCUCredentials) => {
    credentials.value = newCredentials
    await fetchLCU()
    const storedSelectedChallengeIdx = await window.ipcRenderer.invoke(
      "store-get",
      "selected-challenge-index"
    )

    const storedSettings = await window.ipcRenderer.invoke(
      "store-get",
      "settings"
    )

    if (storedSettings) {
      const settings: StoredSettings = JSON.parse(storedSettings)
      isColoredWhenDone.value = settings.isColoredWhenDone
      showChampionNames.value = settings.showChampionNames
    }

    if (storedSelectedChallengeIdx) {
      selectedChallengeIndex.value = Number(storedSelectedChallengeIdx)
    }
  }
)

window.ipcRenderer.on(
  "game-start",
  async (_event, champSelect: { championId: number; puuid: string }[]) => {
    const localPickedChamp = champSelect.find(
      (c) => c.puuid === summoner.value?.puuid
    )
    if (localPickedChamp) {
      handlePickEvent(localPickedChamp.championId)
    }
  }
)

window.ipcRenderer.on("refetch", fetchLCU)

const settingsVisible = ref(false)

const onClickSettings = () => {
  settingsVisible.value = !settingsVisible.value
}

const challengeOptions = computed(() => {
  return challenges.value.map((challenge, idx) => ({
    name: challenge.name,
    value: idx,
  }))
})
</script>

<template>
  <div class="app">
    <div class="app-heading">
      <LeagueDropdown
        v-if="challengeOptions.length > 0"
        v-model="selectedChallengeIndex"
        :options="challengeOptions"
      />
    </div>
    <button class="league-button settings-button" @click="onClickSettings">
      <FontAwesomeIcon :icon="faGear" />
    </button>
    <div class="challenges" v-if="credentials && allChampions">
      <ChallengeSection
        v-if="challenges[selectedChallengeIndex]"
        :challenge="challenges[selectedChallengeIndex]"
        :all-champions="allChampions"
        :selectedChamp="selectedChamp"
        :isColoredWhenDone="isColoredWhenDone"
        :showChampionNames="showChampionNames"
        :stats="stats"
      />
    </div>
    <div v-else>Waiting for a League client...</div>
    <Settings
      v-model:visible="settingsVisible"
      :isColoredWhenDone="isColoredWhenDone"
      :showChampionNames="showChampionNames"
      @update:isColoredWhenDone="
        (v) => updateSettings({ isColoredWhenDone: v, showChampionNames })
      "
      @update:showChampionNames="
        (v) => updateSettings({ isColoredWhenDone, showChampionNames: v })
      "
      @refetch="fetchLCU"
      @refetch-aram-stats="fetchAramStats"
    />
  </div>
</template>

<style>
.app {
  background: var(--main-bg-gradient);
  border-top: solid 2px #785a28;
  position: relative;
  padding: 16px;
  color: var(--main-text-color);
}

.app-heading {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  position: relative;
  width: 300px;
}

.tab {
  cursor: pointer;
  padding: 8px;
  border: solid 2px transparent;
}

.tab:hover {
  border-bottom: solid 2px #785a28;
  border-right: solid 2px #785a28;
}

.tab.selected {
  border-bottom: solid 2px #785a28;
  border-right: solid 2px #785a28;
}

.challenges > * {
  margin-bottom: 32px;
}

button.settings-button {
  position: absolute;
  right: 16px;
  top: 18px;
  font-size: 16px;
  height: 40px;
  width: 40px;
  padding: 10px;
  border-radius: 50%;
}
</style>
