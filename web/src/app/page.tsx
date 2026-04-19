import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center dark:bg-slate-900">
      <div className="absolute top-0 right-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-transparent to-transparent dark:from-indigo-900/40"></div>
      
      <main className="text-center space-y-8 animate-in mt-[-10vh]">
        <h1 className="text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
          Next Gen Commerce
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          The ultimate platform for buyers, sellers, and riders. Built for speed, scaled for the future.
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Log In
          </Link>
          <Link href="/dashboard/buyer" className="bg-white hover:bg-slate-50 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 px-8 py-3 rounded-full font-semibold transition-all shadow-sm">
            Explore Demo
          </Link>
        </div>
      </main>
    </div>
  );
}
