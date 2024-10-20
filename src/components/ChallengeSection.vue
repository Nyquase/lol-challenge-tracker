<script setup lang="ts">
import { computed, ref } from "vue"
import { AramStats, Challenge, Champion, Stat } from "../types/lol"
import AramStatBox from "./AramStatBox.vue"

const Filters = ["All", "Not Done", "Done"] as const
type Filter = (typeof Filters)[number]

const props = defineProps<{
  challenge: Challenge
  allChampions: Champion[]
  isColoredWhenDone: boolean
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
const search = ref<string>("")

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
    <div class="champion-icons">
      <a
        v-for="champ in championsList"
        :href="championBuildLink(champ)"
        target="_blank"
      >
        <p class="name">{{ champ.name }}</p>
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
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 4px;
  transform: translate(-50%, -50%);
  color: #c8aa6e;
  z-index: 1;
}
a img {
  position: relative;
}
a:hover .name {
  display: initial;
}
</style>
