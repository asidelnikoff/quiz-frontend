import { ref } from 'vue'
import chatService from '@/api/services/chatService'
import { consoleError } from 'vuetify/lib/util/console.mjs'

const PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 300

export function useChats() {
  const items = ref([])
  const totalCount = ref(0)
  const offset = ref(0)
  const search = ref('')

  const isLoading = ref(false) // первичная загрузка / загрузка после нового поиска
  const isLoadingMore = ref(false) // подгрузка следующей страницы
  const error = ref(null)

  let searchDebounceTimer = null
  let requestToken = 0 // защита от гонки: устаревший ответ не должен перезаписать свежий

  async function load({ reset = false } = {}) {
    if (reset) {
      offset.value = 0
    }

    const targetOffset = offset.value
    const currentToken = ++requestToken

    if (targetOffset === 0) {
      isLoading.value = true
    } else {
      isLoadingMore.value = true
    }
    error.value = null

    try {
      const trimmedSearch = search.value.trim()
      console.log('requesting chats list')
      const response = (await chatService.getChatsList({
        pagination: { limit: PAGE_SIZE, offset: targetOffset },
        search: trimmedSearch === '' ? null : trimmedSearch
      })).data
      console.log('got chat list', response)

      // Пришёл ответ на устаревший запрос (например, юзер быстро сменил поисковую строку) — игнорируем
      if (currentToken !== requestToken) return

      items.value = targetOffset === 0 ? response.items : [...items.value, ...response.items]
      totalCount.value = response.count
    } catch (e) {
      if (currentToken !== requestToken) return
      error.value = e
    } finally {
      if (currentToken === requestToken) {
        isLoading.value = false
        isLoadingMore.value = false
      }
    }
  }

  function hasMore() {
    return items.value.length < totalCount.value
  }

  async function loadMore() {
    if (isLoading.value || isLoadingMore.value || !hasMore()) return
    offset.value += 1
    await load()
  }

  function setSearch(value) {
    search.value = value
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => {
      load({ reset: true })
    }, SEARCH_DEBOUNCE_MS)
  }

  function refresh() {
    return load({ reset: false })
  }

  return {
    items,
    totalCount,
    isLoading,
    isLoadingMore,
    error,
    search,
    setSearch,
    load,
    loadMore,
    hasMore,
    refresh
  }
}
