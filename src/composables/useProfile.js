import { ref, computed } from 'vue'
import authService from '@/api/services/authService'
import userService from '@/api/services/userService'

export function useProfile() {
  const user = ref(null) // снимок последних сохранённых на сервере данных
  const isLoading = ref(false)
  const loadError = ref(null)

  const loginInput = ref('')
  const firstnameInput = ref('')
  const lastnameInput = ref('')
  const patronymicInput = ref('')
  const passwordInput = ref('') // сервер никогда не присылает пароль — поле всегда стартует пустым

  const isSaving = ref(false)
  const saveError = ref(null)
  const saveSuccess = ref(false)

  const isDeleting = ref(false)
  const deleteError = ref(null)

  function resetFormFromUser(data) {
    loginInput.value = data.login ?? ''
    firstnameInput.value = data.firstname ?? ''
    lastnameInput.value = data.lastname ?? ''
    patronymicInput.value = data.patronymic ?? ''
    passwordInput.value = ''
  }

  async function load() {
    isLoading.value = true
    loadError.value = null
    try {
      const data = (await authService.getUser())?.data
      user.value = data
      resetFormFromUser(data)
    } catch (e) {
      loadError.value = e
    } finally {
      isLoading.value = false
    }
  }

  // Есть ли вообще что сохранять — сравнение с последним известным снимком,
  // а не просто "поле непустое". Используется и для disabled на кнопке
  // "Сохранить", и как ранний выход в save().
  const hasChanges = computed(() => {
    if (!user.value) return false
    return (
      loginInput.value.trim() !== (user.value.login ?? '') ||
      firstnameInput.value.trim() !== (user.value.firstname ?? '') ||
      lastnameInput.value.trim() !== (user.value.lastname ?? '') ||
      patronymicInput.value.trim() !== (user.value.patronymic ?? '') ||
      passwordInput.value.trim() !== ''
    )
  })

  async function save() {
    if (!user.value || isSaving.value) return

    if (!loginInput.value.trim()) {
      saveError.value = 'Логин не может быть пустым'
      return
    }
    if (!firstnameInput.value.trim() || !lastnameInput.value.trim()) {
      saveError.value = 'Имя и фамилия обязательны'
      return
    }
    if (!hasChanges.value) return

    isSaving.value = true
    saveError.value = null
    saveSuccess.value = false

    try {
      // Только реально изменившиеся поля — остальные null, чтобы бэкенд их
      // не трогал (см. обсуждение: "обновление если параметр передан и не null").
      const payload = {
        login:
          loginInput.value.trim() !== (user.value.login ?? '') ? loginInput.value.trim() : null,
        password: passwordInput.value.trim() !== '' ? passwordInput.value : null,
        firstname:
          firstnameInput.value.trim() !== (user.value.firstname ?? '')
            ? firstnameInput.value.trim()
            : null,
        lastname:
          lastnameInput.value.trim() !== (user.value.lastname ?? '')
            ? lastnameInput.value.trim()
            : null,
        patronymic:
          patronymicInput.value.trim() !== (user.value.patronymic ?? '')
            ? patronymicInput.value.trim()
            : null
      }

      await userService.updateUser(payload)

      // Контракт не описывает тело ответа updateUser — оптимистично считаем,
      // что бэкенд принял ровно то, что мы отправили, и обновляем локальный
      // снимок этими значениями (иначе hasChanges продолжил бы считать
      // сохранённые изменения "неcохранёнными").
      user.value = {
        ...user.value,
        login: loginInput.value.trim(),
        firstname: firstnameInput.value.trim(),
        lastname: lastnameInput.value.trim(),
        patronymic: patronymicInput.value.trim()
      }
      passwordInput.value = ''
      saveSuccess.value = true
    } catch (e) {
      saveError.value = 'Не удалось сохранить изменения'
    } finally {
      isSaving.value = false
    }
  }

  async function remove() {
    isDeleting.value = true
    deleteError.value = null
    try {
      await authService.deleteUser()
      return true
    } catch (e) {
      deleteError.value = 'Не удалось удалить аккаунт'
      return false
    } finally {
      isDeleting.value = false
    }
  }

  return {
    user,
    isLoading,
    loadError,
    load,
    loginInput,
    firstnameInput,
    lastnameInput,
    patronymicInput,
    passwordInput,
    hasChanges,
    isSaving,
    saveError,
    saveSuccess,
    save,
    isDeleting,
    deleteError,
    remove
  }
}