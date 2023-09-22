import { supabase } from '@/lib/supabase'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { CompleteProfileModal } from '@/components/complete-profile-dialog'

export function EnsureProfile({ children }: { children: React.ReactNode }) {
  const auth = useSessionContext()

  const profile = useQuery(
    supabase
      .from('profiles')
      .select('username')
      .eq('id', auth.session?.user.id as string),
    { enabled: !!auth.session }
  )

  if (auth.isLoading) {
    return <div>Splash loading screen</div>
  }

  if (!auth.session) {
    return children
  }

  if (profile.isLoading) {
    return <div>Splash loading screen</div>
  }

  const myProfile = profile.data![0]

  return (
    <>
      {!myProfile.username ? (
        <CompleteProfileModal userId={auth.session.user.id} />
      ) : null}
      {children}
    </>
  )
}
