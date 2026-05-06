<template>
  <div
    class="dropzone"
    :class="{ 'dropzone--over': isDragging }"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="onDrop"
    @click="fileInput.click()"
  >
    <input ref="fileInput" type="file" hidden @change="onPick" />
    <div class="dropzone__icon">{{ isDragging ? '📂' : '📁' }}</div>
    <p class="dropzone__title">
      {{ isDragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí' }}
    </p>
    <p class="dropzone__sub">o haz clic para seleccionar — cualquier formato</p>
    <div class="dropzone__badge">Hasta 5 GB</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const emit = defineEmits(['file-selected'])
const isDragging = ref(false)
const fileInput  = ref(null)

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) emit('file-selected', file)
}
function onPick(e) {
  const file = e.target.files[0]
  if (file) emit('file-selected', file)
}
</script>

<style scoped>
.dropzone {
  border: 2px dashed rgba(0,212,170,0.25);
  border-radius: var(--radius);
  padding: 56px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
  background: rgba(0,212,170,0.03);
  user-select: none;
}
.dropzone:hover,
.dropzone--over {
  border-color: var(--brand);
  background: var(--brand-glow);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,212,170,0.1);
}
.dropzone__icon {
  font-size: 3rem;
  margin-bottom: 16px;
  transition: transform 0.2s;
}
.dropzone--over .dropzone__icon { transform: scale(1.2); }

.dropzone__title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}
.dropzone__sub {
  font-size: 0.83rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}
.dropzone__badge {
  display: inline-block;
  background: var(--brand-glow);
  color: var(--brand);
  border: 1px solid rgba(0,212,170,0.25);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>