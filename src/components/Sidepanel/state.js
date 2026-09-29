import { ref, computed } from 'vue'

export const collapsed = ref(false)
export const isVisible = ref(true)
export const toggleSidebarCollpsed = () => (collapsed.value = !collapsed.value)
export const showSidebar = () => (isVisible.value = true)
export const hideSidebar = () => (isVisible.value = false)

export const SIDEBAR_WIDTH = 200
export const SIDEBAR_WIDTH_COLLAPSED = 55
export const sidebarWidth = computed(
  () => `${isVisible.value ? collapsed.value ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH : 0}px`
)