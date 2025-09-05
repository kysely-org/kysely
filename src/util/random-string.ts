export function randomString(length: number): string {
  return String.fromCharCode(
    ...Array.from({ length }, () => {
      const n = Math.floor(Math.random() * 62)
      if (n < 26) return 65 + n             // 'A'-'Z'
      if (n < 52) return 97 + (n - 26)      // 'a'-'z'
      return 48 + (n - 52)                  // '0'-'9'
    })
  )
}
