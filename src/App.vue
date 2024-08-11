<script setup lang="ts">
import { computed, ref } from "vue"
import { LCUCredentials, RawChallenge } from "./types/lcu"
import { Challenge, Champion } from "./types/lol"
import {
  challengeFromCompletedIds as challengeFromRaw,
  challengeIdToMode,
  makeRequest,
} from "./helpers/utils"
import {
  ARAM_CHAMPS_CHALLENGE_ID,
  ARENA_CHAMPION_CHALLENGE_ID,
  ARENA_OCEAN_CHALLENGE_ID,
} from "./constants"
import ChallengeSection from "./components/ChallengeSection.vue"

const credentials = ref<LCUCredentials | null>(null)
const allChampions = ref<Champion[] | null>(null)
const arenaOcean = ref<Challenge | null>(null)
const arenaChampion = ref<Challenge | null>(null)
const aramChamps = ref<Challenge | null>(null)

window.ipcRenderer.send("app-ready")

const fetchAll = async () => {
  if (credentials.value === null) return
  const champsRes = await makeRequest<Champion[]>(
    credentials.value,
    "/lol-champions/v1/owned-champions-minimal"
  )

  const allChamps = champsRes.sort((a, b) => a.alias.localeCompare(b.alias))
  allChampions.value = allChamps

  const allChallenges: Record<string, RawChallenge> = await makeRequest(
    credentials.value,
    "/lol-challenges/v1/challenges/local-player"
  )

  arenaOcean.value = challengeFromRaw(
    allChallenges[ARENA_OCEAN_CHALLENGE_ID],
    allChamps,
    challengeIdToMode[ARENA_OCEAN_CHALLENGE_ID]
  )

  arenaChampion.value = challengeFromRaw(
    allChallenges[ARENA_CHAMPION_CHALLENGE_ID],
    allChamps,
    challengeIdToMode[ARENA_CHAMPION_CHALLENGE_ID]
  )

  aramChamps.value = challengeFromRaw(
    allChallenges[ARAM_CHAMPS_CHALLENGE_ID],
    allChamps,
    challengeIdToMode[ARAM_CHAMPS_CHALLENGE_ID]
  )
}

// const ws = ref<WebSocket | null>(null)

window.ipcRenderer.on(
  "credentials",
  async (_event, newCredentials: LCUCredentials) => {
    credentials.value = newCredentials
    await fetchAll()
  }
)

window.ipcRenderer.on("refetch", fetchAll)

const onClickRefresh = () => {
  if (credentials.value) {
    fetchAll()
  } else {
    window.ipcRenderer.send("connect-to-lcu")
  }
}

const tabs = computed(() => {
  if (
    allChampions.value &&
    arenaOcean.value &&
    arenaChampion.value &&
    aramChamps.value
  ) {
    return [arenaOcean.value, arenaChampion.value, aramChamps.value]
  }
  return []
})

const selectedTabIndex = ref(0)
</script>

<template>
  <div class="app">
    <div class="tabs">
      <div
        v-for="(challenge, idx) in tabs"
        @click="selectedTabIndex = idx"
        class="tab"
        :class="{ selected: selectedTabIndex === idx }"
      >
        {{ challenge.name }}
      </div>
    </div>
    <button class="refresh" @click="onClickRefresh">Refresh</button>
    <div class="challenges" v-if="credentials && allChampions">
      <ChallengeSection
        v-if="tabs[selectedTabIndex]"
        :challenge="tabs[selectedTabIndex]"
        :all-champions="allChampions"
      />
    </div>
    <div v-else>Waiting for a client...</div>
  </div>
</template>

<style>
.app {
  padding: 16px;
  border-top: solid 2px #785a28;
  background: linear-gradient(#091428, #0a1428);
  position: relative;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
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

button.refresh {
  z-index: 2;
  position: fixed;
  right: 24px;
  top: 16px;
  font-family: "Spiegel";
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 8px 16px;
  background: #1e2328;
  color: #cdbe91;
  box-shadow: inset 0 0 2px #000000;
  border-image: linear-gradient(to bottom, #c8aa6d, #7a5c29);
  border-image-slice: 1;
  border-width: 2px;
}

button.refresh:hover {
  text-shadow: 0 0 5px #ffffff80;
  box-shadow: 0 0 8px 0 #ffffff50;
  background: linear-gradient(to bottom, #1e2328, #433d2b);
  cursor: pointer;
  transition: 0.1s;
}

button.refresh:active {
  text-shadow: none;
  box-shadow: none;
  color: #cdbe9130;
}
</style>
