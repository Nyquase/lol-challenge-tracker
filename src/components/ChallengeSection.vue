<script setup lang="ts">
import { computed, ref } from "vue"
import { Challenge, Champion } from "../types/lol"

const Filters = ["All", "Not Done", "Done"] as const
type Filter = (typeof Filters)[number]

const props = defineProps<{
  challenge: Challenge
  allChampions: Champion[]
  isColoredWhenDone: boolean
}>()

const championBuildLink = (champ: Champion) => {
  switch (props.challenge.mode) {
    case "Arena":
      return `https://www.op.gg/modes/arena/${champ.alias.toLowerCase()}/build?region=global`
    case "Aram":
      return `https://aram.zone/champion/${champ.alias.toLowerCase()}`
  }
}

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
      c.alias.toLocaleLowerCase().includes(search.value.toLowerCase())
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
        <select v-model="filter">
          <option v-for="filter in Filters" :value="filter">
            {{ filter }}
          </option>
        </select>
        <input v-model="search" type="search" placeholder="Search" />
      </div>
    </div>
    <p>{{ challenge.description }}</p>
    <div class="champion-icons">
      <a
        v-for="champ in championsList"
        :href="championBuildLink(champ)"
        target="_blank"
      >
        <p class="name">{{ champ.alias }}</p>
        <img
          :class="{ greyed: isColoredWhenDone ? champ.done : !champ.done }"
          :src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.id}.png`"
          :alt="champ.id"
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

.filters {
  display: flex;
}

select,
input {
  margin-left: 32px;
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

input::-webkit-search-cancel-button {
  cursor: pointer;
}

input:focus {
  outline: none;
  box-shadow: 0 0 8px 0 #ffffff50;
}

select:hover {
  text-shadow: 0 0 5px #ffffff80;
  background: linear-gradient(to bottom, #1e2328, #433d2b);
  cursor: pointer;
  transition: 0.1s;
}

option {
  font-family: "Spiegel";
  font-size: 15px;
  letter-spacing: 1px;
  padding: 8px 16px;
  background: #1e2328;
  color: #cdbe91;
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
