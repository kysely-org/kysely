let ALREADY_LOGGED: Set<string>

export function logOnce(message: string): void {
  if (ALREADY_LOGGED?.has(message)) {
    return
  }

  ;(ALREADY_LOGGED ??= new Set()).add(message)
  console.log(message)
}
