<template>
  <div class="transfers-page">

    <div class="page-header">
      <div>
        <h1>Dashboard de Transferencias</h1>
        <p class="page-sub">Monitoreo de rendimiento, logs de red y control de flujo STAS</p>
      </div>
      <div class="header-actions">
        <div class="ws-indicator" :class="ws.connected ? 'ws--on' : 'ws--off'">
          <span class="ws-dot"></span>
          {{ ws.connected ? 'Tubería En Vivo' : 'Backend Desconectado' }}
        </div>
        <button class="btn btn--ghost" @click="ws.connected ? ws.disconnect() : ws.connect()">
          {{ ws.connected ? '🔌 Desconectar' : '🔗 Conectar WS' }}
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card" v-for="s in metrics" :key="s.label">
        <span class="stat-num" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="stat-label">{{ s.label }}</span>
      </div>
    </div>

    <div v-if="allTransfers.length === 0" class="empty">
      <span class="empty-icon">📭</span>
      <p>No se han registrado operaciones en el buffer local</p>
      <RouterLink to="/" class="btn btn--primary">Ir al Panel de Carga</RouterLink>
    </div>

    <div v-else class="transfer-list">
      <h2 style="margin-bottom: 1rem; font-size: 1.2rem; color: var(--text);">📋 Cola de Procesamiento Actual</h2>
      
      <TransitionGroup name="list">
        <div
          v-for="t in allTransfers"
          :key="t.id"
          class="transfer-row"
        >
          <div class="tr-left">
            <span class="tr-icon">{{ t.type === 'download' ? '📥' : '📤' }}</span>
            <div class="tr-info">
              <p class="tr-name">{{ t.name }}</p>
              <p class="tr-meta">
                {{ formatSize(t.size || 0) }} · {{ t.chunks?.length || 0 }} bloques · 
                <span style="font-weight: 500; color: var(--brand);">{{ t.type === 'download' ? 'Descarga' : 'Subida' }}</span>
              </p>
            </div>
          </div>

          <div class="tr-center">
            <div class="mini-bar-wrap">
              <div class="mini-bar" :style="{ width: t.progress + '%' }"></div>
            </div>
            <span class="tr-pct">{{ t.progress }}%</span>
          </div>

          <div class="tr-right">
            <span class="status-badge" :class="'status--' + t.status">
              {{ labelStatus(t.status) }}
            </span>
            
            <template v-if="t.type === 'download'">
              <button v-if="t.status === 'active'" class="icon-btn" title="Pausar" @click="store.pauseDownload(t.id)">⏸</button>
              <button v-if="t.status === 'paused'" class="icon-btn" title="Reanudar" @click="store.resumeDownload(t.id)">▶</button>
            </template>

            <template v-else>
              <button v-if="t.status === 'active'" class="icon-btn" title="Pausar" @click="store.pauseTransfer?.(t.id)">⏸</button>
              <button v-if="t.status === 'paused'" class="icon-btn" title="Reanudar" @click="store.resumeTransfer?.(t.id)">▶</button>
            </template>

            <RouterLink :to="'/transfers/' + t.id" class="icon-btn" title="Ver detalle">🔍</RouterLink>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div class="card log-card" style="margin-top: 2rem;">
      <div class="log-header">
        <h2>Logs Físicos de Comunicación (WebSocket)</h2>
        <button class="btn btn--ghost btn--sm" @click="ws.clearEvents()">Limpiar Historial</button>
      </div>
      <div class="log-body">
        <div v-if="ws.events.length === 0" class="log-empty">Esperando tramas gRPC / señales de control...</div>
        <div v-for="e in ws.events" :key="e.id" class="log-line" :class="'log--' + e.type">
          <span class="log-time">{{ e.time }}</span>
          <span class="log-type">[{{ e.type.toUpperCase() }}]</span>
          <span class="log-msg">{{ e.message }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTransferStore } from '../stores/transferStore'
import { useWsStore }       from '../stores/wsStore'

const store = useTransferStore()
const ws    = useWsStore()

/**
 * 🔑 INTEGRADOR DEL BUFFER DE DATOS:
 * Para evitar que las descargas y subidas queden separadas o rompan la UI, 
 * unificamos tus arrays del store asegurando que lleven el tag de su naturaleza.
 */
const allTransfers = computed(() => {
  // Si en tu store manejas arrays separados como store.downloads o store.uploads,
  // aquí los inyectamos y unificamos dinámicamente con su tipo correspondiente.
  const ds = (store.downloads || []).map(d => ({ ...d, type: 'download' }))
  const us = (store.transfers || []).map(u => ({ ...u, type: 'upload' }))
  
  // Retornamos la lista unificada ordenada de la más reciente a la más vieja
  return [...ds, ...us].reverse()
})

/**
 * 📊 GENERADOR DE MÉTRICAS AVANZADAS PARA TESIS
 * Transforma datos planos en variables analíticas útiles para el reporte escrito.
 */
