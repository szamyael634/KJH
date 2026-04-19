'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  ShieldX, 
  User, 
  MapPin, 
  Eye, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getPendingVerifications, updateVerificationStatus } from '@/app/actions/admin'
import { cn } from '@/utils/cn'

export default function VerificationQueue() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    setIsLoading(true)
    const { data } = await getPendingVerifications()
    setProfiles(data || [])
    setIsLoading(false)
  }

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    await updateVerificationStatus(id, status)
    loadProfiles()
    setSelectedProfile(null)
  }

  if (isLoading) return <div className="p-8">Loading verification queue...</div>

  return (
    <div className="p-8 flex h-full gap-8">
      {/* List Area */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-4">
        <header className="mb-8">
           <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Verification Queue</h1>
           <p className="text-sm font-medium text-slate-500">Review and approve seller/rider credentials.</p>
        </header>

        {profiles.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center gap-4 border-dashed border-2">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <ShieldCheck className="w-8 h-8" />
             </div>
             <p className="text-sm font-bold text-slate-900 dark:text-white">All caught up!</p>
             <p className="text-xs text-slate-500">No pending verification requests at the moment.</p>
          </Card>
        ) : (
          profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfile(profile)}
              className={cn(
                "w-full text-left p-6 rounded-[2rem] border transition-all flex items-center justify-between group",
                selectedProfile?.id === profile.id 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none" 
                  : "bg-white border-slate-100 hover:border-indigo-200 dark:bg-slate-900 dark:border-slate-800"
              )}
            >
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                     {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                     ) : (
                        <User className="w-6 h-6 text-slate-400" />
                     )}
                  </div>
                  <div>
                     <h3 className="font-black tracking-tight">{profile.full_name || profile.username || 'Anonymous'}</h3>
                     <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                          selectedProfile?.id === profile.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        )}>
                          {profile.role}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold opacity-60">
                           <Clock className="w-3 h-3" />
                           {new Date(profile.created_at).toLocaleDateString()}
                        </div>
                     </div>
                  </div>
               </div>
               <div className={cn(
                 "p-3 rounded-xl transition-all",
                 selectedProfile?.id === profile.id ? "bg-white/20" : "bg-slate-50 dark:bg-slate-800"
               )}>
                  <Eye className="w-5 h-5" />
               </div>
            </button>
          ))
        )}
      </div>

      {/* Details Area */}
      <div className="w-[450px]">
        {selectedProfile ? (
          <Card className="h-full p-8 flex flex-col items-center gap-8 shadow-2xl border-none animate-in slide-in-from-right-8 duration-300">
             <div className="text-center space-y-2">
                <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 mx-auto overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                   <img src={selectedProfile.avatar_url || "/api/placeholder/400/400"} alt="" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{selectedProfile.full_name}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">@{selectedProfile.username}</p>
             </div>

             <div className="w-full space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address Information</label>
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex gap-3 text-sm font-medium">
                      <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                         {selectedProfile.address_json?.street}, {selectedProfile.address_json?.barangay}, {selectedProfile.address_json?.municipality}, {selectedProfile.address_json?.province}
                      </p>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Documents</label>
                   <div className="grid gap-3">
                      {selectedProfile.verification_documents?.map((doc: any, i: number) => (
                        <a 
                          key={i}
                          href={doc.document_url} 
                          target="_blank"
                          className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-600 transition-all group"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                 <ShieldCheck className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{doc.type}</span>
                           </div>
                           <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        </a>
                      ))}
                   </div>
                </div>
             </div>

             <div className="mt-auto w-full grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="rounded-2xl py-6 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                  onClick={() => handleAction(selectedProfile.id, 'rejected')}
                >
                   <XCircle className="w-5 h-5 mr-2" /> Reject
                </Button>
                <Button 
                  className="rounded-2xl py-6 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleAction(selectedProfile.id, 'approved')}
                >
                   <CheckCircle className="w-5 h-5 mr-2" /> Approve
                </Button>
             </div>
          </Card>
        ) : (
          <div className="h-full border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] flex items-center justify-center p-12 text-center text-slate-400">
             <p className="text-sm font-bold opacity-30">Select a request to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}

