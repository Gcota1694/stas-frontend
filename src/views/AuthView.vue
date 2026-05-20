<template>
  <div class="auth-page">
    <div class="auth-card">

      <!-- Logo -->
      <div class="auth-logo">
        <span class="auth-logo__icon">⚡</span>
        <span class="auth-logo__title">STAS</span>
      </div>

      <!-- Tabs -->
      <div class="auth-tabs">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': modo === 'login' }"
          @click="modo = 'login'; resetForm()"
        >Iniciar sesión</button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': modo === 'register' }"
          @click="modo = 'register'; resetForm()"
        >Registrarse</button>
      </div>

      <!-- Éxito registro -->
      <Transition name="fade">
        <div v-if="registroExitoso" class="success-box">
          <span class="success-box__icon">📧</span>
          <h3>¡Revisa tu correo!</h3>
          <p>Te enviamos un enlace de confirmación a <strong>{{ form.correo }}</strong>. Haz clic en el enlace para activar tu cuenta.</p>
          <button class="btn btn--ghost btn--full" @click="registroExitoso = false; modo = 'login'">
            Ir a iniciar sesión
          </button>
        </div>
      </Transition>

      <!-- Formulario -->
      <form v-if="!registroExitoso" class="auth-form" @submit.prevent="handleSubmit">

        <!-- Nombre (solo registro) -->
        <Transition name="slide">
          <div v-if="modo === 'register'" class="field">
            <label class="field__label">Nombre completo</label>
            <input
              v-model="form.nombre"
              type="text"
              class="field__input"
              :class="{ 'field__input--error': errores.nombre }"
              placeholder=""
              autocomplete="name"
            />
            <span v-if="errores.nombre" class="field__error">{{ errores.nombre }}</span>
          </div>
        </Transition>

        <!-- Correo -->
        <div class="field">
          <label class="field__label">Correo electrónico</label>
          <input
            v-model="form.correo"
            type="email"
            class="field__input"
            :class="{ 'field__input--error': errores.correo }"
            placeholder="Ejemplo@ejemplo.com"
            autocomplete="email"
          />
          <span v-if="errores.correo" class="field__error">{{ errores.correo }}</span>
        </div>

        <!-- Contraseña -->
        <div class="field">
          <label class="field__label">Contraseña</label>
          <div class="field__password">
            <input
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              class="field__input"
              :class="{ 'field__input--error': errores.password }"
              placeholder="Mínimo 6 caracteres"
              autocomplete="current-password"
            />
            <button type="button" class="field__eye" @click="showPass = !showPass">
              {{ showPass ? '🙈' : '👁' }}
            </button>
          </div>
          <span v-if="errores.password" class="field__error">{{ errores.password }}</span>
        </div>

        <!-- Confirmar contraseña (solo registro) -->
        <Transition name="slide">
          <div v-if="modo === 'register'" class="field">
            <label class="field__label">Confirmar contraseña</label>
            <div class="field__password">
              <input
                v-model="form.confirm"
                :type="showConfirm ? 'text' : 'password'"
                class="field__input"
                :class="{ 'field__input--error': errores.confirm }"
                placeholder="Repite tu contraseña"
              />
              <button type="button" class="field__eye" @click="showConfirm = !showConfirm">
                {{ showConfirm ? '🙈' : '👁' }}
              </button>
            </div>
            <span v-if="errores.confirm" class="field__error">{{ errores.confirm }}</span>
          </div>
        </Transition>

        <!-- Error global de Supabase -->
        <div v-if="auth.error" class="error-box">
          ⚠️ {{ traducirError(auth.error) }}
        </div>

        <!-- Botón submit -->
        <button type="submit" class="btn btn--primary btn--full" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner"></span>
          <span v-else>{{ modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}</span>
        </button>

      </form>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const auth   = useAuthStore()
const router = useRouter()

const modo            = ref('login')
const showPass        = ref(false)
const showConfirm     = ref(false)
const registroExitoso = ref(false)

const form = reactive({
  nombre:   '',
  correo:   '',
  password: '',
  confirm:  ''
})

const errores = reactive({
  nombre:   '',
  correo:   '',
  password: '',
  confirm:  ''
})

function resetForm() {
  Object.assign(form,    { nombre: '', correo: '', password: '', confirm: '' })
  Object.assign(errores, { nombre: '', correo: '', password: '', confirm: '' })
  showPass.value    = false
  showConfirm.value = false
}

function validar() {
  let ok = true
  Object.assign(errores, { nombre: '', correo: '', password: '', confirm: '' })

  if (modo.value === 'register' && !form.nombre.trim()) {
    errores.nombre = 'El nombre es requerido'; ok = false
  }
  if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
    errores.correo = 'Ingresa un correo válido'; ok = false
  }
  if (form.password.length < 6) {
    errores.password = 'Mínimo 6 caracteres'; ok = false
  }
  if (modo.value === 'register' && form.password !== form.confirm) {
    errores.confirm = 'Las contraseñas no coinciden'; ok = false
  }
  return ok
}

