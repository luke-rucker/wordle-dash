import { LoadingDots } from '@/components/loading-dots'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'

export function Streak() {
  const session = useSession()

  const myStats = useQuery(
    supabase
      .from('rankings')
      .select('streak,rank')
      .eq('id', session?.user.id as string)
      .limit(1)
      .single(),
    { enabled: !!session }
  )

  if (!session) return null

  return (
    <p className="text-center sm:text-left pb-2">
      {myStats.isLoading ? (
        <>
          Loading
          <LoadingDots />
        </>
      ) : null}

      {myStats.error ? <>Error loading your streak.</> : null}

      {myStats.data ? <>Current Streak: 🔥 {myStats.data.streak}</> : null}
    </p>
  )
}
