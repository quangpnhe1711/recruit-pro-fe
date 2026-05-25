import { APP_STORAGE_PREFIX } from '../constants/app.constants'

const buildKey = (key) => `${APP_STORAGE_PREFIX}:${key}`

export const storage = {
  get(key) {
    const value = window.localStorage.getItem(buildKey(key))
    return value ? JSON.parse(value) : null
  },

  set(key, value) {
    window.localStorage.setItem(buildKey(key), JSON.stringify(value))
  },

  remove(key) {
    window.localStorage.removeItem(buildKey(key))
  },
}
