const toastTarget = document.querySelector('.toast-target') as HTMLDivElement;

export const showToast = (message: string) => {
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.innerText = message;
  toastTarget.appendChild(toast);

  const closeTimeout = setTimeout(() => {
    toastTarget.removeChild(toast);
  }, 10000);

  toast.addEventListener('click', () => {
    clearTimeout(closeTimeout);
    toastTarget.removeChild(toast);
  })
}
