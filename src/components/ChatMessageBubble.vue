<script setup>
defineProps({
  message: { type: Object, required: true }
})

defineEmits(['retry'])
</script>

<template>
  <div
    class="message-bubble"
    :class="message.is_sender ? 'message-bubble--own' : 'message-bubble--incoming'"
  >
    <div class="message-bubble__content">
      <span class="message-bubble__text">{{ message.content }}</span>

      <template v-if="message.is_sender">
        <i
          v-if="message.status === 'sending'"
          class="pi pi-clock message-bubble__receipt"
          aria-label="Отправляется"
        />
        <i
          v-else-if="message.status === 'failed'"
          class="pi pi-exclamation-triangle message-bubble__receipt message-bubble__receipt--failed"
          role="button"
          tabindex="0"
          aria-label="Не отправлено, повторить"
          @click="$emit('retry', message.client_message_id)"
          @keydown.enter="$emit('retry', message.client_message_id)"
        />
        <i
          v-else-if="message.is_read"
          class="pi pi-check-circle message-bubble__receipt message-bubble__receipt--read"
          aria-label="Прочитано"
        />
        <i v-else class="pi pi-check message-bubble__receipt" aria-label="Отправлено" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.message-bubble {
  display: flex;
  padding: 2px 16px;
}

.message-bubble--incoming {
  justify-content: flex-start;
}

.message-bubble--own {
  justify-content: flex-end;
}

.message-bubble__content {
  max-width: 78%;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 9px 12px;
  border-radius: var(--fold-radius-md);
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.message-bubble--incoming .message-bubble__content {
  background: var(--fold-surface);
  border: 1px solid var(--fold-border);
  color: var(--fold-ink);
  border-bottom-left-radius: 2px;
}

.message-bubble--own .message-bubble__content {
  background: var(--fold-ink);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.message-bubble__text {
  white-space: pre-wrap;
}

.message-bubble__receipt {
  flex-shrink: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1px;
}

.message-bubble__receipt--read {
  color: var(--fold-teal);
}

.message-bubble__receipt--failed {
  color: #ffd7d0;
  cursor: pointer;
}
</style>