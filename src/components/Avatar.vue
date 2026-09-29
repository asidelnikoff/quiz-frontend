<script setup>
import { avatarColorFor } from './utils/avatar'

const props = defineProps({
  user: { type: Object, required: true }
})

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
</script>

<template>
    <div class="profile-page__avatar" :style="{ background: avatarColorFor(user.id) }">
          {{ initials(user.name) }}
    </div>
</template>

<style scoped>
.profile-page__avatar {
  align-self: center;
  width: 72px;
  height: 72px;
  border-radius: var(--fold-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}
</style>