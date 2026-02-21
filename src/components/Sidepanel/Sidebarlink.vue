<template>
  <Button variant="text" :raised="isActive">
    <router-link :to="to" :class="{ active: isActive }" class="w-full">
        <div class="flex items-center justify-between gap-2" style="height: 1.5rem;">
            <i :class="icon"/>
            <div class="text-start w-full">
            <span v-if="!collapsed">
                <slot />
            </span>
            </div>
            <i v-if="!collapsed" class="pi pi-angle-right"/>
        </div>
    </router-link>
  </Button>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { collapsed } from './state'
import { Button } from 'primevue';
import { success } from 'zod';

export default {
  props: {
    to: { type: String, required: true },
    icon: { type: String, required: true }
  },
  components: { Button },
  setup(props) {
    const route = useRoute()
    const isActive = computed(() => route.path === props.to)
    return { isActive, collapsed }
  }
}
</script>