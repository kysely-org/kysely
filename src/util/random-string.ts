const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length: number) {
  let chars: string[] = new Array(length)

  for (let i = 0; i < length; ++i) {
    chars[i] = CHARS[Math.floor(Math.random() * CHARS.length)]
  }

  return chars.join('')
}
