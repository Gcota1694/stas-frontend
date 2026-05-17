import axios from 'axios'

const http = axios.create({
  // Ajustado al puerto 8000 estándar de FastAPI
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000
})

export default {
  /**
   * Envía un fragmento binario al endpoint real de subida
   */
  uploadChunk(fileName, chunkBlob, chunkIndex, totalChunks) {
    const form = new FormData()
    
    // Mapeamos los nombres EXACTOS que tus Form(...) de FastAPI esperan recibir
    form.append('chunk_index', chunkIndex)
    form.append('total_chunks', totalChunks)
    form.append('file', chunkBlob, fileName) // Usamos el nombre real del archivo como filename
    
    return http.post('/api/v1/files/upload', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Activa el semáforo de pausa en Redis usando tu ruta real por URL
   */
  pauseServerTransfer(fileName) {
    return http.post(`/api/v1/files/${encodeURIComponent(fileName)}/pause`)
  },

  /**
   * Quita el semáforo de pausa en Redis usando tu ruta real por URL
   */
  resumeServerTransfer(fileName) {
    return http.post(`/api/v1/files/${encodeURIComponent(fileName)}/resume`)
  },

  getTransfers() {
    return http.get('/api/v1/files') // Ajustado al prefijo por si lo implementas luego
  }
}