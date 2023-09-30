import * as React from 'react'

const frames = ['.', '..', '...']

export function LoadingDots() {
  const [current, setCurrent] = React.useState(frames.length - 1)

  React.useEffect(() => {
    const timer = setInterval(
      () => setCurrent(cur => (cur === frames.length - 1 ? 0 : cur + 1)),
      500
    )
    return () => clearInterval(timer)
  }, [])

  return frames[current]
}
