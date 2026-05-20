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

async function startTransfer(file) {
    const transferId = crypto.randomUUID()
    
    // 1. 🔥 PRIMERO PASAMOS UN OBJETO CASCO A VUE:
    // Insertamos los datos básicos de inmediato para que Vue dibuje la barra y la tarjeta
    // en la pantalla ANTES de gastar recursos procesando los bloques binarios.
    transfers.value.push({
      id: transferId,
      name: file.name,
      size: file.size,
      chunks: [], // Empieza vacío para una respuesta instantánea de la UI
      progress: 0,
      status: 'active'
    })

    // 2. 🔥 LIBERAMOS EL HILO DE RENDERIZADO:
    // Le damos un respiro de 50ms a la interfaz. Vue pintará la tarjeta en la pantalla
    // y luego, en segundo plano, empezaremos a segmentar y subir.
    setTimeout(async () => {
      // Buscamos la referencia reactiva en el store
      const transferReactiva = transfers.value.find(t => t.id === transferId)
      if (!transferReactiva) return

      try {
        // 3. FRAGMENTACIÓN EN SEGUNDO PLANO:
        // Ahora sí, partimos el archivo. Al asignarlo directamente a la propiedad reactiva,
        // Vue detectará los bloques y pintará la cuadrícula gris de inmediato.
        transferReactiva.chunks = splitFile(file)
        
        // 4. INICIAMOS LA SUBIDA ATÓMICA
        await uploadChunks(transferReactiva)
      } catch (err) {
        console.error("Error al inicializar los bloques del archivo:", err)
        transferReactiva.status = 'error'
      }
    }, 50)
  }

  async function uploadChunks(transfer) {
    const totalChunks = transfer.chunks.length

    for (const chunk of transfer.chunks) {
      if (chunk.status === 'done') continue
      if (transfer.status === 'paused') break

      // 3. Forzamos la mutación directamente sobre la referencia reactiva
      chunk.status = 'uploading'
      
      try {
        await api.uploadChunk(
          transfer.name, 
          chunk.blob, 
          chunk.index, 
          totalChunks
        )
        
        chunk.status = 'done'
        // Recalculamos el progreso global
        transfer.progress = calcProgress(transfer.chunks)

        // 4. 🔥 RESPIRO DE RENDIMIENTO:
        // Dejamos 15ms entre bloques para que el navegador respire, 
        // procese el renderizado de la cuadrícula y actualice la barra de progreso en vivo.
        await new Promise(resolve => setTimeout(resolve, 15))

      } catch (error) {
        console.error(`Error subiendo el bloque ${chunk.index}:`, error)
        chunk.status = 'error'
        transfer.status = 'error'
        break
      }
    }
    
    // 5. Verificación final reactiva al salir del ciclo
    const todosListos = transfer.chunks.every(c => c.status === 'done')
    if (todosListos && transfer.status !== 'paused') {
      transfer.progress = 100
      transfer.status = 'done'
    }
  }

// ⏸️ PAUSA SINCRONIZADA
  async function pauseTransfer(id) {
    const t = transfers.value.find(t => t.id === id)
    if (!t) return
    
    t.status = 'paused'
    
    try {
      // Llama al endpoint directo /api/v1/files/{file_id}/pause
      await api.pauseServerTransfer(t.name)
    } catch (err) {
      console.error("Error al pausar en el servidor:", err)
    }
  }

  // ▶️ REANUDACIÓN SINCRONIZADA
  async function resumeTransfer(id) {
    const t = transfers.value.find(t => t.id === id)
    if (!t) return
    
    t.status = 'active'
    
    try {
      // Llama al endpoint directo /api/v1/files/{file_id}/resume
      await api.resumeServerTransfer(t.name)
      // Reinicia el bucle de envío de los chunks restantes
      await uploadChunks(t)
    } catch (err) {
      console.error("Error al reanudar en el servidor:", err)
      t.status = 'error'
    }
  }

  return { transfers, startTransfer, pauseTransfer, resumeTransfer }
})