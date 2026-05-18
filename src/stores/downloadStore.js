import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { calcProgress } from '@/services/chunker'

export const useDownloadStore = defineStore('download', () => {
  const downloads = ref([])

  // Guardamos los controladores de aborto mapeados por el ID de la descarga
  const abortControllers = new Map()

  /**
   * Inicializa el proceso de descarga creando la estructura reactiva en la UI
   */
  async function startDownload(fileName) {
    const downloadId = crypto.randomUUID()

    downloads.value.push({
      id: downloadId,
      name: fileName,
      progress: 0,
      status: 'initializing',
      chunks: [],
      currentChunkIndex: 0,
      binaryBuffer: [] // Bolsa de bytes limpia desde el inicio
    })

    setTimeout(async () => {
      const currentDl = downloads.value.find(d => d.id === downloadId)
      if (!currentDl) return

      try {
        const resInfo = await api.getFileInfo(fileName)
        const totalChunks = resInfo.data.total_chunks

        if (!totalChunks || resInfo.data.error) {
          throw new Error(resInfo.data.error || 'No se pudo obtener información del archivo')
        }

        const virtualChunks = []
        for (let i = 0; i < totalChunks; i++) {
          virtualChunks.push({ index: i, status: 'pending' })
        }
        currentDl.chunks = virtualChunks
        currentDl.status = 'active'

        await executeDownloadStream(currentDl)

      } catch (err) {
        console.error("Error al inicializar la descarga:", err)
        currentDl.status = 'error'
      }
    }, 50)
  }

  /**
   * Motor idéntico al index.html que gestiona el stream con AbortController per-download
   */
  async function executeDownloadStream(download) {
    if (download.status === 'paused') return

    try {
      const currentIdx = download.currentChunkIndex

      // Actualizar el estado visual inicial del bloque
      if (download.chunks[currentIdx]) {
        download.chunks[currentIdx].status = 'uploading'
      }

      // 1. CREAR EL ABORT CONTROLLER EXACTO DEL INDEX.HTML
      const controller = new AbortController()
      abortControllers.set(download.id, controller)

      const url = `http://localhost:8080/api/v1/files/${download.name}?start_chunk=${currentIdx}`
      
      // Pasamos el signal para poder fulminar la petición HTTP al pausar
      const response = await fetch(url, { signal: controller.signal })

      if (!response.ok) throw new Error("Error en el canal de descarga")

      const reader = response.body.getReader()

      // 2. LOOP LIMPIO ASÍNCRONO (Misma lógica del index)
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Guardar binarios en el buffer persistente
        download.binaryBuffer.push(value)

        // Pintar cuadro como completado
        const idx = download.currentChunkIndex
        if (download.chunks[idx]) {
          download.chunks[idx].status = 'done'
        }

        // Avanzar contador exacto de bloques descargados
        download.currentChunkIndex++
        download.progress = calcProgress(download.chunks)
      }

      // 3. ENSAMBLADO FINAL (Solo si ya terminamos todos los chunks reales)
      if (download.currentChunkIndex >= download.chunks.length && download.status !== 'paused') {
        download.status = 'done'
        download.progress = 100

        const fileBlob = new Blob(download.binaryBuffer, { type: 'application/octet-stream' })
        triggerBrowserDownload(download.name, fileBlob)

        // Liberar RAM
        download.binaryBuffer = []
        abortControllers.delete(download.id)
      }

    } catch (error) {
      // Si la excepción fue provocada por la pausa (Abort), la manejamos en silencio
      if (error.name === 'AbortError') {
        console.log(`⏸️ Descarga de ${download.name} abortada/pausada exitosamente en cliente.`);
      } else {
        console.error("Error en el stream de descarga:", error)
        download.status = 'error'
      }
    }
  }

  /**
   * Pausa la descarga invocando al backend e interrumpiendo la red de inmediato
   */
  async function pauseDownload(id) {
    const dl = downloads.value.find(d => d.id === id)
    if (!dl) return

    dl.status = 'paused'

    // 🔥 MATAR LA CONEXIÓN HTTP DE INMEDIATO (Igual que el index.html)
    const controller = abortControllers.get(id)
    if (controller) {
      controller.abort()
      abortControllers.delete(id)
    }

    try {
      await api.pauseServerTransfer(dl.name)
    } catch (err) {
      console.error("Error al pausar la descarga en el servidor:", err)
    }
  }

  /**
   * Reanuda la descarga reactivando el motor desde el último índice guardado
   */
  async function resumeDownload(id) {
    const dl = downloads.value.find(d => d.id === id)
    if (!dl) return

    dl.status = 'active'
    try {
      await api.resumeServerTransfer(dl.name)
      // El motor arrancará limpio pidiendo exactamente desde dl.currentChunkIndex
      await executeDownloadStream(dl)
    } catch (err) {
      console.error("Error al reanudar la descarga en el servidor:", err)
      dl.status = 'error'
    }
  }

  function triggerBrowserDownload(fileName, blob) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return {
    downloads,
    startDownload,
    pauseDownload,
    resumeDownload
  }
})