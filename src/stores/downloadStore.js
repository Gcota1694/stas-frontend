import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { calcProgress } from '@/services/chunker'

export const useDownloadStore = defineStore('download', () => {
  const downloads = ref([])
  const CHUNK_SIZE = 1024 * 1024 // 1 MB Exacto de la lógica del Backend

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
      receivedBytes: 0,       // Trackeo estricto de bytes binarios recibidos
      binaryBuffer: [],       // Almacenamiento persistente de los bytes
      abortController: null   // Manejo dinámico para matar el socket al pausar
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
   * Motor optimizado: Consumo pacífico y control matemático de transferencia
   */
  async function executeDownloadStream(download) {
    if (download.status === 'paused') return

    try {
      // Seteamos el controlador de aborto fresco para esta sesión de red
      download.abortController = new AbortController()

      // Apuntamos al chunk real calculado en base a los bytes limpios acumulados
      const url = `http://localhost:8080/api/v1/files/${download.name}?start_chunk=${download.currentChunkIndex}`
      
      const response = await fetch(url, { signal: download.abortController.signal })
      if (!response.ok) throw new Error("Error en el canal de descarga")

      const reader = response.body.getReader()
      console.log(`[STAS Pinia] Conectado al stream de red. Iniciando desde Chunk: ${download.currentChunkIndex}`)

      while (true) {
        if (download.status === 'paused') {
          break
        }

        const { done, value } = await reader.read()
        
        // 🔑 SI DONE ES TRUE, EL STREAM DE RED MURIÓ DE FORMA EXITOSA
        if (done) {
          console.log("[STAS Pinia] Lector de red cerró el stream de forma limpia (done = true).")
          break
        }

        download.binaryBuffer.push(value)
        download.receivedBytes += value.byteLength

        const realChunkIdx = Math.floor(download.receivedBytes / CHUNK_SIZE)
        download.currentChunkIndex = realChunkIdx

        for (let i = 0; i <= realChunkIdx; i++) {
          if (download.chunks[i] && download.chunks[i].status !== 'done') {
            download.chunks[i].status = 'done'
          }
}

        download.progress = calcProgress(download.chunks)
      }

      // 🔑 ENSAMBLADO FINAL CORREGIDO:
      // Si el bucle se rompió, el stream terminó y NO estamos pausados, forzamos el éxito.
      if (download.status !== 'paused') {
        download.status = 'done'
        download.progress = 100

        console.log(`[STAS Pinia] Disparando ensamble de archivo. Bytes totales: ${download.receivedBytes}`);
        
        const fileBlob = new Blob(download.binaryBuffer, { type: 'application/octet-stream' })
        triggerBrowserDownload(download.name, fileBlob)

        // Limpieza de memoria inmediata
        download.binaryBuffer = []
        download.receivedBytes = 0
        download.currentChunkIndex = 0
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`[STAS Pinia] Petición HTTP abortada por pausa. Progreso guardado.`);
      } else {
        console.error("Error en el stream de descarga:", error)
        download.status = 'error'
      }
    }
  }

  /**
   * Pausa la descarga aplicando truncado binario de control
   */
  async function pauseDownload(id) {
    const dl = downloads.value.find(d => d.id === id)
    if (!dl) return

    dl.status = 'paused'

    // 1. Matamos la transferencia de red de forma inmediata
    if (dl.abortController) {
      dl.abortController.abort()
    }

    // 2. 🔑 CORRECCIÓN DE INTEGRIDAD: Eliminamos los bytes corruptos del chunk incompleto
    const bytesValidos = dl.currentChunkIndex * CHUNK_SIZE
    
    if (dl.receivedBytes > bytesValidos && dl.binaryBuffer.length > 0) {
      console.log(`[STAS Pinia] Truncando buffer. Recibidos: ${dl.receivedBytes}, Ajustando a válidos: ${bytesValidos}`)
      
      const blobTemporal = new Blob(dl.binaryBuffer)
      const blobTruncado = blobTemporal.slice(0, bytesValidos)
      
      const arrayBufferLimpio = await blobTruncado.arrayBuffer()
      
      // Sobrescribimos el búfer reactivo con el bloque 100% alineado a la frontera de 1MB
      dl.binaryBuffer = [new Uint8Array(arrayBufferLimpio)]
      dl.receivedBytes = bytesValidos
    }

    try {
      // 3. Notificamos al backend para que congele el canal en Redis
      await api.pauseServerTransfer(dl.name)
    } catch (err) {
      console.error("Error al pausar la descarga en el servidor:", err)
    }
  }

  /**
   * Reanuda la descarga reactivando el motor de forma asíncrona no bloqueante
   */
  async function resumeDownload(id) {
    const dl = downloads.value.find(d => d.id === id)
    if (!dl) return

    dl.status = 'active'
    
    // 1. Despertamos al backend (Fire and Forget) para prevenir deadlocks en el Gateway
    api.resumeServerTransfer(dl.name)
      .catch(err => console.error("Error asíncrono al reanudar en servidor:", err))

    // 2. Ejecutamos el micro-retraso estratégico de estabilización y relanzamos el motor
    setTimeout(async () => {
      await executeDownloadStream(dl)
    }, 50)
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