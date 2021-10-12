const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length: number) {
  let str = ''

  for (let i = 0; i < length; ++i) {
    str += CHARS[Math.floor(Math.random() * CHARS.length)]
  }

  return str
}
