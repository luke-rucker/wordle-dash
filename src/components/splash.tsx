import { LoadingDots } from '@/components/loading-dots'

export function Splash({ type }: { type: 'loading' | '404' | '500' }) {
  return (
    <main className="h-full flex flex-col items-center justify-center">
      <h2 className="mb-0.5 md:mb-5 text-2xl font-semibold tracking-tight">
        <span
          role="img"
          aria-label="dashing away"
          className="inline-block rotate-180 text-2xl leading-none mr-1"
        >
          💨
        </span>
        Wordle Dash
      </h2>

      <p className="text-base text-muted-foreground">
        {type === 'loading' ? (
          <>
            Loading
            <LoadingDots />
          </>
        ) : null}
        {type === '404' ? '404 | Not Found' : null}
        {type === '500' ? '500 | Server Error' : null}
      </p>
    </main>
  )
}
