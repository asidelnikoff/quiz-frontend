const toastService = {
  showSuccessMessage(toast, message) {
    toast.add({ severity: 'success', summary: message, life: 3000 })
  },

  showInfoMessage(toast, message) {
    toast.add({ severity: 'info', summary: message, life: 3000 })
  },

  showBackendErrorMessage(
    toast,
    errorResponse,
    defaultErrorMessage = 'Непредвиденная ошибка. Попробуйте снова',
  ) {
    let message = ''
    if (errorResponse.status < 500) {
      message = errorResponse.response.data.error_description
      // group error
      if (errorResponse.response?.data?.error_code === 'users_not_exist') {
        message = 'Пользователи '
        message += '\r\n' + errorResponse.response.data.details + '\r\n'
        message += 'не найдены в базе данных'
      }
      if (errorResponse.response?.data?.error_code === 'all_in_group') {
        message = 'Выбранные пользователи уже добавлены в группу'
      }
      // quiz error
      if (errorResponse.response?.data?.error_code === 'quiz_not_exists') {
        message = 'Тест не найден'
      }
      if (errorResponse.response?.data.error_code === 'quiz_in_group') {
        message = 'Выбранный тест уже добавлен в группу'
      }
      // auth error
      if (
        errorResponse.response?.data?.error_code === 'invalid_password' ||
        errorResponse.response?.data?.error_code === 'user_not_found'
      ) {
        message = 'Неверный логин или пароль'
      }

      // quiz session error
      if (errorResponse?.response?.data?.error_code === 'session_not_exists') {
        message = 'Сессия завершена'
      }

      // profile update error
      if (errorResponse.response?.data?.error_code === 'unable_to_change_login') {
        message = 'Невозможно сменить логин'
        message +=
          '\nСледующая смена логина возможна: ' + `${formatDate(error.response.data.details)}`
      }
    } else if (errorResponse.status) {
      message = defaultErrorMessage
    } else {
      message = errorResponse.message
    }
    toast.add({ severity: 'error', summary: 'Ошибка', detail: message, life: 3000 })
  },
}

export default toastService
