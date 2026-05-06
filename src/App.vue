<template>
  <div class="layout">
    <header class="navbar">
      <div class="navbar__brand">
        <span class="navbar__icon">⚡</span>
        <span class="navbar__title">STAS</span>
        <span class="navbar__sub">Stream Transfer</span>
      </div>
      <nav class="navbar__links">
        <RouterLink to="/" class="nav-link">Inicio</RouterLink>
        <RouterLink to="/transfers" class="nav-link">Transferencias</RouterLink>
      </nav>
    </header>
    <main class="page">
      <RouterView />
    </main>
    <footer class="footer">
      <span>STAS © 2026 — Transferencia segura por bloques</span>
    </footer>
    <ToastContainer />
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import ToastContainer from './components/ToastContainer.vue'
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --brand:        #00d4aa;
  --brand-dim:    #00b38f;
  --brand-glow:   rgba(0, 212, 170, 0.15);
  --accent:       #7b61ff;
  --accent-dim:   rgba(123, 97, 255, 0.15);
  --bg-base:      #080d14;
  --bg-surface:   #0d1520;
  --bg-elevated:  #111d2e;
  --bg-subtle:    rgba(255,255,255,0.03);
  --border:       rgba(255,255,255,0.07);
  --border-hover: rgba(0, 212, 170, 0.3);
  --text:         #e8f0fe;
  --text-muted:   #6b7fa3;
  --text-dim:     #3d4f6b;
  --success:      #00d4aa;
  --warning:      #f5a623;
  --danger:       #ff5c7a;
  --info:         #7b61ff;
  --radius:       12px;
  --radius-sm:    8px;
  --shadow:       0 4px 32px rgba(0,0,0,0.5);
  --shadow-brand: 0 0 24px rgba(0, 212, 170, 0.12);
}

body {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.6;
  background-image: radial-gradient(rgba(0,212,170,0.04) 1px, transparent 1px);
  background-size: 28px 28px;
}

h1 { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 700; letter-spacing: -0.3px; }
h2 { font-size: clamp(1rem, 2vw, 1.3rem); font-weight: 600; }

::-webkit-scrollbar       { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,212,170,0.2); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,212,170,0.4); }
::selection { background: rgba(0,212,170,0.2); color: var(--text); }
</style>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; }

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 36px;
  height: 62px;
  background: rgba(8,13,20,0.85);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar__brand { display: flex; align-items: center; gap: 10px; }
.navbar__icon  { font-size: 1.3rem; }

.navbar__title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--brand);
  letter-spacing: 3px;
  text-shadow: 0 0 20px rgba(0,212,170,0.4);
}

.navbar__sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  border-left: 1px solid var(--border);
  padding-left: 10px;
  margin-left: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.navbar__links { display: flex; gap: 4px; }

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.nav-link:hover {
  color: var(--text);
  background: var(--bg-elevated);
  border-color: var(--border);
}
.nav-link.router-link-active {
  color: var(--brand);
  background: var(--brand-glow);
  border-color: rgba(0,212,170,0.2);
}

.page   { flex: 1; padding: 44px 28px; }

.footer {
  text-align: center;
  padding: 18px;
  font-size: 0.78rem;
  color: var(--text-dim);
  border-top: 1px solid var(--border);
  letter-spacing: 0.3px;
}

@media (max-width: 600px) {
  .navbar      { padding: 0 18px; }
  .navbar__sub { display: none; }
  .page        { padding: 24px 16px; }
}
</style>