<template>
  <div class="home">
    <div class="hero">
      <div class="hero__tag">Sistema de Transferencia por Stream</div>
      <h1 class="hero__title">Transfiere archivos de forma <span class="accent">resiliente</span></h1>
      <p class="hero__sub">
        Fragmentación automática por bloques · Pausa y reanuda en cualquier momento · Sin pérdida de datos
      </p>
    </div>

    <div class="card upload-card">
      <FileDropzone @file-selected="handleFile" />
    </div>

    <div v-if="transferActiva" class="card progress-card">
      <div class="progress-header">
        <div class="progress-info">
          <span class="file-icon">📄</span>
          <div>
            <p class="file-name">{{ transferActiva.name }}</p>
            <p class="file-size">{{ formatSize(transferActiva.size) }}</p>
          </div>
        </div>
        <span class="status-badge" :class="'status--' + transferActiva.status">
          {{ labelStatus(transferActiva.status) }}
        </span>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: transferActiva.progress + '%' }"></div>
      </div>
      <div class="progress-meta">
        <span>{{ transferActiva.progress }}% completado</span>
        <span>{{ doneChunks }}/{{ totalChunks }} bloques</span>
      </div>

      <div class="chunks-grid">
        <div
          v-for="chunk in transferActiva.chunks"
          :key="chunk.index"
          class="chunk-block"
          :class="'chunk--' + chunk.status"
          :title="`Bloque ${chunk.index + 1}: ${chunk.status}`"
        ></div>
      </div>

      <div class="controls">
        <button
          v-if="transferActiva.status === 'active'"
          class="btn btn--secondary"
          @click="store.pauseTransfer(transferActiva.id)"
        >⏸ Pausar</button>
        <button
          v-if="transferActiva.status === 'paused'"
          class="btn btn--primary"
          @click="store.resumeTransfer(transferActiva.id)"
        >▶ Reanudar</button>
        <span v-if="transferActiva.status === 'done'" class="done-msg">✅ Transferencia completada</span>
      </div>
    </div>

    <div class="features">
      <div class="feature-card" v-for="f in features" :key="f.title">
        <span class="feature-icon">{{ f.icon }}</span>
        <h3>{{ f.title }}</h3>
        <p>{{ f.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FileDropzone from '../components/FileDropzone.vue'
import { useTransferStore } from '../stores/transferStore'

const store = useTransferStore()

const transferActiva = computed(() =>
  store.transfers.length ? store.transfers[store.transfers.length - 1] : null
)
const totalChunks = computed(() => transferActiva.value?.chunks.length ?? 0)
const doneChunks  = computed(() =>
  transferActiva.value?.chunks.filter(c => c.status === 'done').length ?? 0
)

async function handleFile(file) {
  await store.startTransfer(file)
}

function formatSize(bytes) {
  if (bytes < 1024)      return bytes + ' B'
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB'
  return (bytes / 1024 ** 3).toFixed(2) + ' GB'
}

function labelStatus(s) {
  return { active: '⚡ Activo', paused: '⏸ Pausado', done: '✅ Listo', error: '❌ Error' }[s] ?? s
}

const features = [
  { icon: '🧩', title: 'Chunking inteligente',    desc: 'El archivo se divide en bloques de 2 MB para máxima resiliencia en redes inestables.' },
  { icon: '⏯',  title: 'Pausa y reanuda',          desc: 'Interrumpe la transferencia y continúa donde quedó sin perder ningún bloque.' },
  { icon: '🔒', title: 'Integridad garantizada',   desc: 'Cada bloque se verifica individualmente antes de marcar la transferencia como completada.' },
]
</script>

<style scoped>
.home {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hero         { text-align: center; padding: 8px 0; }
.hero__tag    {
  display: inline-block;
  background: var(--brand-glow);
  border: 1px solid rgba(0,212,170,0.25);
  color: var(--brand);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 16px;
}
.hero__title  { margin-bottom: 14px; line-height: 1.3; }
.hero__sub    {
  color: var(--text-muted);
  font-size: 0.92rem;
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.7;
}
.accent { color: var(--brand); }

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  transition: border-color 0.2s;
}
.card:hover { border-color: rgba(0,212,170,0.15); }

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.progress-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.file-icon  { font-size: 1.8rem; flex-shrink: 0; }
.file-name  {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}
.file-size  { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
}
.status--active   { background: var(--brand-glow);            color: var(--brand); }
.status--paused   { background: rgba(245,166,35,0.12);         color: #f5a623; }
.status--done     { background: rgba(0,212,170,0.12);          color: var(--brand); }
.status--error    { background: rgba(255,92,122,0.12);         color: var(--danger); }

.progress-bar-wrap {
  height: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-dim), var(--brand));
  border-radius: 999px;
  transition: width 0.4s ease;
  box-shadow: 0 0 10px rgba(0,212,170,0.4);
}
.progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.chunks-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-bottom: 20px;
}
.chunk-block {
  width: clamp(12px, 2vw, 18px);
  height: clamp(12px, 2vw, 18px);
  border-radius: 3px;
  transition: background 0.3s;
}
.chunk--pending   { background: rgba(255,255,255,0.06); }
.chunk--uploading { background: var(--brand); opacity: 0.8; animation: pulse 0.8s infinite; }
.chunk--done      { background: var(--brand); }
.chunk--error     { background: var(--danger); }

@keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }

.controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

.btn {
  padding: 9px 22px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.2s;
}
.btn--primary { background: var(--brand); color: #080d14; }
.btn--primary:hover  { background: var(--brand-dim); box-shadow: var(--shadow-brand); }
.btn--secondary      { background: var(--bg-elevated); color: var(--text); border: 1px solid var(--border); }
.btn--secondary:hover { border-color: var(--border-hover); }

.done-msg { color: var(--brand); font-weight: 600; font-size: 0.95rem; }

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.feature-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px;
  transition: all 0.2s;
}
.feature-card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-brand);
  transform: translateY(-2px);
}
.feature-icon { font-size: 1.6rem; display: block; margin-bottom: 10px; }
.feature-card h3 { font-size: 0.92rem; margin-bottom: 6px; }
.feature-card p  { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; }

@media (max-width: 480px) {
  .card         { padding: 16px 14px; }
  .file-name    { max-width: 160px; }
  .features     { grid-template-columns: 1fr; }
  .progress-meta { flex-direction: column; gap: 2px; }
}
</style>