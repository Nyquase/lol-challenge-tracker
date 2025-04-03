<script setup lang="ts">
import { computed, ref } from "vue"
import { AramStats, Challenge, Champion } from "../types/lol"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faCheck } from "@fortawesome/free-solid-svg-icons"
import AramStatBox from "./AramStatBox.vue"
import LeagueDropdown from "./LeagueDropdown.vue"

const Filters = ["All", "Not Done", "Done"] as const
type Filter = (typeof Filters)[number]

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

const filterOptions = computed(() => {
  return Filters.map(filter => ({
    name: filter,
    value: filter
  }));
});
</script>

<template>
  <div class="challenge">
    <div class="heading">
      <h1>
        {{ challenge.name }} ({{ challenge.totalDone }} /
        {{ allChampions.length }})
      </h1>
      <div class="filters">
        <LeagueDropdown
          v-model="filter"
          :options="filterOptions"
        />
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

    <div class="selected-champ-container">
      <div>
        <div class="selected-champ-text">Champ Select</div>
        <div class="champion">
          <a
            :href="selectedChamp ? championBuildLink(selectedChamp) : ''"
            target="_blank"
          >
            <p v-if="selectedChamp" class="name">{{ selectedChamp.name }}</p>
            <img
              v-if="selectedChamp"
              :class="{
                greyed: isColoredWhenDone
                  ? selectedChamp.done
                  : !selectedChamp.done,
              }"
              :src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${selectedChamp.id}.png`"
              :alt="selectedChamp.id"
            />
            <img
              v-else
              :src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`"
              alt="-1"
            />
            <div v-if="selectedChamp && selectedChamp.done" class="check-mark">
              <FontAwesomeIcon :icon="faCheck" />
            </div>
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
          </a>
        </div>
      </div>
    </div>

    <div class="champions-container">
      <div v-for="champ in championsList" class="champion">
        <a :href="championBuildLink(champ)" target="_blank">
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
        <div v-if="champ.done" class="check-mark">
          <FontAwesomeIcon :icon="faCheck" />
        </div>
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

input.search::-webkit-search-cancel-button {
  position: relative;
  -webkit-appearance: none;
  height: 20px;
  width: 20px;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cdbe91'><path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/></svg>");
  cursor: pointer;
  margin-right: 4px;
  padding: 5px;
}

input.search::-webkit-search-cancel-button:hover {
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f0e6d2'><path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/></svg>");
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
</style>
