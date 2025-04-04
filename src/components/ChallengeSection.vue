<script setup lang="ts">
import { computed, ref } from "vue"
import {
  AramStats,
  Challenge,
  Champion,
  ChampionRole,
  ChampionRoles,
} from "../types/lol"
import AramStatBox from "./AramStatBox.vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faUserNinja,
  faFistRaised,
  faHatWizard,
  faCrosshairs,
  faHandHoldingHeart,
  faShieldAlt,
  faCheck,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons"
import LeagueDropdown from "./LeagueDropdown.vue"

const Filters = ["All", "Not Done", "Done"] as const
type Filter = (typeof Filters)[number]

const typeIcons: Record<ChampionRole, IconDefinition> = {
  assassin: faUserNinja,
  fighter: faFistRaised,
  mage: faHatWizard,
  marksman: faCrosshairs,
  support: faHandHoldingHeart,
  tank: faShieldAlt,
}

const props = defineProps<{
  challenge: Challenge
  allChampions: Champion[]
  selectedChamp: Challenge["champions"][number] | null
  isColoredWhenDone: boolean
  showChampionNames: boolean
  stats: AramStats | null
}>()

const championBuildLink = (champ: Champion) => {
  switch (props.challenge.mode) {
    case "Arena":
      return `https://www.op.gg/modes/arena/${champ.alias.toLowerCase()}/build?region=global`
    case "Aram":
      return `https://aram.zone/champion/${champ.alias.toLowerCase()}`
    case "Rift":
      return `https://u.gg/lol/champions/${champ.alias.toLowerCase()}/build`
  }
}

const showAramStats = ref(false)
const filter = ref<Filter>("All")
const selectedTypes = ref<Set<ChampionRole>>(new Set())
const search = ref<string>("")

const toggleType = (type: ChampionRole) => {
  if (selectedTypes.value.has(type)) {
    selectedTypes.value.delete(type)
  } else {
    selectedTypes.value.add(type)
  }
}

const capitalize = (v: string) => {
  return v.charAt(0).toUpperCase() + v.slice(1)
}

const championsList = computed(() => {
  let list = props.challenge.champions
  switch (filter.value) {
    case "All":
      list = props.challenge.champions
      break
    case "Done":
      list = props.challenge.champions.filter((c) => c.done)
      break
    case "Not Done":
      list = props.challenge.champions.filter((c) => !c.done)
      break
  }

  if (selectedTypes.value.size > 0) {
    // We don't filter on the secondary role, it doesn't narrow enough
    // e.g. Riven, Lucian would count as assassins
    list = list.filter((c) => selectedTypes.value.has(c.roles[0]))
  }

  if (search.value) {
    return list.filter((c) =>
      c.name.toLocaleLowerCase().includes(search.value.toLowerCase())
    )
  }

  return list
})

const filterOptions = computed(() => {
  return Filters.map((filter) => ({
    name: filter,
    value: filter,
  }))
})
</script>

<template>
  <div class="challenge">
    <div class="heading">
      <h1>
        {{ challenge.name }} ({{ challenge.totalDone }} /
        {{ allChampions.length }})
      </h1>
      <div class="filters">
        <LeagueDropdown v-model="filter" :options="filterOptions" />
        <input
          class="league-input search"
          v-model="search"
          type="search"
          placeholder="Search"
        />
      </div>
    </div>
    <div class="description-container">
      <p>{{ challenge.description }}</p>

      <div v-if="challenge.mode === 'Aram'" class="stats-checkbox">
        <input type="checkbox" id="show-stats" v-model="showAramStats" />
        <label for="show-stats">Show ARAM balance changes</label>
      </div>
    </div>

    <div class="type-filters-container">
      <div class="type-filters">
        <button
          v-for="type in ChampionRoles"
          :key="type"
          class="league-button type-button"
          :class="{ active: selectedTypes.has(type) }"
          @click="toggleType(type)"
        >
          <FontAwesomeIcon :icon="typeIcons[type]" />
          <span>{{ capitalize(type) }}</span>
        </button>
      </div>
    </div>

    <div class="selected-champ-container">
      <div>
        <div class="selected-champ-text">Champ Select Preview</div>
        <div class="champion">
          <a
            :href="selectedChamp ? championBuildLink(selectedChamp) : ''"
            target="_blank"
          >
            <img
              v-if="selectedChamp"
              :class="{
                greyed: isColoredWhenDone
                  ? selectedChamp.done
                  : !selectedChamp.done,
              }"
              :src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${selectedChamp.id}.png`"
              :alt="selectedChamp.id.toString()"
            />
            <img
              v-else
              :src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
              alt="-1"
            />
            <div v-if="selectedChamp && selectedChamp.done" class="check-mark">
              <FontAwesomeIcon :icon="faCheck" />
            </div>
          </a>
          <AramStatBox
            v-if="
              selectedChamp &&
              challenge.mode === 'Aram' &&
              stats &&
              showAramStats &&
              stats[selectedChamp.alias]
            "
            :stats="stats[selectedChamp.alias]"
          />
        </div>
      </div>
    </div>

    <div class="champions-container">
      <div v-for="champ in championsList" class="champion">
        <a :href="championBuildLink(champ)" target="_blank">
          <img
            :class="{ greyed: isColoredWhenDone ? champ.done : !champ.done }"
            :src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.id}.png`"
            :alt="champ.id.toString()"
          />
        </a>
        <div v-if="champ.done" class="check-mark">
          <FontAwesomeIcon :icon="faCheck" />
        </div>
        <AramStatBox
          v-if="
            challenge.mode === 'Aram' &&
            stats &&
            showAramStats &&
            stats[champ.alias]
          "
          :stats="stats[champ.alias]"
        />
        <p class="name" v-if="showChampionNames">{{ champ.name }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.description-container {
  display: flex;
  justify-content: space-between;
}

.filters {
  display: flex;
  align-items: center;
}

.stats-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.stats-checkbox input {
  height: 16px;
  width: 16px;
  accent-color: #0ac8b9;
  margin-right: 8px;
  cursor: pointer;
}
.stats-checkbox label {
  cursor: pointer;
}

select,
input.search {
  margin-left: 32px;
}

.selected-champ-container {
  display: flex;
  margin-bottom: 16px;
}

.champions-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

h1 {
  font-family: "BeaufortforLol Bold";
  font-size: 2.5em;
  text-transform: uppercase;
  margin: 0;
}

p {
  margin: 0;
  margin-bottom: 8px;
}

.greyed {
  filter: brightness(30%);
}

.champion {
  position: relative;
}

.champion:hover {
  filter: brightness(150%);
}

.champion a {
  display: block;
  width: 128px;
  height: 128px;
  border: 1px solid #3c3c41;
  text-decoration: none;
}

.name {
  text-align: center;
  line-height: 1;
  padding: 4px;
  color: #a09b8c;
  white-space: nowrap;
}

img {
  height: 128px;
  width: 128px;
}

.check-mark {
  position: absolute;
  z-index: 1;
  top: -8px;
  right: -8px;
  background-color: #0ac8b9;
  border-radius: 50%;
  border: 2px solid black;
  padding: 2px 6px;
  font-size: 14px;
  color: black;
  font-weight: bold;
}

.type-filters-container {
  display: flex;
  margin: 16px 0;
}

.type-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.type-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
}

.type-button.active {
  background: linear-gradient(to bottom, #433d2b, #1e2328);
  color: #0ac8b9;
}
</style>
