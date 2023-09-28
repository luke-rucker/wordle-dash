import { supabase } from '@/lib/supabase'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { CompleteProfileModal } from '@/components/complete-profile-dialog'
import { Splash } from '@/components/splash'

export function EnsureProfile({ children }: { children: React.ReactNode }) {
  const auth = useSessionContext()

  const profile = useQuery(
    supabase
      .from('profiles')
      .select('username,country')
      .eq('id', auth.session?.user.id as string)
      .limit(1)
      .single(),
    { enabled: !!auth.session }
  )

  if (auth.isLoading) {
    return <Splash type="loading" />
  }

  if (!auth.session) {
    return children
  }

  if (profile.isLoading) {
    return <Splash type="loading" />
  }

  return (
    <>
      {!profile.data?.username ? (
        <CompleteProfileModal userId={auth.session.user.id} />
      ) : null}
      {children}
    </>
  )
}
