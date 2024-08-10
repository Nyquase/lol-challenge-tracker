<script setup lang="ts">
import { ref } from "vue"
import { LCUCredentials, RawChallenge } from "./types/lcu"
import { Challenge, Champion } from "./types/lol"
import {
  challengeFromCompletedIds as challengeFromRaw,
  makeRequest,
} from "./helpers/utils"
import {
  ARAM_CHAMPS_CHALLENGE_ID,
  ARENA_CHAMPION_CHALLENGE_ID,
  ARENA_OCEAN_CHALLENGE_ID,
} from "./contants"
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
    allChamps
  )

  arenaChampion.value = challengeFromRaw(
    allChallenges[ARENA_CHAMPION_CHALLENGE_ID],
    allChamps
  )

  aramChamps.value = challengeFromRaw(
    allChallenges[ARAM_CHAMPS_CHALLENGE_ID],
    allChamps
  )
}

window.ipcRenderer.on(
  "credentials",
  async (_event, newCredentials: LCUCredentials) => {
    credentials.value = newCredentials
    await fetchAll()
  }
)

const onClickRefresh = () => {
  fetchAll()
}
</script>

<template>
  <div class="app">
    <button class="refresh" @click="onClickRefresh">Refresh</button>
    <div class="challenges" v-if="credentials">
      <ChallengeSection
        v-if="allChampions && arenaOcean"
        :challenge="arenaOcean"
        :all-champions="allChampions"
        mode="Arena"
      />
      <ChallengeSection
        v-if="allChampions && arenaChampion"
        :challenge="arenaChampion"
        :all-champions="allChampions"
        mode="Arena"
      />
      <ChallengeSection
        v-if="allChampions && aramChamps"
        :challenge="aramChamps"
        :all-champions="allChampions"
        mode="Aram"
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
