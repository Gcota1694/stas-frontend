import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 🏠 Vista Principal: Subida de archivos (Uploads)
    { 
      path: '/', 
      name: 'home', 
      component: HomeView 
    },
    // 📥 Nueva Vista: Descarga de archivos por Stream (STAS)
    { 
      path: '/downloads', 
      name: 'downloads',
      component: () => import('../views/DownloadsView.vue') 
    },
    // 🗂️ Mantenemos la ruta de detalles por si necesitas auditoría o métricas por archivo en tu tesis
    { 
      path: '/downloads/:id', 
      name: 'download-detail',
      component: () => import('../views/DetailView.vue') 
    },
    // 🔄 Nueva Vista: Transferencias de archivos
    { 
      path: '/transfers', 
      name: 'transfers',
      component: () => import('../views/TransfersView.vue') 
    }
    
  ]
})

export default router