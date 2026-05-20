import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const loading = ref(false)
  const error   = ref(null)

  const isLoggedIn = computed(() => !!user.value)

  // Escuchar cambios de sesión automáticamente
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })

  async function init() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
  }

  async function register(nombre, correo, password) {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email:    correo,
        password: password,
        options: {
          data: { full_name: nombre },
          emailRedirectTo: `${window.location.origin}/confirmar`
        }
      })
      if (err) throw err
      return { success: true, data }
    } catch (e) {
      error.value = e.message
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  async function login(correo, password) {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email:    correo,
        password: password
      })
      if (err) throw err
      user.value = data.user
      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, loading, error, isLoggedIn, init, register, login, logout }
})