<script setup lang="ts">
import { computed, ref } from "vue"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faGear } from "@fortawesome/free-solid-svg-icons"

import { LCUCredentials, RawChallenge } from "./types/lcu"
import { Challenge, Champion } from "./types/lol"
import { StoredSettings } from "./types/app"
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
import Settings from "./components/Settings.vue"

const credentials = ref<LCUCredentials | null>(null)
const allChampions = ref<Champion[] | null>(null)
const arenaOcean = ref<Challenge | null>(null)
const arenaChampion = ref<Challenge | null>(null)
const aramChamps = ref<Challenge | null>(null)

window.ipcRenderer.send("app-ready")

const fetchAll = async () => {
  if (credentials.value === null) return
  try {
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
  } catch (e) {}
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
const isColoredWhenDone = ref(false)

const setTabIndex = (idx: number) => {
  selectedTabIndex.value = idx
  window.ipcRenderer.send("store-set", "tab-index", idx.toString())
}

const updateSettings = (settings: StoredSettings) => {
  isColoredWhenDone.value = settings.isColoredWhenDone
  window.ipcRenderer.send("store-set", "settings", JSON.stringify(settings))
}

window.ipcRenderer.on(
  "credentials",
  async (_event, newCredentials: LCUCredentials) => {
    credentials.value = newCredentials
    await fetchAll()
    const storedTabIdx = await window.ipcRenderer.invoke(
      "store-get",
      "tab-index"
    )

    const storedSettings = await window.ipcRenderer.invoke(
      "store-get",
      "settings"
    )

    if (storedSettings) {
      const settings: StoredSettings = JSON.parse(storedSettings)
      isColoredWhenDone.value = settings.isColoredWhenDone
    }

    if (storedTabIdx) {
      selectedTabIndex.value = Number(storedTabIdx)
    }
  }
)

window.ipcRenderer.on("refetch", fetchAll)

const settingsVisible = ref(false)

const onClickSettings = () => {
  settingsVisible.value = !settingsVisible.value
}
</script>

<template>
  <div class="app">
    <div class="tabs">
      <div
        v-for="(challenge, idx) in tabs"
        @click="setTabIndex(idx)"
        class="tab"
        :class="{ selected: selectedTabIndex === idx }"
      >
        {{ challenge.name }}
      </div>
    </div>
    <button class="league-button settings-button" @click="onClickSettings">
      <FontAwesomeIcon :icon="faGear" />
    </button>
    <div class="challenges" v-if="credentials && allChampions">
      <ChallengeSection
        v-if="tabs[selectedTabIndex]"
        :challenge="tabs[selectedTabIndex]"
        :all-champions="allChampions"
        :isColoredWhenDone="isColoredWhenDone"
      />
    </div>
    <div v-else>Waiting for a client...</div>
    <Settings
      v-model:visible="settingsVisible"
      :isColoredWhenDone="isColoredWhenDone"
      @update:isColoredWhenDone="
        (v) => updateSettings({ isColoredWhenDone: v })
      "
      @refetch="fetchAll"
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
