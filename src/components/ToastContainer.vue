<template>
  <Teleport to="body">
    <div class="toast-wrap">
      <TransitionGroup name="toast">
        <div
          v-for="t in notify.toasts"
          :key="t.id"
          class="toast"
          :class="'toast--' + t.type"
          @click="notify.remove(t.id)"
        >
          <span class="toast__icon">{{ icons[t.type] }}</span>
          <span class="toast__msg">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotifyStore } from '../stores/notifyStore'
const notify = useNotifyStore()
const icons  = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' }
</script>

<style scoped>
.toast-wrap {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 9999;
  display: flex; flex-direction: column;
  gap: 10px; pointer-events: none;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem; font-weight: 500;
  backdrop-filter: blur(12px);
  pointer-events: all; cursor: pointer;
  min-width: 240px; max-width: 360px;
  box-shadow: var(--shadow);
  border: 1px solid transparent;
}
.toast--success { background: rgba(0,212,170,0.12);  border-color: rgba(0,212,170,0.25);  color: #00d4aa; }
.toast--error   { background: rgba(255,92,122,0.12); border-color: rgba(255,92,122,0.25); color: #ff5c7a; }
.toast--warn    { background: rgba(245,166,35,0.12); border-color: rgba(245,166,35,0.25); color: #f5a623; }
.toast--info    { background: rgba(123,97,255,0.12); border-color: rgba(123,97,255,0.25); color: #7b61ff; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to   { opacity: 0; transform: translateX(40px); }
</style>