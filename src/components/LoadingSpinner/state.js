import { ref } from 'vue'

export const isLoading = ref(false)
export const showSpinner = () => (isLoading.value = true)
export const hideSpinner = () => (isLoading.value = false)