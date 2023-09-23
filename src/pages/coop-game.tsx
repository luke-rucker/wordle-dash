import { useParams } from 'react-router-dom'

export function CoopGame() {
  const { gameId } = useParams()
  return <div className="container">{gameId}</div>
}
