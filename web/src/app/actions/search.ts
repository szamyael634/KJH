'use server'

import { createClient } from '@/utils/supabase/server'

export async function getSearchSuggestions(query: string) {
  if (!query || query.length < 2) return { data: [], error: null }
  
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_search_suggestions', { query })
  
  return { data, error }
}
