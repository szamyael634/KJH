export default function RiderDashboard() {
  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 p-8">
      <header className="mb-10 text-slate-900 dark:text-white">
        <h1 className="text-3xl font-bold">Rider Deliveries</h1>
        <p className="text-slate-500">Manage your active routes and earnings.</p>
      </header>

      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-4">Current Route</h2>
        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl font-medium">
          Waiting for next assignment...
        </div>
      </section>
    </div>
  )
}
