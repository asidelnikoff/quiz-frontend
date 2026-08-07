/**
 * Простой debounce без внешних зависимостей.
 * Используется, чтобы пачка WS-событий (несколько сообщений подряд)
 * не порождала пачку отдельных REST-запросов на обновление списка чатов.
 */
export function debounce(fn, delayMs) {
  let timer = null

  function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delayMs)
  }

  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
  }

  return debounced
}