import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase-client'

const AuthContext = createContext()

const fetchProfile = async (currentUser) => {
  //console.log('Fetching profile for user:', currentUser.id)
  
  let { data: profileData, error } = await supabase
    .from('profiles')
    .select('username, email, avatar_url')
    .eq('id', currentUser.id)
    .maybeSingle()

  //console.log('Profile query result:', { profileData, error })

  if (error) throw error

  if (!profileData) {
    //console.log('No profile found, creating new one')
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.user_metadata?.display_name || 'New User',
        avatar_url: null,
      })
      .select()
      .maybeSingle()

    if (insertError) throw insertError
    profileData = newProfile
    //console.log('Created new profile:', newProfile)
  }

  return profileData
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let authSubscription = null

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      
      if (mounted) {
        setUser(currentUser)
        
        if (currentUser) {
          try {
            const profileData = await fetchProfile(currentUser)
            setProfile(profileData)
          } catch (err) {
            console.error('Initial profile error:', err)
            // Fallback profile
            setProfile({ 
              username: 'Guest', 
              email: currentUser.email,
              avatar_url: null 
            })
          }
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    }

    initializeAuth()

    // Sequential sync listener - profile ALWAYS follows user
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      //console.log('Auth event:', event, session?.user?.id || 'no user')
      
      const currentUser = session?.user ?? null
      if (!mounted) return
      
      setUser(currentUser)

      if (!currentUser) {
        //console.log('User signed out')
        setProfile(null)
        return
      }

      //console.log('User signed in - syncing profile')

      // Optimistic loading state FIRST, then await profile
      setProfile({ username: 'Loading...', email: currentUser.email, avatar_url: null })

      // Non-blocking async chain
      fetchProfile(currentUser)
        .then(profileData => {
          if (mounted) {
            setProfile(profileData)
            //console.log('Profile synced:', profileData.username)
          }
        })
        .catch(err => {
          console.error('Live profile error:', err)
          if (mounted) {
            setProfile({ 
              username: 'Guest', 
              email: currentUser.email,
              avatar_url: null 
            })
          }
        })
    })

    authSubscription = subscription
    //console.log('Auth subscription active')

    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
