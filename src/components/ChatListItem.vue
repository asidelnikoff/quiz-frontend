<script setup>
const props = defineProps({
  chat: { type: Object, required: true }
})

defineEmits(['open'])

// Небольшая курируемая палитра для монограмм — не случайные цвета, а часть общей системы
const AVATAR_PALETTE = ['#e8593b', '#2f9e8f', '#4a6fa5', '#b5838d', '#8c7851', '#5c6b73']

function avatarColor(chatId) {
  return AVATAR_PALETTE[chatId % AVATAR_PALETTE.length]
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function previewText(chat) {
  const message = chat.last_message
  if (!message) return 'Нет сообщений'
  const prefix = message.is_sender ? 'Вы: ' : `${message.sender.firstname}: `
  return prefix + message.content
}

function unreadLabel(count) {
  return count > 99 ? '99+' : String(count)
}
</script>

<template>
  <button
    type="button"
    class="chat-row"
    :class="{ 'chat-row--unread': chat.unread_count > 0 }"
    @click="$emit('open', chat.chat_id)"
  >
    <span class="chat-row__avatar" :style="{ background: avatarColor(chat.chat_id) }">
      {{ initials(chat.name) }}
      <span v-if="chat.unread_count > 0" class="chat-row__fold" aria-hidden="true" />
    </span>

    <span class="chat-row__body">
      <span class="chat-row__name">{{ chat.name }}</span>

      <span class="chat-row__preview-line">
        <span class="chat-row__preview">
          <i
            v-if="chat.last_message?.is_sender && chat.last_message?.is_read"
            class="pi pi-check-circle chat-row__receipt chat-row__receipt--read"
          />
          <i
            v-else-if="chat.last_message?.is_sender"
            class="pi pi-check chat-row__receipt"
          />
          {{ previewText(chat) }}
        </span>

        <span v-if="chat.unread_count > 0" class="chat-row__badge">
          {{ unreadLabel(chat.unread_count) }}
        </span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.chat-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid var(--fold-border);
  background: var(--fold-surface);
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.12s ease;
}

.chat-row:hover {
  background: var(--fold-surface-hover);
}

.chat-row:focus-visible {
  outline: 2px solid var(--fold-teal);
  outline-offset: -2px;
}

.chat-row__avatar {
  position: relative;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: var(--fold-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.02em;
  overflow: hidden;
}

/* Сигнатурный элемент: загнутый уголок карточки-аватара для непрочитанных чатов —
   метафора "непрочитанной страницы" */
.chat-row__fold {
  position: absolute;
  top: 0;
  right: 0;
  width: 14px;
  height: 14px;
  background: var(--fold-coral);
  clip-path: polygon(100% 0, 0 0, 100% 100%);
}

.chat-row__body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chat-row__name {
  font-weight: 600;
  font-size: 14.5px;
  color: var(--fold-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-row--unread .chat-row__name {
  font-weight: 700;
}

.chat-row__preview-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-row__preview {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--fold-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-row--unread .chat-row__preview {
  color: var(--fold-ink);
}

.chat-row__receipt {
  font-size: 12px;
  color: var(--fold-muted);
  flex-shrink: 0;
}

.chat-row__receipt--read {
  color: var(--fold-teal);
}

.chat-row__badge {
  flex-shrink: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--fold-coral);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
