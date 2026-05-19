<template>
  <div class="downloads-container">
    <h1>Panel de Descargas</h1>
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
  margin: 20px auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  /* 🎨 Color de fondo principal heredado del Home */
  background-color: none; 
  color: var(--text, #e0e0e0);
  border: 1px solid var(--border);
  border-radius: var(--radius, 12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

h2 {
  color: var(--text, #ffffff);
  border-bottom: 2px solid var(--border, #333);
  padding-bottom: 10px;
  margin-bottom: 5px;
}

h3 {
  /* Usamos el verde/cian neón de tu marca */
  color: var(--brand, #00d4aa); 
  margin-top: 20px;
  margin-bottom: 15px;
  font-weight: 500;
}

/* 📊 TABLA DE ARCHIVOS (Con los contenedores estilo Home) */
.files-table-container {
  background: var(--bg-surface, #242424);
  border: 1px solid var(--border, #3d3d3d);
  border-radius: var(--radius, 8px);
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

.files-table {
  width: 100%;
  border-collapse: collapse;
}

.files-table th {
  background-color: rgba(255, 255, 255, 0.02);
  color: var(--brand, #00d4aa);
  padding: 14px 12px;
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid var(--border, #3d3d3d);
}

.files-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border, #333);
  color: var(--text-muted, #cccccc);
}

.files-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.no-files {
  text-align: center;
  color: var(--text-muted, #888888);
  font-style: italic;
  padding: 20px !important;
}

/* 🎛️ PANEL DE CONTROL DE DESCARGAS (TARJETAS) */
.active-downloads-section {
  margin-top: 30px;
}

.download-card {
  background: var(--bg-surface, #242424);
  border: 1px solid var(--border, #3d3d3d);
  border-radius: var(--radius, 8px);
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: border-color 0.2s;
}
.download-card:hover {
  border-color: rgba(0, 212, 170, 0.15);
}

.download-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.file-name {
  color: var(--text, #ffffff);
  font-weight: 500;
}

/* BARRA DE PROGRESO INDUSTRIAL CON EL GRADIENTE DE HOME */
.progress-container {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  height: 24px;
  position: relative;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-bar {
  /* Gradiente exacto de tu barra en Home */
  background: linear-gradient(90deg, var(--brand-dim), var(--brand));
  height: 100%;
  transition: width 0.1s ease;
  box-shadow: 0 0 10px rgba(0, 212, 170, 0.4);
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
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border, #333);
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
}

.chunk-box {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.06); /* pending */
  border: 1px solid rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
}

.chunk-box.uploading {
  background-color: var(--brand, #00d4aa);
  opacity: 0.7;
  box-shadow: 0 0 8px var(--brand);
  animation: pulse 0.8s infinite alternate;
}

.chunk-box.done {
  background-color: var(--brand, #00d4aa); /* done - Verde Neón del Home */
  box-shadow: 0 0 6px rgba(0, 212, 170, 0.3);
}

.chunk-box.error {
  background-color: var(--danger, #ff5c7a); /* error */
  box-shadow: 0 0 8px var(--danger);
}

/* 🛑 BOTONES Y ACCIONES STYLING HOME */
button {
  font-weight: 600;
  border-radius: var(--radius-sm, 4px);
  font-size: 0.88rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

.btn-download {
  background: var(--brand, #00d4aa);
  color: #080d14;
  border: none;
  padding: 8px 16px;
}

.btn-download:disabled {
  background: var(--bg-elevated, #333333);
  color: var(--text-muted, #666666);
  border: 1px solid var(--border);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-pause {
  background: var(--bg-elevated);
  color: #f5a623;
  border: 1px solid rgba(245, 166, 35, 0.25);
  padding: 10px 20px;
}
.btn-pause:hover {
  background: rgba(245, 166, 35, 0.08);
}

.btn-resume {
  background: var(--bg-elevated);
  color: var(--brand);
  border: 1px solid rgba(0, 212, 170, 0.25);
  padding: 10px 20px;
}
.btn-resume:hover {
  background: var(--brand-glow);
  box-shadow: var(--shadow-brand);
}

/* BADGES DE ESTADO ESTILO PÍLDORA */
.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.status-badge.initializing { background: rgba(255, 255, 255, 0.08); color: var(--text-muted); }
.status-badge.active       { background: var(--brand-glow); color: var(--brand); }
.status-badge.paused       { background: rgba(245, 166, 35, 0.12); color: #f5a623; }
.status-badge.done         { background: rgba(0, 212, 170, 0.12); color: var(--brand); }
.status-badge.error        { background: rgba(255, 92, 122, 0.12); color: var(--danger); }

@keyframes pulse {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}
</style>