import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWsStore = defineStore('ws', () => {
  const connected = ref(false)
  const events = ref([])
  let socket = null
  let reconnectTimer = null

  function connect(url = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws') {
    if (socket) return

    socket = new WebSocket(url)

    socket.onopen = () => {
      connected.value = true
      clearTimeout(reconnectTimer)
      addEvent('system', 'Conectado al servidor')
    }

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        addEvent(data.type || 'info', data.message || JSON.stringify(data), data)
      } catch {
        addEvent('info', e.data)
      }
    }

    socket.onclose = () => {
      connected.value = false
      socket = null
      addEvent('system', 'Desconectado — reintentando en 5s...')
      reconnectTimer = setTimeout(() => connect(url), 5000)
    }

    socket.onerror = () => {
      addEvent('error', 'Error de conexión WebSocket')
      socket?.close()
    }
  }

  function disconnect() {
    clearTimeout(reconnectTimer)
    socket?.close()
    socket = null
  }

  function send(payload) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload))
    }
  }

  function addEvent(type, message, raw = null) {
    events.value.unshift({
      id: crypto.randomUUID(),
      type,
      message,
      raw,
      time: new Date().toLocaleTimeString()
    })
    if (events.value.length > 100) events.value.pop()
  }

  function clearEvents() {
    events.value = []
  }

  return { connected, events, connect, disconnect, send, clearEvents }
})