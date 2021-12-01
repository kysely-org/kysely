const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length: number) {
  let chars = ''

  for (let i = 0; i < length; ++i) {
    chars += randomChar()
  }

  return chars
}

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}
