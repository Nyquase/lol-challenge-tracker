<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faClose } from "@fortawesome/free-solid-svg-icons"
import { faGithub } from "@fortawesome/free-brands-svg-icons"

const emit = defineEmits(["refetch"])

const visible = defineModel<boolean>("visible", { required: true })
const isColoredWhenDone = defineModel<boolean>("isColoredWhenDone", {
  required: true,
})
</script>

<template>
  <div class="settings" :class="{ hidden: !visible }">
    <div class="heading-container">
      <p class="heading">Settings</p>
      <FontAwesomeIcon
        class="close-button"
        @click="visible = false"
        :icon="faClose"
      />
    </div>
    <div class="container">
      <button class="league-button refresh" @click="emit('refetch')">
        Refresh challenges
      </button>

      <button
        class="league-button view-mode"
        @click="isColoredWhenDone = !isColoredWhenDone"
      >
        Completed champions are {{ isColoredWhenDone ? "colored" : "greyed" }}
      </button>
    </div>

    <div class="footer">
      <a
        class="about"
        href="https://github.com/Nyquase/lol-challenge-tracker"
        target="_blank"
      >
        <FontAwesomeIcon class="about-icon" :icon="faGithub" />Project sources
      </a>
    </div>
  </div>
</template>

<style scoped>
.settings {
  position: absolute;
  top: 260px;
  right: 16px;
  top: 74px;
  background-color: grey;
  z-index: 10;
  font-size: 16px;
  background: var(--main-bg-gradient);
  color: #cdbe91;
  box-shadow: inset 0 0 2px #000000, 4px 4px 8px #000;
  border: solid 2px #785a28;
  cursor: initial;
}

.heading-container {
  display: flex;
  justify-content: space-between;
  border-bottom: solid 1px #785a28;

  padding: 12px;
}

.heading {
  font-family: "BeaufortforLOL Bold";
  text-transform: uppercase;
  font-size: 20px;
  margin: 0;
  line-height: 1;
}

.close-button {
  cursor: pointer;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.settings.hidden {
  display: none;
}

button {
  padding: 8px;
}

.footer {
  display: flex;
  gap: 8px;
  margin: 12px;
  margin-top: 0;
  justify-content: center;
}

.about {
  color: #0397ab;
  /* text-decoration: none; */
}
.about-icon {
  font-size: 22px;
  margin-right: 4px;
}
</style>
