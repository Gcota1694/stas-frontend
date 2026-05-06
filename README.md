# ⚡ STAS Frontend — Sistema de Transferencia de Archivos por Stream

![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=flat-square&logo=vite)
![Pinia](https://img.shields.io/badge/Pinia-3.x-f7d336?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-00d4aa?style=flat-square)

Frontend del Sistema de Transferencia de Archivos por Stream (STAS), desarrollado con **Vue 3**, **Pinia** y **Vue Router**. Implementa transferencia de archivos mediante fragmentación por bloques (chunking), permitiendo pausar, reanudar y monitorear cada transferencia en tiempo real.

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Variables de entorno](#-variables-de-entorno)
- [Conexión con el backend](#-conexión-con-el-backend)
- [Scripts disponibles](#-scripts-disponibles)
- [Equipo](#-equipo)

---

## 📖 Descripción

STAS es un sistema diseñado para transferir archivos de gran volumen de forma resiliente. El frontend se encarga de:

- Fragmentar el archivo en bloques de **2 MB** antes de enviarlo
- Mostrar el progreso bloque por bloque en tiempo real
- Permitir **pausar y reanudar** la transferencia en cualquier momento
- Conectarse al backend via **WebSocket** para recibir confirmaciones en vivo
- Visualizar el estado de cada chunk individualmente

---

## ✨ Características

- 📁 **Drag & Drop** — arrastra cualquier archivo o selecciónalo desde el explorador
- 🧩 **Chunking inteligente** — fragmentación automática en bloques de 2 MB
- ⏯ **Pausa y reanuda** — continúa donde quedó sin perder ningún bloque
- 📊 **Mapa visual de bloques** — visualiza el estado de cada chunk en tiempo real
- 🔌 **WebSocket en vivo** — log de eventos con reconexión automática
- 🔔 **Notificaciones toast** — feedback inmediato de cada acción
- 📱 **Responsive** — funciona en desktop y móvil
- 🌙 **Dark theme** — interfaz oscura profesional

---

## 🛠 Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Vue 3 | 3.x | Framework principal |
| Vite | 8.x | Bundler y dev server |
| Pinia | 3.x | Manejo de estado global |
| Vue Router | 4.x | Navegación entre vistas |
| Axios | 1.x | Peticiones HTTP al backend |

---

## ✅ Requisitos previos

Antes de instalar asegúrate de tener:

- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior
- Git

Verifica tus versiones:

```bash
node -v
npm -v
git --version
```

---

## 🚀 Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/Gcota1694/stas-frontend.git

# 2. Entra a la carpeta
cd stas-frontend

# 3. Instala las dependencias
npm install

# 4. Crea el archivo de variables de entorno
cp .env.example .env

# 5. Levanta el servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 💻 Uso

### Subir un archivo

1. Ve a la pantalla de **Inicio**
2. Arrastra un archivo al área de drop o haz clic para seleccionarlo
3. La transferencia iniciará automáticamente
4. Usa los botones **⏸ Pausar** / **▶ Reanudar** según necesites

### Ver transferencias

1. Navega a **Transferencias** en el navbar
2. Verás la lista de todas las transferencias con su estado y progreso
3. Haz clic en 🔍 para ver el detalle completo de una transferencia

### Detalle de transferencia

- **Mapa de bloques** — cada cuadro representa un chunk (gris = pendiente, verde = completado, rojo = error)
- **Tabla filtrable** — filtra chunks por estado
- **Estadísticas** — resumen de bloques por estado

---

## 📁 Estructura del proyecto

| Carpeta / Archivo | Descripción |
|---|---|
| `public/favicon.ico` | Ícono de la app |
| `src/assets/main.css` | Estilos globales y variables CSS |
| `src/components/FileDropzone.vue` | Área de drag & drop |
| `src/components/ChunkProgress.vue` | Barra visual de chunks |
| `src/components/TransferCard.vue` | Tarjeta de transferencia |
| `src/components/StatusBadge.vue` | Badge de estado |
| `src/components/ToastContainer.vue` | Notificaciones toast |
| `src/views/HomeView.vue` | Pantalla principal / upload |
| `src/views/TransfersView.vue` | Lista de transferencias |
| `src/views/DetailView.vue` | Detalle de una transferencia |
| `src/stores/transferStore.js` | Estado de chunks y progreso |
| `src/stores/wsStore.js` | WebSocket reactivo |
| `src/stores/notifyStore.js` | Notificaciones |
| `src/services/api.js` | Axios + endpoints HTTP |
| `src/services/chunker.js` | Lógica de fragmentación |
| `src/services/websocket.js` | WebSocket con reconexión |
| `src/router/index.js` | Rutas de la aplicación |
| `src/App.vue` | Componente raíz |
| `src/main.js` | Entry point |
| `.env.example` | Variables de entorno de ejemplo |
| `vite.config.js` | Configuración de Vite |
---

## 🔧 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
# URL base del backend
VITE_API_URL=http://localhost:3000

# URL del WebSocket
VITE_WS_URL=ws://localhost:3000/ws
```

> ⚠️ Todas las variables deben comenzar con `VITE_` para que Vite las exponga al cliente.

---

## 🔌 Conexión con el backend

El frontend espera que el backend exponga los siguientes endpoints:

### HTTP (Axios)

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/upload/chunk` | Recibe un chunk individual |
| `GET` | `/transfers` | Lista todas las transferencias |
| `GET` | `/transfers/:id` | Detalle de una transferencia |

### Cuerpo del chunk (multipart/form-data)
transferId   string    ID único de la transferencia
chunkIndex   number    Índice del bloque (desde 0)
totalChunks  number    Total de bloques del archivo
file         Blob      Datos binarios del bloque

### WebSocket

| Evento | Dirección | Descripción |
|---|---|---|
| `chunk_received` | Backend → Frontend | Confirmación de chunk recibido |
| `transfer_done` | Backend → Frontend | Transferencia completada |
| `transfer_error` | Backend → Frontend | Error en la transferencia |

### Ejemplo de mensaje WebSocket esperado

```json
{
  "type": "chunk_received",
  "transferId": "abc123",
  "chunkIndex": 4,
  "message": "Bloque 5 recibido correctamente"
}
```

---

## 📜 Scripts disponibles

```bash
# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build de producción
npm run preview

# Linting
npm run lint
```

---

## 👥 Equipo

| Rol | Nombre | GitHub |
|---|---|---|
| Frontend | Gcota1694 | [@Gcota1694](https://github.com/Gcota1694) |
| Backend  | *(tu compañero)* | @usuario_compañero |

---

## 📄 Licencia

Este proyecto fue desarrollado como parte del curso **Desarrollo Backend II** — 2026.

---

<div align="center">
  Hecho con ❤️ y Vue 3
</div>