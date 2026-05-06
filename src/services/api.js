import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000
})

export default {
  uploadChunk(transferId, chunk) {
    const form = new FormData()
    form.append('transferId', transferId)
    form.append('chunkIndex', chunk.index)
    form.append('totalChunks', '?') // se llena dinámicamente
    form.append('file', chunk.blob, `chunk-${chunk.index}`)
    return http.post('/upload/chunk', form)
  },
  getTransfers() {
    return http.get('/transfers')
  }
}