<template>
  <div class="transfers-page">

    <div class="page-header">
      <div>
        <h1>Transferencias</h1>
        <p class="page-sub">Historial y estado de todas las transferencias activas</p>
      </div>
      <div class="header-actions">
        <div class="ws-indicator" :class="ws.connected ? 'ws--on' : 'ws--off'">
          <span class="ws-dot"></span>
          {{ ws.connected ? 'En vivo' : 'Sin conexión' }}
        </div>
        <button class="btn btn--ghost" @click="ws.connected ? ws.disconnect() : ws.connect()">
          {{ ws.connected ? '🔌 Desconectar' : '🔗 Conectar WS' }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <span class="stat-num" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="stat-label">{{ s.label }}</span>
      </div>
    </div>

    <!-- Lista vacía -->
    <div v-if="store.transfers.length === 0" class="empty">
      <span class="empty-icon">📭</span>
      <p>No hay transferencias aún</p>
      <RouterLink to="/" class="btn btn--primary">Subir archivo</RouterLink>
    </div>

    <!-- Lista de transferencias -->
    <div v-else class="transfer-list">
      <TransitionGroup name="list">
        <div
          v-for="t in [...store.transfers].reverse()"
          :key="t.id"
          class="transfer-row"
        >
          <div class="tr-left">
            <span class="tr-icon">📄</span>
            <div class="tr-info">
              <p class="tr-name">{{ t.name }}</p>
              <p class="tr-meta">{{ formatSize(t.size) }} · {{ t.chunks.length }} bloques</p>
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
            <button v-if="t.status === 'active'"  class="icon-btn" title="Pausar"   @click="store.pauseTransfer(t.id)">⏸</button>
            <button v-if="t.status === 'paused'"  class="icon-btn" title="Reanudar" @click="store.resumeTransfer(t.id)">▶</button>
            <RouterLink :to="'/transfers/' + t.id" class="icon-btn" title="Ver detalle">🔍</RouterLink>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Log WebSocket -->
    <div class="card log-card">
      <div class="log-header">
        <h2>Log WebSocket</h2>
        <button class="btn btn--ghost btn--sm" @click="ws.clearEvents()">Limpiar</button>
      </div>
      <div class="log-body">
        <div v-if="ws.events.length === 0" class="log-empty">Sin eventos aún</div>
        <div v-for="e in ws.events" :key="e.id" class="log-line" :class="'log--' + e.type">
          <span class="log-time">{{ e.time }}</span>
          <span class="log-type">{{ e.type }}</span>
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

const stats = computed(() => [
  { label: 'Total',        value: store.transfers.length,                                    color: 'var(--text)' },
  { label: 'Activas',      value: store.transfers.filter(t => t.status === 'active').length, color: 'var(--brand)' },
  { label: 'Completadas',  value: store.transfers.filter(t => t.status === 'done').length,   color: '#00d4aa' },
  { label: 'Con error',    value: store.transfers.filter(t => t.status === 'error').length,  color: 'var(--danger)' },
])

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
</style>