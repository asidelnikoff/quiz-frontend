// Небольшая курируемая палитра для монограмм — не случайные цвета, а часть
// общей дизайн-системы (см. ChatListItem.vue, ProfilePage.vue).
const AVATAR_PALETTE = ['#e8593b', '#2f9e8f', '#4a6fa5', '#b5838d', '#8c7851', '#5c6b73']
 
export function avatarColorFor(id) {
  const numericId = typeof id === 'number' ? id : Number(id) || 0
  return AVATAR_PALETTE[Math.abs(numericId) % AVATAR_PALETTE.length]
}
