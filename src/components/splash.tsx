export function Splash({ type }: { type: 'loading' | '404' }) {
  return (
    <main className="h-full flex flex-col items-center justify-center">
      <h2 className="mb-0.5 md:mb-5 text-2xl font-semibold tracking-tight">
        <span
          role="img"
          aria-label="dashing away"
          className=" inline-block rotate-180 text-2xl leading-none"
        >
          💨
        </span>
        Wordle Dash
      </h2>

      <p className="text-base text-muted-foreground">
        {type === 'loading' ? 'Loading...' : null}
        {type === '404' ? '404 | Not Found' : null}
      </p>
    </main>
  )
}
