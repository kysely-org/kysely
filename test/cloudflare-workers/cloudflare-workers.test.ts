//
;(async () => {
  const result = await fetch('http://localhost:8787/pg')

  if (!result.ok) {
    throw new Error(await result.text())
  }

  await result.json()
})()
