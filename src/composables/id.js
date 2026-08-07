/**
 * Генерирует client_message_id для отправляемого сообщения.
 * Важно: генерируется один раз на логическое действие "отправить" и переиспользуется
 * при ретраях того же сообщения — иначе идемпотентность на бэкенде теряет смысл
 * (см. обсуждение: сервер дедуплицирует по (chat_id, sender_id, client_message_id)).
 */
export function generateClientMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
 
  // Фоллбэк для окружений без crypto.randomUUID (старые браузеры / не-secure context)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
