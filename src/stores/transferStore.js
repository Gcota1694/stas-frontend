import { defineStore } from 'pinia'
import { ref } from 'vue'
import { splitFile, calcProgress } from '../services/chunker'
import api from '../services/api'

export const useTransferStore = defineStore('transfer', () => {
  const transfers = ref([])

  async function startTransfer(file) {
    const chunks = splitFile(file)
    const transfer = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      chunks,
      progress: 0,
      status: 'active' // active | paused | done | error
    }
    transfers.value.push(transfer)
    await uploadChunks(transfer)
  }

  async function uploadChunks(transfer) {
    for (const chunk of transfer.chunks) {
      if (transfer.status === 'paused') break
      chunk.status = 'uploading'
      try {
        await api.uploadChunk(transfer.id, chunk)
        chunk.status = 'done'
        transfer.progress = calcProgress(transfer.chunks)
      } catch {
        chunk.status = 'error'
        transfer.status = 'error'
        break
      }
    }
    if (transfer.progress === 100) transfer.status = 'done'
  }

  function pauseTransfer(id) {
    const t = transfers.value.find(t => t.id === id)
    if (t) t.status = 'paused'
  }

  async function resumeTransfer(id) {
    const t = transfers.value.find(t => t.id === id)
    if (!t) return
    t.status = 'active'
    await uploadChunks(t)
  }

  return { transfers, startTransfer, pauseTransfer, resumeTransfer }
})