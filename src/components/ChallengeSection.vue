<script setup lang="ts">
import { Challenge, Champion, Mode } from "../types/lol"

defineProps<{
  challenge: Challenge
  allChampions: Champion[]
  mode: Mode
}>()

const championBuildLink = (mode: Mode, champ: Champion) => {
  switch (mode) {
    case "Arena":
      return `https://www.op.gg/modes/arena/${champ.alias.toLowerCase()}/build?region=global`
    case "Aram":
      return `https://aram.zone/champion/${champ.alias.toLowerCase()}`
  }
}
</script>

<template>
  <div class="challenge">
    <h1>
      {{ challenge.name }} ({{ challenge.totalDone }} /
      {{ allChampions.length }})
    </h1>
    <div class="champion-icons">
      <a
        v-for="champ in challenge.champions"
        :href="championBuildLink(mode, champ)"
        target="_blank"
      >
        <p class="name">{{ champ.alias }}</p>
        <img
          :class="{ done: champ.done }"
          :src="`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.id}.png`"
          :alt="champ.id"
        />
      </a>
    </div>
  </div>
</template>

<style scoped>
.champion-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
h1 {
  font-family: "BeaufortforLol Medium";
  font-size: 2.5em;
  text-transform: uppercase;
  margin: 16px 0;
}
.done {
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
