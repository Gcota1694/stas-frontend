const CHUNK_SIZE = 1024 * 1024 // 1 MB por chunk

export function splitFile(file) {
  const chunks = []
  let offset = 0
  let index = 0

  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size)
    chunks.push({
      index,
      blob: file.slice(offset, end),
      start: offset,
      end,
      size: end - offset,
      status: 'pending' // pending | uploading | done | error
    })
    offset = end
    index++
  }

  return chunks
}

export function calcProgress(chunks) {
  if (!chunks || chunks.length === 0) return 0
  const done = chunks.filter(c => c.status === 'done').length
  return Math.round((done / chunks.length) * 100)
}