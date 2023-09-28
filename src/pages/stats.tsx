import { GoogleButton } from '@/components/google-button'
import { Icons } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { getFlag, useCurrentLocale } from '@/lib/utils'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'

export function Stats() {
  const session = useSession()

  const myStats = useQuery(
    supabase
      .from('rankings')
      .select('streak,wins,losses,rank')
      .eq('id', session?.user.id as string)
      .limit(1)
      .single(),
    { enabled: !!session }
  )

  const leaderboard = useQuery(
    supabase
      .from('rankings')
      .select('id,username,country,streak,wins,losses,rank')
      .limit(10)
  )

  const locale = useCurrentLocale()
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })

  const formatWinsLosses = (wins: number | null, losses: number | null) => {
    if (!wins || !losses) return 0
    if (losses === 0) return wins
    return wins / losses
  }

  return (
    <div className="flex-grow container py-6 md:py-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Stats</h2>

        <p className="text-muted-foreground">
          See how your Wordle skils match up against other players around the
          world.
        </p>
      </div>

      {!session ? (
        <Alert className="max-w-lg mt-4">
          <Icons.Info className="h-4 w-4" />
          <AlertTitle>You're signed out</AlertTitle>
          <AlertDescription>
            You can sign into or create your account to save your stats and
            compete on the leaderboard.
            <GoogleButton redirectTo="/stats" className="mt-2" />
          </AlertDescription>
        </Alert>
      ) : null}

      <Separator className="my-6" />

      <StatSection {...myStats.data} />

      <h2 className="mt-12 text-lg font-medium">Leaderboard</h2>
      <p className="text-sm text-muted-foreground mb-6">
        The top players from around the globe.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Rank</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Wins</TableHead>
            <TableHead>Losses</TableHead>
            <TableHead className="text-right">W/L Ratio</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {leaderboard.isLoading
            ? Array.from(new Array(10)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell className="text-right">0</TableCell>
                </TableRow>
              ))
            : leaderboard.data?.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">#{user.rank}</TableCell>
                  <TableCell>
                    {user.country ? getFlag(user.country) : ' '} {user.username}{' '}
                    {user.id === session?.user.id ? ' (You)' : null}
                  </TableCell>
                  <TableCell>{formatter.format(user.wins ?? 0)}</TableCell>
                  <TableCell>{formatter.format(user.losses ?? 0)}</TableCell>
                  <TableCell className="text-right">
                    {formatter.format(formatWinsLosses(user.wins, user.losses))}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}

function StatSection({
  rank,
  streak,
  wins,
  losses,
}: {
  rank?: number | null
  streak?: number | null
  wins?: number | null
  losses?: number | null
}) {
  const locale = useCurrentLocale()
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Stat
        title="Rank"
        icon="🏅"
        description="Your global rank"
        value={rank ? `#${rank}` : '-'}
      />

      <Stat
        title="Streak"
        icon="🔥"
        description="Number of consecutive wins"
        value={streak ? formatter.format(streak) : '-'}
      />

      <Stat
        title="Wins"
        icon="🏆"
        description="Wins across all game modes"
        value={wins ? formatter.format(wins) : '-'}
      />

      <Stat
        title="Losses"
        icon="😔"
        description="Losses across all game modes"
        value={losses ? formatter.format(losses) : '-'}
      />
    </div>
  )
}

function Stat({
  title,
  icon,
  description,
  value,
}: {
  title: string
  icon: string
  description: string
  value: number | string
}) {
  return (
    <Card className="flex-grow">
      <CardHeader className="pb-1.5">
        <CardTitle className="font-normal text-base flex justify-between">
          {title} <span>{icon}</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="font-bold text-3xl leading-none tracking-tight mb-0.5">
          {value}
        </p>

        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  )
}
