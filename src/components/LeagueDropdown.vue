<script setup lang="ts" generic="T">
import { ref, computed, onMounted, onUnmounted } from "vue"

type Option = {
  name: string
  value: T
}

const props = defineProps<{
  options: Option[]
  modelValue: T
}>()

const emit = defineEmits(["update:modelValue"])

const isOpen = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)

const selectedOptionLabel = computed(() => {
  return (
    props.options.find((option) => option.value === props.modelValue)?.name ??
    ""
  )
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option: Option) => {
  emit("update:modelValue", option.value)
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
})
</script>

<template>
  <div class="league-dropdown" ref="dropdownRef">
    <div class="league-dropdown-selected" @click="toggleDropdown">
      <span>{{ selectedOptionLabel }}</span>
      <div class="dropdown-arrow" :class="{ 'arrow-up': isOpen }"></div>
    </div>
    <div class="league-dropdown-menu" :class="{ open: isOpen }">
      <div
        v-for="(option, idx) in options"
        :key="idx"
        class="league-dropdown-item"
        :class="{ selected: option.value == modelValue }"
        @click="selectOption(option)"
      >
        {{ option.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.league-dropdown {
  position: relative;
  width: 300px;
  user-select: none;
}

.league-dropdown-selected {
  padding: 8px 40px 8px 16px;
  background: linear-gradient(to bottom, #1e2328 0%, #433d2b 100%);
  border: 2px solid;
  border-image: linear-gradient(to bottom, #c8aa6d, #7a5c29);
  border-image-slice: 1;
  color: #cdbe91;
  font-family: "BeaufortforLOL Bold";
  font-size: 16px;
  letter-spacing: 1px;
  cursor: pointer;
  text-transform: uppercase;
  position: relative;
  overflow: hidden; /* Add this to prevent artifacts */
}

.league-dropdown-selected:hover {
  box-shadow: 0 0 10px #c8aa6d80;
  text-shadow: 0 0 5px #ffffff80;
}

.dropdown-arrow {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid #c8aa6d;
  transition: transform 0.2s ease;
  pointer-events: none; /* Ensure it doesn't interfere with clicks */
  z-index: 2; /* Make sure arrow is above content */
}

.dropdown-arrow.arrow-up {
  transform: translateY(-50%) rotate(180deg);
}

.league-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 98%;
  max-height: 0;
  overflow: hidden;
  background: #010a13;
  border: 2px solid transparent;
  border-top: none;
  border-image: linear-gradient(to bottom, #7a5c29, #c8aa6d);
  border-image-slice: 1;
  z-index: 10;
  transition: max-height 0.3s ease, opacity 0.2s ease;
  opacity: 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
}

.league-dropdown-menu.open {
  max-height: 300px;
  overflow-y: auto;
  opacity: 1;
}

.league-dropdown-item {
  padding: 12px 16px;
  background: #1e2328;
  color: #cdbe91;
  font-family: "BeaufortforLOL Bold";
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid #3c3c41;
  cursor: pointer;
}

.league-dropdown-item:hover {
  background: #2a2f36;
  color: #f0e6d2;
}

.league-dropdown-item.selected {
  background: #293547;
  color: #0ac8b9;
  font-weight: bold;
}

.league-dropdown-menu::-webkit-scrollbar {
  width: 10px;
  background-color: #1e2328;
}

.league-dropdown-menu::-webkit-scrollbar-thumb {
  background: #785a28;
  border-radius: 4px;
}

.league-dropdown-menu::-webkit-scrollbar-track {
  background: #1e2328;
  border-radius: 4px;
}
</style>
