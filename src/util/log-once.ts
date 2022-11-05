let LOGGED_MESSAGES: Set<string>

/**
 * Use for system-level logging, such as deprecation messages.
 * Logs a message and ensures it won't be logged again.
 */
export function logOnce(message: string): void {
  if (LOGGED_MESSAGES?.has(message)) {
    return
  }

  ;(LOGGED_MESSAGES ??= new Set()).add(message)
  console.log(message)
}
