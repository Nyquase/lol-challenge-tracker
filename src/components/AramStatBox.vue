<script setup lang="ts">
import { AramStats, ChampionStats } from "../types/lol"

const props = defineProps<{
  stats: ChampionStats
}>()

const formatStat = (value: number) => {
  return value > 0 ? `+${value}%` : `${value}%`
}
</script>

<template>
  <div class="stats">
    <div v-if="stats.aramDamageDealt !== 0">
      Damage Dealt:
      <span :class="{ nerf: stats.aramDamageDealt < 0 }">
        {{ formatStat(stats.aramDamageDealt) }}
      </span>
    </div>
    <div v-if="stats.aramDamageTaken !== 0">
      Damage Taken:
      <span :class="{ nerf: stats.aramDamageTaken < 0 }">
        {{ formatStat(stats.aramDamageTaken) }}
      </span>
    </div>
    <div v-if="stats.aramAbilityHaste !== 1">
      Ability Haste:
      <span :class="{ nerf: stats.aramAbilityHaste < 0 }">
        {{ stats.aramAbilityHaste }}
      </span>
    </div>
    <div v-if="stats.aramAttackSpeed !== 0">
      Attack Speed:
      <span :class="{ nerf: stats.aramAttackSpeed < 0 }">
        {{ formatStat(stats.aramAttackSpeed) }}
      </span>
    </div>
    <div v-if="stats.aramEnergyRegen !== 0">
      Energy Regen:
      <span :class="{ nerf: stats.aramEnergyRegen < 0 }">
        {{ formatStat(stats.aramEnergyRegen) }}
      </span>
    </div>
    <div v-if="stats.aramTenacity !== 0">
      Tenacity:
      <span :class="{ nerf: stats.aramTenacity < 0 }">
        {{ formatStat(stats.aramTenacity) }}
      </span>
    </div>
    <div v-if="stats.aramShielding !== 0">
      Shielding:
      <span :class="{ nerf: stats.aramShielding < 0 }">
        {{ formatStat(stats.aramShielding) }}
      </span>
    </div>
    <div v-if="stats.aramHealing !== 0">
      Healing:
      <span :class="{ nerf: stats.aramHealing < 0 }">
        {{ formatStat(stats.aramHealing) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.stats {
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  font-size: 12px;
  color: #0ac8b9;
  background-color: rgba(0, 0, 0, 0.8);
  width: 100%;
}

.stats div {
  display: flex;
}

.stats div span {
  margin-left: 4px;
  font-weight: bold;
  color: #0f0;
}
.stats div span.nerf {
  color: #f00;
}
</style>
