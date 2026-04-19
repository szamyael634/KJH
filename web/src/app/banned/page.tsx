import Link from 'next/link'

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
      <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      </div>
      <h1 className="text-4xl font-bold text-white mb-4">Account Suspended</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Your access to this platform has been temporarily or permanently restricted by an administrator. Please contact support if you believe this was in error.
      </p>
      <form action="/auth/signout" method="post">
        <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-sm">
          Log Out
        </button>
      </form>
    </div>
  )
}
