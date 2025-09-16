type Progress = { uploaded: number; total: number; done: boolean }

const getStore = (): Map<string, Progress> => {
  const g = globalThis as any
  if (!g.__HL_UPLOAD_PROGRESS) {
    g.__HL_UPLOAD_PROGRESS = new Map<string, Progress>()
  }
  return g.__HL_UPLOAD_PROGRESS as Map<string, Progress>
}

export const setProgress = (id: string, p: Progress) => {
  const store = getStore()
  store.set(id, p)
}

export const getProgress = (id: string): Progress | undefined => {
  const store = getStore()
  return store.get(id)
}

export const clearProgress = (id: string) => {
  const store = getStore()
  store.delete(id)
}




