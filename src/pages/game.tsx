import { useParams } from 'react-router-dom'

export function Game() {
  const { gameId } = useParams()

  return <h1>{gameId}</h1>
}
