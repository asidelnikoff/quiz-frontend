export function copyToClipboard(textToCopy) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(textToCopy)
        .catch(err => {
          console.error('Не удалось скопировать текст: ', err);
        });
    } else {
      console.warn('Clipboard API недоступен.');
    }
  }