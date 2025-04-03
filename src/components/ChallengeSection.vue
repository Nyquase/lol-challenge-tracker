<script setup lang="ts">
import { computed, ref } from "vue"
import { AramStats, Challenge, Champion, ChampionType, Stat } from "../types/lol"
import AramStatBox from "./AramStatBox.vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { 
  faUserNinja, 
  faFistRaised, 
  faHatWizard, 
  faCrosshairs, 
  faHandHoldingHeart, 
  faShieldAlt 
} from "@fortawesome/free-solid-svg-icons"

const Filters = ["All", "Not Done", "Done"] as const
type Filter = (typeof Filters)[number]

const ChampionTypes = ["Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"] as const
type TypeFilter = (typeof ChampionTypes)[number]

const typeIcons = {
  "Assassin": faUserNinja,
  "Fighter": faFistRaised,
  "Mage": faHatWizard,
  "Marksman": faCrosshairs,
  "Support": faHandHoldingHeart,
  "Tank": faShieldAlt
}

const props = defineProps<{
  challenge: Challenge
  allChampions: Champion[]
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
const selectedTypes = ref<Set<TypeFilter>>(new Set())
const search = ref<string>("")

const toggleType = (type: TypeFilter) => {
  if (selectedTypes.value.has(type)) {
    selectedTypes.value.delete(type)
  } else {
    selectedTypes.value.add(type)
  }
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
    list = list.filter((c) => selectedTypes.value.has(c.type))
  }

  if (search.value) {
    return list.filter((c) =>
      c.name.toLocaleLowerCase().includes(search.value.toLowerCase())
    )
  }

  return list
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
        <select class="league-select" v-model="filter">
          <option
            :class="{ selected: filter === f }"
            v-for="f in Filters"
            :value="f"
          >
            {{ f }}
          </option>
        </select>
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
          v-for="type in ChampionTypes" 
          :key="type"
          class="league-button type-button"
          :class="{ active: selectedTypes.has(type) }"
          @click="toggleType(type)"
        >
          <FontAwesomeIcon :icon="typeIcons[type]" />
          <span>{{ type }}</span>
        </button>
      </div>
    </div>
    
    <div class="champion-icons">
      <a
        v-for="champ in championsList"
        :href="championBuildLink(champ)"
        target="_blank"
      >
        <p class="name" v-if="showChampionNames">{{ champ.name }}</p>
        <img
          :class="{ greyed: isColoredWhenDone ? champ.done : !champ.done }"
          :src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.id}.png`"
          :alt="champ.id"
        />
        <AramStatBox
          v-if="
            challenge.mode === 'Aram' &&
            stats &&
            showAramStats &&
            stats[champ.alias]
          "
          :stats="stats[champ.alias]"
        />
      </a>
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
  gap: 8px;
}

.type-filters-container {
  display: flex;
  justify-content: center;
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

.champion-icons {
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
  filter: grayscale(100%) brightness(40%);
}
a {
  display: block;
  height: 120px;
  width: 120px;
  position: relative;
  text-align: center;
}
a:hover {
  filter: brightness(150%);
}
.name {
  display: block;
  position: absolute;
  top: 15%;
  left: 50%;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 4px;
  transform: translate(-50%, -50%);
  color: white;
  z-index: 1;
  white-space: nowrap;
}
a img {
  position: relative;
}
a:hover .name {
  display: initial;
}
</style>