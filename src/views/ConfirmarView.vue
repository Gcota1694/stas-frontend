<template>
  <div class="confirm-page">
    <div class="confirm-card">
      <span class="confirm-icon">{{ estado.icon }}</span>
      <h2>{{ estado.titulo }}</h2>
      <p>{{ estado.mensaje }}</p>
      <RouterLink to="/auth" class="btn btn--primary">Ir a iniciar sesión</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { RouterLink } from 'vue-router'

const auth = useAuthStore()

const estado = computed(() => {
  if (auth.isLoggedIn) return {
    icon:    '✅',
    titulo:  '¡Cuenta confirmada!',
    mensaje: 'Tu correo fue verificado correctamente. Ya puedes usar STAS.'
  }
  return {
    icon:    '⏳',
    titulo:  'Verificando...',
    mensaje: 'Procesando tu confirmación de correo.'
  }
})
</script>

<style scoped>
.confirm-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.confirm-card {
  max-width: 400px;
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.confirm-icon { font-size: 3rem; }
.confirm-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; }

.btn {
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  background: var(--brand);
  color: #080d14;
  margin-top: 8px;
  transition: all 0.2s;
}
.btn:hover { background: var(--brand-dim); }
</style>