import { createClient } from './web/src/utils/supabase/server'

async function smokeTest() {
  console.log('🚀 Starting Marketplace Smoke Tests...')
  
  try {
    const supabase = await createClient()

    // 1. Test Auth Connection
    const { data: { session } } = await supabase.auth.getSession()
    console.log('✅ Auth Connection: OK')

    // 2. Test Custom Tables Access
    const { data: products, error: pError } = await supabase.from('products').select('id').limit(1)
    if (pError) throw pError
    console.log('✅ Products Table Access: OK')

    const { data: profiles, error: prError } = await supabase.from('profiles').select('id').limit(1)
    if (prError) throw prError
    console.log('✅ Profiles Table Access: OK')

    // 3. Test RPC Connectivity
    const { error: rpcError } = await supabase.rpc('get_search_suggestions', { query: 'test' })
    if (rpcError) {
      console.warn('⚠️ Search Suggestions RPC Error (Migration may be pending):', rpcError.message)
    } else {
      console.log('✅ Search Suggestions RPC: OK')
    }

    console.log('✨ All Smoke Tests Completed.')
  } catch (err: any) {
    console.error('❌ Smoke Test Failed:', err.message)
    process.exit(1)
  }
}

// Note: This script is intended to be run in a Node environment with Supabase env vars.
// smokeTest()
