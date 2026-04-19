import { createClient } from '@/utils/supabase/server'
import { deleteProduct, toggleUserBan } from './actions'

export const revalidate = 0

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Verify Admin Role before rendering
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  
  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-red-500 font-bold max-w-md text-center">
          Access Denied. You do not hold administrative privileges.
        </div>
      </div>
    )
  }

  // Fetch all users and products
  const { data: profiles } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false })
  const { data: products } = await supabase.from('products').select('*, profiles(full_name)').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Console</h1>
          <p className="text-slate-500 mt-1">Global management and moderation.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Users</p>
            <p className="text-xl font-bold dark:text-white">{profiles?.length || 0}</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Products</p>
            <p className="text-xl font-bold dark:text-white">{products?.length || 0}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Users Table */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Moderation</h2>
          </div>
          <div className="overflow-y-auto max-h-[600px] p-4 flex flex-col gap-2">
            {profiles?.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {profile.full_name || 'Unnamed User'}
                    {profile.role === 'admin' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Admin</span>}
                  </h4>
                  <p className="text-sm text-slate-500">{profile.id}</p>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mt-1">Role: {profile.role}</p>
                </div>
                
                {profile.role !== 'admin' && (
                  <form action={async () => {
                    'use server';
                    await toggleUserBan(profile.id, profile.is_banned);
                  }}>
                    <button className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${
                        profile.is_banned ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                      }`}
                    >
                      {profile.is_banned ? 'Unban User' : 'Ban User'}
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Products Table */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Inventory</h2>
          </div>
          <div className="overflow-y-auto max-h-[600px] p-4 flex flex-col gap-2">
            {products?.length === 0 && <p className="p-4 text-center text-slate-500">No active products.</p>}
            {products?.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0">
                    {product.image_url && <img src={product.image_url} alt="img" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{product.title}</h4>
                    <p className="text-sm text-slate-500">Seller: {product.profiles?.full_name || product.seller_id.substring(0,8)}</p>
                    <p className="text-xs font-bold text-indigo-600 py-1">${product.price}</p>
                  </div>
                </div>
                
                <form action={async () => {
                  'use server';
                  await deleteProduct(product.id);
                }}>
                  <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