async function handleSubmit() {
  if (!validar()) return

  if (modo.value === 'login') {
    const res = await auth.login(form.correo, form.password)
    if (res.success) router.push('/')
  } else {
    const res = await auth.register(form.nombre, form.correo, form.password)
    if (res.success) registroExitoso.value = true
  }
}

function traducirError(msg) {
  const errMap = {
    'Invalid login credentials':     'Correo o contraseña incorrectos',
    'Email not confirmed':           'Debes confirmar tu correo antes de entrar',
    'User already registered':       'Este correo ya está registrado',
    'Password should be at least 6': 'La contraseña debe tener al menos 6 caracteres',
    'Unable to validate email':      'Correo inválido',
  }
  for (const [key, val] of Object.entries(errMap)) {
    if (msg.includes(key)) return val
  }
  return msg
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 40px 36px;
  box-shadow: var(--shadow);
}

/* Logo */
.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
}
.auth-logo__icon  { font-size: 1.8rem; }
.auth-logo__title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--brand);
  letter-spacing: 4px;
  text-shadow: 0 0 24px rgba(0,212,170,0.4);
}

/* Tabs */
.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: 28px;
}
.tab-btn {
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn--active {
  background: var(--brand-glow);
  color: var(--brand);
  border: 1px solid rgba(0,212,170,0.2);
}

/* Formulario */
.auth-form { display: flex; flex-direction: column; gap: 18px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field__label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.field__input {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  padding: 11px 14px;
  font-size: 0.92rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}
.field__input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(0,212,170,0.1);
}
.field__input--error {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px rgba(255,92,122,0.1);
}
.field__input::placeholder { color: var(--text-dim); }

.field__password { position: relative; }
.field__password .field__input { padding-right: 44px; }
.field__eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 2px;
  line-height: 1;
}

.field__error {
  font-size: 0.78rem;
  color: var(--danger);
}

/* Cajas de estado */
.error-box {
  background: rgba(255,92,122,0.08);
  border: 1px solid rgba(255,92,122,0.2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 0.85rem;
  color: var(--danger);
}

.success-box {
  background: rgba(0,212,170,0.08);
  border: 1px solid rgba(0,212,170,0.2);
  border-radius: var(--radius);
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.success-box__icon { font-size: 2.5rem; }
.success-box h3    { color: var(--brand); font-size: 1.1rem; }
.success-box p     { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; }
.success-box strong { color: var(--text); }

/* Botones */
.btn {
  padding: 11px 22px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn--primary  { background: var(--brand); color: #080d14; }
.btn--primary:hover:not(:disabled) { background: var(--brand-dim); box-shadow: var(--shadow-brand); }
.btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--ghost    { background: var(--bg-elevated); color: var(--text-muted); border: 1px solid var(--border); }
.btn--ghost:hover { border-color: var(--border-hover); color: var(--text); }
.btn--full     { width: 100%; }

/* Spinner */
.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(8,13,20,0.3);
  border-top-color: #080d14;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Transiciones */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; overflow: hidden; }
.slide-enter-from, .slide-leave-to       { opacity: 0; max-height: 0; margin: 0; }
.slide-enter-to, .slide-leave-from      { max-height: 120px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

@media (max-width: 480px) {
  .auth-card { padding: 28px 20px; }
}
</style>