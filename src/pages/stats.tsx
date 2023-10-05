import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
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
import * as React from 'react'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import ReactGA from 'react-ga4'
import { SignedOutAlert } from '@/components/signed-out-alert'
import { useToast } from '@/components/ui/use-toast'

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

  const myRank = myStats.data?.rank ?? 0
  const hasSurroundingLeaderboard =
    !!session && !!myStats.data?.rank && myRank > 10

  const surroundingLeaderboard = useQuery(
    supabase
      .from('rankings')
      .select('id,username,country,streak,wins,losses,rank')
      .gte('rank', myRank - 2)
      .lte('rank', myRank + 2),
    { enabled: hasSurroundingLeaderboard }
  )

  const toaster = useToast()
  const [copied, setCopied] = React.useState(false)

  const locale = useCurrentLocale()
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })

  const formatStats = () => {
    if (!myStats.data) return
    const { rank, wins, losses, streak } = myStats.data
    if (!rank || typeof wins !== 'number' || typeof losses !== 'number') return

    return `My Wordle Dash Stats\n\n🏅 #${formatter.format(
      rank
    )} Player in the world\n🏆 ${formatter.format(
      wins
    )} Wins\n😔 ${formatter.format(losses)} Losses\n🔥 ${formatter.format(
      streak ?? 0
    )} Win Streak\n\nPlay at wordledash.io :)`
  }

  return (
    <div className="flex-grow container py-6 md:py-16">
      <div className="flex flex-col md:flex-row md:justify-between">
        <div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">Stats</h2>

            <p className="text-muted-foreground">
              See how your Wordle skils match up against other players around
              the world.
            </p>
          </div>

          {!session ? (
            <SignedOutAlert redirectTo="/stats" className="mt-4 max-w-md" />
          ) : null}
        </div>

        {session ? (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 mt-4 md:mt-0">
            <Button
              aria-disabled={myStats.isLoading}
              onClick={async () => {
                const stats = formatStats()
                if (!stats) return
                await navigator.clipboard
                  .writeText(stats)
                  .then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2500)
                    ReactGA.event('copied_stats')
                  })
                  .catch(() => {})
              }}
            >
              {copied ? (
                <>
                  <Icons.Check className="h-4 w-4 mr-2" />
                  Copied stats
                </>
              ) : (
                <>
                  <Icons.Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>

            <Button
              aria-disabled={myStats.isLoading}
              onClick={async () => {
                const stats = formatStats()
                if (!stats) return

                if (!navigator.canShare) {
                  return toaster.toast({
                    title: 'Your browser does not support sharing.',
                    variant: 'destructive',
                  })
                }

                if (
                  !navigator.canShare({
                    title: 'Wordle Dash Stats',
                    text: stats,
                  })
                ) {
                  return toaster.toast({
                    title: 'Your browser does not support sharing.',
                    variant: 'destructive',
                  })
                }

                await navigator
                  .share({ title: 'Wordle Dash Stats', text: stats })
                  .then(() => {
                    ReactGA.event('shared_stats')
                  })
                  .catch(() => {})
              }}
            >
              <Icons.Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        ) : null}
      </div>

      <Separator className="my-6" />

      <StatSection {...myStats.data} />

      <h2 className="mt-12 text-lg font-medium">Leaderboard</h2>
      <p className="text-sm text-muted-foreground mb-6">
        The top players from around the globe.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>
              <span className="block sm:hidden">W</span>
              <span className="hidden sm:block">Wins</span>
            </TableHead>
            <TableHead>
              <span className="block sm:hidden">L</span>
              <span className="hidden sm:block">Losses</span>
            </TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              W/L Ratio
            </TableHead>
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
                  <TableCell className="text-right hidden sm:table-cell">
                    0
                  </TableCell>
                </TableRow>
              ))
            : leaderboard.data?.map(user => (
                <LeaderboardRow {...user} key={user.id} />
              ))}

          {hasSurroundingLeaderboard ? (
            <>
              <TableRow>
                <TableCell colSpan={5} className="text-center tracking-widest">
                  ...
                </TableCell>
              </TableRow>

              {surroundingLeaderboard.data
                ?.filter(user => (user.rank ?? 0) > 10)
                .map(user => <LeaderboardRow {...user} key={user.id} />)}
            </>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}

function LeaderboardRow(user: {
  id: string | null
  username: string | null
  country: string | null
  streak: number | null
  wins: number | null
  losses: number | null
  rank: number | null
}) {
  const session = useSession()

  const formatWinsLosses = (wins: number | null, losses: number | null) => {
    if (!wins && !losses) return 0
    if (losses === 0 || losses === null) return wins ?? 0
    return (wins ?? 0) / losses
  }

  const locale = useCurrentLocale()
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })

  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">#{user.rank}</TableCell>
      <TableCell>
        {user.country ? getFlag(user.country) : ' '}{' '}
        {user.username ?? '(Guest)'}{' '}
        {user.id === session?.user.id ? ' (You)' : null}
      </TableCell>
      <TableCell>{formatter.format(user.wins ?? 0)}</TableCell>
      <TableCell>{formatter.format(user.losses ?? 0)}</TableCell>
      <TableCell className="text-right hidden sm:table-cell">
        {formatter.format(formatWinsLosses(user.wins, user.losses))}
      </TableCell>
    </TableRow>
  )
}

function StatSection({
  rank,
  streak = 0,
  wins = 0,
  losses = 0,
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
        value={rank ? `#${formatter.format(rank)}` : '-'}
      />

      <Stat
        title="Wins"
        icon="🏆"
        description="Wins across all game modes"
        value={typeof wins === 'number' ? formatter.format(wins) : '-'}
      />

      <Stat
        title="Losses"
        icon="😔"
        description="Losses across all game modes"
        value={typeof losses === 'number' ? formatter.format(losses) : '-'}
      />

      <Stat
        title="Streak"
        icon="🔥"
        description="Number of consecutive wins"
        value={typeof streak === 'number' ? formatter.format(streak) : '-'}
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
