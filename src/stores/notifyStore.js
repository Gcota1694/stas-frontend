import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotifyStore = defineStore('notify', () => {
  const toasts = ref([])

  function push(message, type = 'info', duration = 4000) {
    const id = crypto.randomUUID()
    toasts.value.push({ id, message, type })
    setTimeout(() => remove(id), duration)
  }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (msg) => push(msg, 'success')
  const error   = (msg) => push(msg, 'error')
  const warn    = (msg) => push(msg, 'warn')
  const info    = (msg) => push(msg, 'info')

  return { toasts, push, remove, success, error, warn, info }
})