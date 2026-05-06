<template>
  <div class="detail-page">

    <div v-if="!transfer" class="not-found">
      <span class="not-found__icon">🔍</span>
      <h2>Transferencia no encontrada</h2>
      <p>El ID no coincide con ninguna transferencia activa.</p>
      <RouterLink to="/transfers" class="btn btn--primary">← Volver</RouterLink>
    </div>

    <template v-else>

      <div class="detail-header">
        <RouterLink to="/transfers" class="back-link">← Transferencias</RouterLink>
        <div class="header-row">
          <div class="file-identity">
            <span class="file-icon">📄</span>
            <div>
              <h1 class="file-name">{{ transfer.name }}</h1>
              <p class="file-meta">
                {{ formatSize(transfer.size) }} · {{ transfer.chunks.length }} bloques ·
                <code>{{ transfer.id.slice(0,8) }}…</code>
              </p>
            </div>
          </div>
          <span class="status-badge" :class="'status--' + transfer.status">
            {{ labelStatus(transfer.status) }}
          </span>
        </div>
      </div>

      <!-- Progreso -->
      <div class="card">
        <div class="progress-top">
          <span class="progress-pct">{{ transfer.progress }}%</span>
          <span class="progress-sub">{{ doneChunks }} de {{ transfer.chunks.length }} bloques</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar" :class="'bar--' + transfer.status" :style="{ width: transfer.progress + '%' }"></div>
        </div>
        <div class="controls">
          <button v-if="transfer.status === 'active'" class="btn btn--secondary" @click="store.pauseTransfer(transfer.id)">⏸ Pausar</button>
          <button v-if="transfer.status === 'paused'" class="btn btn--primary"   @click="store.resumeTransfer(transfer.id)">▶ Reanudar</button>
          <span v-if="transfer.status === 'done'"  class="done-msg">✅ Completada exitosamente</span>
          <span v-if="transfer.status === 'error'" class="error-msg">❌ Error en la transferencia</span>
        </div>
      </div>

      <!-- Stats chunks -->
      <div class="stats-row">
        <div class="stat-card" v-for="s in chunkStats" :key="s.label">
          <span class="stat-num" :style="{ color: s.color }">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
          <div class="stat-bar-wrap">
            <div class="stat-bar" :style="{
              width: transfer.chunks.length ? (s.value / transfer.chunks.length * 100) + '%' : '0%',
              background: s.color
            }"></div>
          </div>
        </div>
      </div>

      <!-- Mapa de chunks -->
      <div class="card">
        <div class="section-header">
          <h2>Mapa de bloques</h2>
          <div class="legend">
            <span class="legend-item" v-for="l in legend" :key="l.label">
              <span class="legend-dot" :style="{ background: l.color }"></span>{{ l.label }}
            </span>
          </div>
        </div>
        <div class="chunks-grid">
          <div
            v-for="chunk in transfer.chunks"
            :key="chunk.index"
            class="chunk-block"
            :class="'chunk--' + chunk.status"
            :title="`Bloque ${chunk.index + 1} · ${formatSize(chunk.size)} · ${chunk.status}`"
            @mouseenter="hoveredChunk = chunk"
            @mouseleave="hoveredChunk = null"
          ></div>
        </div>
        <Transition name="fade">
          <div v-if="hoveredChunk" class="chunk-tooltip">
            <strong>Bloque {{ hoveredChunk.index + 1 }}</strong>
            <span>Tamaño: {{ formatSize(hoveredChunk.size) }}</span>
            <span>Estado: {{ hoveredChunk.status }}</span>
            <span>{{ formatSize(hoveredChunk.start) }} → {{ formatSize(hoveredChunk.end) }}</span>
          </div>
        </Transition>
      </div>

      <!-- Tabla -->
      <div class="card">
        <div class="section-header">
          <h2>Detalle por bloque</h2>
          <div class="filter-row">
            <button
              v-for="f in filters" :key="f.value"
              class="filter-btn"
              :class="{ 'filter-btn--active': activeFilter === f.value }"
              @click="activeFilter = f.value"
            >{{ f.label }}</button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="chunk-table">
            <thead>
              <tr><th>#</th><th>Tamaño</th><th>Inicio</th><th>Fin</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr v-for="chunk in filteredChunks" :key="chunk.index" class="table-row" :class="'row--' + chunk.status">
                <td class="td-index">{{ chunk.index + 1 }}</td>
                <td>{{ formatSize(chunk.size) }}</td>
                <td class="td-mono">{{ formatSize(chunk.start) }}</td>
                <td class="td-mono">{{ formatSize(chunk.end) }}</td>
                <td>
                  <span class="status-badge status-badge--sm" :class="'status--' + chunk.status">{{ chunk.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useTransferStore } from '../stores/transferStore'

const route    = useRoute()
const store    = useTransferStore()
const transfer = computed(() => store.transfers.find(t => t.id === route.params.id))
const doneChunks   = computed(() => transfer.value?.chunks.filter(c => c.status === 'done').length ?? 0)
const hoveredChunk = ref(null)
const activeFilter = ref('all')

const filters = [
  { label: 'Todos',      value: 'all' },
  { label: 'Pendiente',  value: 'pending' },
  { label: 'Subiendo',   value: 'uploading' },
  { label: 'Completado', value: 'done' },
  { label: 'Error',      value: 'error' },
]

const filteredChunks = computed(() => {
  if (!transfer.value) return []
  if (activeFilter.value === 'all') return transfer.value.chunks
  return transfer.value.chunks.filter(c => c.status === activeFilter.value)
})

const chunkStats = computed(() => {
  if (!transfer.value) return []
  const c = transfer.value.chunks
  return [
    { label: 'Pendientes',  value: c.filter(x => x.status === 'pending').length,   color: '#3d4f6b' },
    { label: 'Subiendo',    value: c.filter(x => x.status === 'uploading').length, color: 'var(--brand)' },
    { label: 'Completados', value: c.filter(x => x.status === 'done').length,      color: '#00d4aa' },
    { label: 'Con error',   value: c.filter(x => x.status === 'error').length,     color: 'var(--danger)' },
  ]
})

const legend = [
  { label: 'Pendiente',  color: '#3d4f6b' },
  { label: 'Subiendo',   color: '#00d4aa' },
  { label: 'Completado', color: '#00b38f' },
  { label: 'Error',      color: '#ff5c7a' },
]

function formatSize(bytes) {
  if (bytes < 1024)      return bytes + ' B'
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB'
  return (bytes / 1024 ** 3).toFixed(2) + ' GB'
}

function labelStatus(s) {
  return { active: '⚡ Activo', paused: '⏸ Pausado', done: '✅ Listo', error: '❌ Error' }[s] ?? s
}
</script>

<style scoped>
.detail-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.not-found {
  text-align: center; padding: 80px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.not-found__icon { font-size: 3.5rem; }
.not-found p     { color: var(--text-muted); }

.back-link {
  display: inline-block;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.83rem;
  margin-bottom: 14px;
  transition: color 0.2s;
}
.back-link:hover { color: var(--brand); }

.header-row {
  display: flex; justify-content: space-between;
  align-items: center; flex-wrap: wrap; gap: 16px;
}
.file-identity { display: flex; align-items: center; gap: 16px; }
.file-icon     { font-size: 2.4rem; }
.file-name     { font-size: clamp(1rem, 2.5vw, 1.4rem); font-weight: 700; }
.file-meta     { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
.file-meta code {
  background: var(--bg-elevated);
  padding: 1px 6px; border-radius: 4px;
  font-family: 'Courier New', monospace; font-size: 0.76rem;
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  transition: border-color 0.2s;
}
.card:hover { border-color: rgba(0,212,170,0.15); }

.progress-top {
  display: flex; justify-content: space-between;
  align-items: baseline; margin-bottom: 12px;
}
.progress-pct  { font-size: 2.2rem; font-weight: 800; color: var(--brand); text-shadow: 0 0 20px rgba(0,212,170,0.3); }
.progress-sub  { font-size: 0.83rem; color: var(--text-muted); }

.progress-bar-wrap {
  height: 10px;
  background: rgba(255,255,255,0.05);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 20px;
}
.progress-bar { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.bar--active  { background: linear-gradient(90deg, var(--brand-dim), var(--brand)); box-shadow: 0 0 12px rgba(0,212,170,0.4); }
.bar--paused  { background: linear-gradient(90deg, #92400e, #f5a623); }
.bar--done    { background: linear-gradient(90deg, #00b38f, #00d4aa); box-shadow: 0 0 12px rgba(0,212,170,0.3); }
.bar--error   { background: linear-gradient(90deg, #7f1d1d, #ff5c7a); }

.controls  { display: flex; gap: 12px; align-items: center; }
.done-msg  { color: var(--brand); font-weight: 600; }
.error-msg { color: var(--danger); font-weight: 600; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  display: flex; flex-direction: column; gap: 4px;
  transition: border-color 0.2s;
}
.stat-card:hover { border-color: rgba(0,212,170,0.2); }
.stat-num   { font-size: 1.8rem; font-weight: 800; }
.stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
.stat-bar-wrap { height: 3px; background: rgba(255,255,255,0.05); border-radius: 999px; margin-top: 8px; overflow: hidden; }
.stat-bar  { height: 100%; border-radius: 999px; transition: width 0.5s; opacity: 0.7; }

.section-header {
  display: flex; justify-content: space-between;
  align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
}
.legend      { display: flex; gap: 14px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: var(--text-muted); }
.legend-dot  { width: 10px; height: 10px; border-radius: 3px; }

.chunks-grid { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }
.chunk-block {
  width: 20px; height: 20px; border-radius: 4px;
  cursor: pointer; transition: transform 0.15s, opacity 0.3s;
}
.chunk-block:hover   { transform: scale(1.35); }
.chunk--pending      { background: #1e2d42; border: 1px solid rgba(255,255,255,0.06); }
.chunk--uploading    { background: var(--brand); animation: pulse 0.8s infinite; }
.chunk--done         { background: var(--brand-dim); }
.chunk--error        { background: var(--danger); }
@keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }

.chunk-tooltip {
  display: flex; flex-wrap: wrap; gap: 8px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.chunk-tooltip strong { color: var(--brand); width: 100%; }

.filter-row  { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-btn  {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px; color: var(--text-muted);
  padding: 4px 12px; font-size: 0.76rem; cursor: pointer; transition: all 0.2s;
}
.filter-btn:hover        { border-color: var(--border-hover); color: var(--text); }
.filter-btn--active      { background: var(--brand-glow); border-color: rgba(0,212,170,0.4); color: var(--brand); }

.table-wrap  { overflow-x: auto; }
.chunk-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.chunk-table th {
  text-align: left; padding: 10px 14px;
  color: var(--text-muted); font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.8px;
  border-bottom: 1px solid var(--border);
}
.chunk-table td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.table-row:hover td   { background: var(--bg-elevated); }
.row--error td        { background: rgba(255,92,122,0.04); }
.row--uploading td    { background: rgba(0,212,170,0.04); }

.td-index { font-weight: 600; color: var(--text-muted); }
.td-mono  { font-family: 'Courier New', monospace; font-size: 0.76rem; color: var(--text-muted); }

.status-badge {
  font-size: 0.75rem; font-weight: 600;
  padding: 4px 12px; border-radius: 20px; white-space: nowrap;
}
.status-badge--sm      { font-size: 0.7rem; padding: 2px 8px; }
.status--active        { background: var(--brand-glow);           color: var(--brand); }
.status--paused        { background: rgba(245,166,35,0.12);        color: #f5a623; }
.status--done          { background: rgba(0,212,170,0.12);         color: var(--brand); }
.status--error         { background: rgba(255,92,122,0.12);        color: var(--danger); }
.status--pending       { background: rgba(61,79,107,0.3);          color: var(--text-muted); }
.status--uploading     { background: var(--brand-glow);            color: var(--brand); }

.btn {
  padding: 9px 22px; border-radius: var(--radius-sm); border: none;
  cursor: pointer; font-size: 0.88rem; font-weight: 600;
  text-decoration: none; transition: all 0.2s; display: inline-block;
}
.btn--primary   { background: var(--brand); color: #080d14; }
.btn--primary:hover  { background: var(--brand-dim); box-shadow: var(--shadow-brand); }
.btn--secondary { background: var(--bg-elevated); color: var(--text); border: 1px solid var(--border); }
.btn--secondary:hover { border-color: var(--border-hover); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

@media (max-width: 640px) {
  .stats-row      { grid-template-columns: repeat(2, 1fr); }
  .header-row     { flex-direction: column; align-items: flex-start; }
  .section-header { flex-direction: column; align-items: flex-start; }
  .chunk-block    { width: 16px; height: 16px; }
}
</style>