<template>
  <div class="downloads-container">
    <h2>Sistema de Transferencia de Archivos por Stream (STAS)</h2>
    <h3>📂 Archivos Disponibles para Descarga</h3>

    <div class="files-table-container">
      <table class="files-table">
        <thead>
          <tr>
            <th>Nombre del Archivo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in availableFiles" :key="file">
            <td>{{ file }}</td>
            <td>
              <button 
                @click="initiateDownload(file)" 
                :disabled="isDownloading(file)"
                class="btn-download"
              >
                {{ isDownloading(file) ? 'Descargando...' : 'Descargar Stream' }}
              </button>
            </td>
          </tr>
          <tr v-if="availableFiles.length === 0">
            <td colspan="2" class="no-files">No hay archivos disponibles en el servidor remoto.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="downloadStore.downloads.length > 0" class="active-downloads-section">
      <h3>🎛️ Panel de Control de Descargas</h3>
      
      <div 
        v-for="dl in downloadStore.downloads" 
        :key="dl.id" 
        class="download-card"
      >
        <div class="download-header">
          <span class="file-name">🎯 {{ dl.name }}</span>
          <span class="status-badge" :class="dl.status">{{ dl.status.toUpperCase() }}</span>
        </div>

        <div class="progress-container">
          <div class="progress-bar" :style="{ width: dl.progress + '%' }"></div>
          <span class="progress-text">{{ dl.progress }}%</span>
        </div>

        <div class="chunks-grid" v-if="dl.chunks.length > 0">
          <div 
            v-for="chunk in dl.chunks" 
            :key="chunk.index" 
            class="chunk-box" 
            :class="chunk.status"
            :title="`Bloque ${chunk.index}: ${chunk.status}`"
          ></div>
        </div>

        <div class="control-actions">
          <button 
            v-if="dl.status === 'active' || dl.status === 'initializing'" 
            @click="downloadStore.pauseDownload(dl.id)" 
            class="btn-pause"
          >
            ⏸️ Pausar Stream
          </button>
          <button 
            v-if="dl.status === 'paused'" 
            @click="downloadStore.resumeDownload(dl.id)" 
            class="btn-resume"
          >
            ▶️ Reanudar Stream
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDownloadStore } from '@/stores/downloadStore'
import api from '@/services/api'

const downloadStore = useDownloadStore()
const availableFiles = ref([])

// Cargar la lista de archivos al montar la vista
onMounted(async () => {
  try {
    const response = await api.getAvailableFiles()
    // Ajusta esto según el formato exacto que retorne tu endpoint (ej. response.data.files o un array directo)
    availableFiles.value = Array.isArray(response.data) ? response.data : (response.data.files || [])
  } catch (error) {
    console.error('Error al mapear los archivos del servidor:', error)
  }
})

// Disparar la descarga usando el Store
function initiateDownload(fileName) {
  downloadStore.startDownload(fileName)
}

// Helper para deshabilitar el botón si ya está en proceso
function isDownloading(fileName) {
  return downloadStore.downloads.some(d => d.name === fileName && d.status !== 'done' && d.status !== 'error')
}
</script>

<style scoped>
.downloads-container {
  padding: 30px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #1a1a1a; /* Fondo oscuro principal */
  color: #e0e0e0; /* Texto claro */
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  margin-top: 20px;
}

h2 {
  color: #ffffff;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
  margin-bottom: 5px;
}

h3 {
  color: #3498db; /* Azul tecnológico para subtítulos */
  margin-top: 20px;
  margin-bottom: 15px;
  font-weight: 500;
}

/* 📊 TABLA DE ARCHIVOS EN MODO OSCURO */
.files-table-container {
  background: #242424; /* Fondo de tarjetas/paneles */
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

.files-table {
  width: 100%;
  border-collapse: collapse;
}

.files-table th {
  background-color: #2d2d2d;
  color: #3498db;
  padding: 14px 12px;
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid #3d3d3d;
}

.files-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid #333;
  color: #cccccc;
}

.files-table tbody tr:hover {
  background-color: #2d2d2d; /* Efecto hover sutil */
}

.no-files {
  text-align: center;
  color: #888888;
  font-style: italic;
  padding: 20px !important;
}

/* 🎛️ PANEL DE CONTROL DE DESCARGAS (TARJETAS) */
.active-downloads-section {
  margin-top: 30px;
}

.download-card {
  background: #242424;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.download-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.file-name {
  color: #ffffff;
  font-weight: 500;
}

/* BARRA DE PROGRESO INDUSTRIAL */
.progress-container {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  height: 24px;
  position: relative;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-bar {
  background: linear-gradient(90deg, #2980b9, #3498db);
  height: 100%;
  transition: width 0.1s ease;
  box-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
}

.progress-text {
  position: absolute;
  right: 12px;
  top: 0;
  font-size: 13px;
  line-height: 24px;
  color: #ffffff;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

/* 🟦 CUADRÍCULA DE REJILLA EN MODO OSCURO */
.chunks-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 20px;
  background: #1a1a1a;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #333;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
}

.chunk-box {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background-color: #333333; /* pending - Gris oscuro terminal */
  border: 1px solid #222;
  transition: all 0.15s ease;
}

.chunk-box.uploading {
  background-color: #f1c40f; /* downloading - Amarillo */
  box-shadow: 0 0 8px rgba(241, 196, 15, 0.6);
  animation: pulse 1s infinite alternate;
}

.chunk-box.done {
  background-color: #2ecc71; /* done - Verde Neón */
  box-shadow: 0 0 6px rgba(46, 204, 113, 0.4);
}

.chunk-box.error {
  background-color: #e74c3c; /* error - Rojo */
  box-shadow: 0 0 8px rgba(231, 76, 60, 0.6);
}

/* 🛑 BOTONES Y ACCIONES */
button {
  font-weight: 600;
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

button:active {
  transform: translateY(0);
}

.btn-download {
  background: #2ecc71;
  color: #1a1a1a;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-download:disabled {
  background: #333333;
  color: #666666;
  border: 1px solid #444;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-pause {
  background: #e67e22;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.btn-resume {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

/* BADGES DE ESTADO */
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.5px;
}
.status-badge.initializing { background: #7f8c8d; color: white; }
.status-badge.active { background: #3498db; color: white; }
.status-badge.paused { background: #e67e22; color: white; }
.status-badge.done { background: #2ecc71; color: #1a1a1a; }
.status-badge.error { background: #e74c3c; color: white; }

@keyframes pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>