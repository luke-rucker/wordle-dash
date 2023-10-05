async function main() {
  await fetch(
    'https://wordle-dash.luke-rucker.partykit.dev/parties/main/main',
    {
      method: 'POST',
      body: JSON.stringify({ type: 'reset' }),
      headers: { 'content-type': 'application/json' },
    }
  )
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