const metrics = computed(() => {
  const total = allTransfers.value.length
  const completadas = allTransfers.value.filter(t => t.status === 'done')
  const activas = allTransfers.value.filter(t => t.status === 'active').length
  const errores = allTransfers.value.filter(t => t.status === 'error').length

  // 1. Calcular Datos Totales Procesados con éxito
  const bytesProcesados = completadas.reduce((acc, cur) => acc + (cur.size || 0), 0)
  
  // 2. Calcular la Tasa de Éxito del Sistema (Métrica de estabilidad de red para el reporte)
  const tasaExito = total > 0 ? ((completadas.length / total) * 100).toFixed(0) + '%' : '100%'

  return [
    { label: 'Operaciones Totales', value: total,                             color: 'var(--text)' },
    { label: 'Flujos Activos',      value: activas,                           color: 'var(--brand)' },
    { label: 'Volumen Exitoso',     value: formatSize(bytesProcesados),       color: '#00d4aa' },
    { label: 'Tasa de Eficiencia',  value: tasaExito,                         color: errores > 0 ? 'var(--danger)' : '#00d4aa' }
  ]
})

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024)      return bytes + ' B'
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB'
  return (bytes / 1024 ** 3).toFixed(2) + ' GB'
}

function labelStatus(s) {
  return { active: '⚡ Corriendo', paused: '⏸ Pausado', done: '✅ Completo', error: '❌ Error' }[s] ?? s
}
</script>

<style scoped>
.transfers-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}
.page-sub { color: var(--text-muted); font-size: 0.85rem; margin-top: 4px; }

.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.ws-indicator {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid transparent;
}
.ws--on  { background: rgba(0,212,170,0.1);  color: var(--brand);    border-color: rgba(0,212,170,0.2); }
.ws--off { background: var(--bg-elevated);   color: var(--text-muted); border-color: var(--border); }

.ws-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.ws--on .ws-dot { animation: blink 1.2s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.2s;
}
.stat-card:hover { border-color: rgba(0,212,170,0.2); }
.stat-num   { font-size: 2rem; font-weight: 800; }
.stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

/* Empty */
.empty {
  text-align: center;
  padding: 64px 24px;
  background: var(--bg-surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.empty-icon { font-size: 3rem; }
.empty p    { color: var(--text-muted); }

/* Lista */
.transfer-list { display: flex; flex-direction: column; gap: 10px; }

.transfer-row {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 16px 20px;
  transition: all 0.2s;
  flex-wrap: wrap;
}
.transfer-row:hover {
  border-color: rgba(0,212,170,0.25);
  box-shadow: 0 0 16px rgba(0,212,170,0.05);
}

.tr-left  { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 180px; }
.tr-icon  { font-size: 1.5rem; }
.tr-name  { font-weight: 600; font-size: 0.88rem; }
.tr-meta  { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

.tr-center { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 140px; }
.mini-bar-wrap {
  flex: 1;
  height: 5px;
  background: rgba(255,255,255,0.05);
  border-radius: 999px;
  overflow: hidden;
}
.mini-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-dim), var(--brand));
  border-radius: 999px;
  transition: width 0.4s;
  box-shadow: 0 0 6px rgba(0,212,170,0.4);
}
.tr-pct { font-size: 0.78rem; color: var(--text-muted); min-width: 36px; text-align: right; }

.tr-right { display: flex; align-items: center; gap: 8px; }

.status-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.status--active  { background: var(--brand-glow);           color: var(--brand); }
.status--paused  { background: rgba(245,166,35,0.12);        color: #f5a623; }
.status--done    { background: rgba(0,212,170,0.12);         color: var(--brand); }
.status--error   { background: rgba(255,92,122,0.12);        color: var(--danger); }

.icon-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 7px;
  width: 32px; height: 32px;
  display: grid; place-items: center;
  cursor: pointer;
  font-size: 0.82rem;
  text-decoration: none;
  color: var(--text);
  transition: all 0.2s;
}
.icon-btn:hover { border-color: var(--border-hover); background: var(--brand-glow); }

/* Card / Log */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
}
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.log-body {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
}
.log-empty { color: var(--text-dim); text-align: center; padding: 24px; }
.log-line {
  display: flex;
  gap: 10px;
  padding: 5px 8px;
  border-radius: 6px;
  align-items: baseline;
}
.log-line:hover    { background: var(--bg-elevated); }
.log-time          { color: var(--text-dim); min-width: 80px; }
.log-type          { min-width: 58px; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; }
.log-msg           { flex: 1; color: var(--text-muted); }
.log--system  .log-type { color: var(--text-dim); }
.log--error   .log-type { color: var(--danger); }
.log--info    .log-type { color: var(--info); }
.log--success .log-type { color: var(--brand); }

/* Botones */
.btn {
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn--primary { background: var(--brand); color: #080d14; }
.btn--primary:hover { background: var(--brand-dim); box-shadow: var(--shadow-brand); }
.btn--ghost   { background: var(--bg-elevated); color: var(--text-muted); border: 1px solid var(--border); }
.btn--ghost:hover   { border-color: var(--border-hover); color: var(--text); }
.btn--sm      { padding: 5px 12px; font-size: 0.78rem; }

.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from { opacity: 0; transform: translateY(-8px); }
.list-leave-to   { opacity: 0; transform: translateY(8px); }

@media (max-width: 640px) {
  .stats-row    { grid-template-columns: repeat(2, 1fr); }
  .transfer-row { flex-direction: column; align-items: flex-start; }
  .tr-center    { width: 100%; }
}
@media (max-width: 480px) {
  .stats-row        { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-card        { padding: 14px; }
  .stat-num         { font-size: 1.5rem; }
  .transfer-row     { padding: 14px 12px; }
  .tr-name          { font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
  .page-header      { flex-direction: column; }
  .header-actions   { width: 100%; justify-content: space-between; }
  .log-body         { max-height: 160px; font-size: 0.72rem; }
  .card             { padding: 16px 14px; }
}
</style>