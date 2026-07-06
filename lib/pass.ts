import { supabase } from './supabaseClient'

function getSessionId() {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem('geohome_session_id')
  if (stored) return stored
  const id = crypto.randomUUID()
  window.localStorage.setItem('geohome_session_id', id)
  return id
}

export async function checkPassStatus(userId?: string): Promise<boolean> {
  try {
    const sessionId = getSessionId()
    const { data, error } = await supabase.rpc('has_active_pass', {
      user_id: userId || null,
      session_id: sessionId || null,
    })
    if (error) {
      console.error('has_active_pass RPC error', error)
      return false
    }
    return Boolean(data)
  } catch (err) {
    console.error('checkPassStatus exception', err)
    return false
  }
}

export default { checkPassStatus }
