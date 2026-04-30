'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Lock, 
  MapPin, 
  ShieldCheck, 
  Camera, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff,
  UploadCloud
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { createClient } from '@/utils/supabase/client'

type Step = 1 | 2 | 3 | 4

export default function MultiStepSignup() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dob: '',
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    street: '',
    houseNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'buyer' as 'buyer' | 'seller' | 'rider',
    otp: '',
    username: '',
    displayName: '',
    avatarUrl: '',
    idUrl: ''
  })

  // Address State
  const [regions, setRegions] = useState<any[]>([])
  const [provinces, setProvinces] = useState<any[]>([])
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [barangays, setBarangays] = useState<any[]>([])

  // 1. Fetch Regions on mount
  useEffect(() => {
    fetch('https://psgc.cloud/api/regions')
      .then(res => res.json())
      .then(data => setRegions(data))
  }, [])

  // 2. Fetch Provinces when region changes
  useEffect(() => {
    if (formData.region) {
      fetch(`https://psgc.cloud/api/regions/${formData.region}/provinces`)
        .then(res => res.json())
        .then(data => setProvinces(data))
    }
  }, [formData.region])

  // 3. Fetch Municipalities when province changes
  useEffect(() => {
    if (formData.province) {
      fetch(`https://psgc.cloud/api/provinces/${formData.province}/cities-municipalities`)
        .then(res => res.json())
        .then(data => setMunicipalities(data))
    }
  }, [formData.province])

  // 4. Fetch Barangays when municipality changes
  useEffect(() => {
    if (formData.municipality) {
      fetch(`https://psgc.cloud/api/cities-municipalities/${formData.municipality}/barangays`)
        .then(res => res.json())
        .then(data => setBarangays(data))
    }
  }, [formData.municipality])

  const passwordStrength = () => {
    if (!formData.password) return 0
    let score = 0
    if (formData.password.length >= 8) score++
    if (/[A-Z]/.test(formData.password)) score++
    if (/[0-9]/.test(formData.password)) score++
    if (/[^A-Za-z0-9]/.test(formData.password)) score++
    return score
  }

  const handleNext = () => setStep((s) => (s + 1) as Step)
  const handleBack = () => setStep((s) => (s - 1) as Step)

  const buildAddress = () => {
    const region = regions.find((item) => item.code === formData.region)
    const province = provinces.find((item) => item.code === formData.province)
    const municipality = municipalities.find((item) => item.code === formData.municipality)
    const barangay = barangays.find((item) => item.code === formData.barangay)

    return {
      region: formData.region,
      regionName: region?.name || '',
      province: formData.province,
      provinceName: province?.name || '',
      municipality: formData.municipality,
      municipalityName: municipality?.name || '',
      barangay: formData.barangay,
      barangayName: barangay?.name || '',
      street: formData.street,
      houseNumber: formData.houseNumber,
    }
  }

  const handleComplete = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.')
      return
    }

    setIsLoading(true)
    const address = buildAddress()
    const fullName = [formData.firstName, formData.middleName, formData.lastName, formData.suffix]
      .filter(Boolean)
      .join(' ')

    const metadata = {
      role: formData.accountType,
      first_name: formData.firstName,
      middle_name: formData.middleName,
      last_name: formData.lastName,
      suffix: formData.suffix,
      dob: formData.dob,
      full_name: fullName,
      username: formData.username,
      display_name: formData.displayName || fullName,
      avatar_url: formData.avatarUrl,
      address_json: address,
      store_name: formData.accountType === 'seller' ? (formData.displayName || fullName) : null,
      store_description: '',
      store_logo_url: formData.avatarUrl,
      store_address_json: address,
    }

    const { data: current } = await supabase.auth.getUser()
    let user = current.user
    let authError = null

    if (!user) {
      const result = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: metadata },
      })
      user = result.data.user
      authError = result.error
    } else {
      const result = await supabase.auth.updateUser({
        password: formData.password || undefined,
        data: metadata,
      })
      user = result.data.user
      authError = result.error
    }

    if (authError || !user) {
      setIsLoading(false)
      alert(authError?.message || 'Unable to create account.')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        role: formData.accountType,
        full_name: fullName,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        suffix: formData.suffix,
        dob: formData.dob || null,
        username: formData.username,
        display_name: formData.displayName || fullName,
        avatar_url: formData.avatarUrl || null,
        address_json: address,
        store_name: formData.accountType === 'seller' ? (formData.displayName || fullName) : null,
        store_logo_url: formData.accountType === 'seller' ? (formData.avatarUrl || null) : null,
        store_address_json: formData.accountType === 'seller' ? address : null,
        verification_status: formData.accountType === 'buyer' ? 'approved' : 'pending',
      }, { onConflict: 'id' })

    setIsLoading(false)

    if (profileError) {
      alert(profileError.message)
      return
    }

    router.push(formData.accountType === 'buyer' ? '/' : `/dashboard/${formData.accountType}`)
    router.refresh()
  }

  const sendOTP = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        shouldCreateUser: true
      }
    })
    setIsLoading(false)
    if (error) alert(error.message)
    else alert('Verification code sent to your email!')
  }

  const verifyOTP = async () => {
     setIsLoading(true)
     const { error } = await supabase.auth.verifyOtp({
       email: formData.email,
       token: formData.otp,
       type: 'signup'
     })
     setIsLoading(false)
     if (error) {
       // Fallback for signInWithOtp flow
       const { error: error2 } = await supabase.auth.verifyOtp({
         email: formData.email,
         token: formData.otp,
         type: 'email'
       })
       if (error2) alert(error2.message)
       else handleNext()
     } else {
       handleNext()
     }
  }

  const renderStepIndicator = () => (
    <div className="flex justify-between mb-12 relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-10 -translate-y-1/2"></div>
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all",
            step >= i ? "bg-indigo-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700"
          )}
        >
          {i}
        </div>
      ))}
    </div>
  )

  return (
    <div className="w-full">
      {renderStepIndicator()}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                 <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="John" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                 <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" />
              </div>
           </div>
           
           <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Middle Name</label>
                 <Input value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suffix</label>
                 <Input value={formData.suffix} onChange={e => setFormData({...formData, suffix: e.target.value})} placeholder="Jr." />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birth Date</label>
              <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
           </div>

           <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-tighter">Address Information</h3>
              <div className="grid grid-cols-2 gap-4">
                 <select 
                   className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={formData.region}
                   onChange={e => setFormData({...formData, region: e.target.value, province: '', municipality: '', barangay: ''})}
                 >
                   <option value="">Region</option>
                   {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                 </select>
                 <select 
                   className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={formData.province}
                   disabled={!formData.region}
                   onChange={e => setFormData({...formData, province: e.target.value, municipality: '', barangay: ''})}
                 >
                   <option value="">Province</option>
                   {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <select 
                   className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={formData.municipality}
                   disabled={!formData.province}
                   onChange={e => setFormData({...formData, municipality: e.target.value, barangay: ''})}
                 >
                   <option value="">City / Municipality</option>
                   {municipalities.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                 </select>
                 <select 
                   className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={formData.barangay}
                   disabled={!formData.municipality}
                   onChange={e => setFormData({...formData, barangay: e.target.value})}
                 >
                   <option value="">Barangay</option>
                   {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <Input placeholder="Street" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                 <Input placeholder="House No / Lot" value={formData.houseNumber} onChange={e => setFormData({...formData, houseNumber: e.target.value})} />
              </div>
           </div>

           <Button className="w-full mt-8" onClick={handleNext}>
              Continue to Account Setup <ChevronRight className="ml-2 w-4 h-4" />
           </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="flex gap-2">
                 <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="you@example.com" />
                 <Button variant="outline" onClick={sendOTP} disabled={isLoading || !formData.email}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                 </Button>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Code</label>
              <Input maxLength={6} className="text-center text-2xl tracking-[1em] font-black" value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} />
           </div>

           <div className="grid grid-cols-3 gap-6 pt-4">
              {['buyer', 'seller', 'rider'].map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({...formData, accountType: type as any})}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all",
                    formData.accountType === type ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 ring-2 ring-indigo-600 ring-inset" : "bg-white dark:bg-slate-900 grayscale opacity-60"
                  )}
                >
                  <span className="text-xl mb-1">{type === 'buyer' ? '👜' : type === 'seller' ? '🏪' : '🛵'}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{type}</span>
                </button>
              ))}
           </div>

           <div className="space-y-4 pt-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                 <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                       {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                 </div>
                 {/* Strength Meter */}
                 <div className="flex gap-1 h-1 mt-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={cn("flex-1 rounded-full", passwordStrength() >= i ? "bg-indigo-600" : "bg-slate-100 dark:bg-slate-800")} />
                    ))}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Password</label>
                 <Input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
              </div>
           </div>

           <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={handleBack}><ChevronLeft className="mr-2 w-4 h-4" /> Back</Button>
              <Button className="flex-1" onClick={verifyOTP} disabled={!formData.otp || isLoading}>Verify & Continue</Button>
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="text-center space-y-2 mb-8">
              <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Identity Verification</h3>
              <p className="text-sm text-slate-500">Please upload a clear copy of your government ID or business permit to unlock {formData.accountType} features.</p>
           </div>

           <label className="block">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-600 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/50">
                 <UploadCloud className="w-10 h-10 text-slate-400" />
                 <div className="text-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Choose a file to upload</p>
                    <p className="text-xs text-slate-400">PDF, PNG, JPG (Max 5MB)</p>
                 </div>
                 <input type="file" className="hidden" />
              </div>
           </label>

           <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex gap-3">
              <div className="text-xl">ℹ️</div>
              <p className="text-[10px] font-medium text-slate-600 dark:text-indigo-300 leading-relaxed uppercase tracking-tight italic">
                 Your data is encrypted and only visible to authorized administrators for verification purposes.
              </p>
           </div>

           <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={handleBack}><ChevronLeft className="mr-2 w-4 h-4" /> Back</Button>
              <Button className="flex-1" onClick={handleNext}>Continue to Profile</Button>
           </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                 <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-100 dark:border-slate-800">
                    <User className="w-12 h-12 text-slate-300" />
                 </div>
                 <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
                    <Camera className="w-4 h-4" />
                 </button>
              </div>
              <div className="text-center">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white">Almost there!</h3>
                 <p className="text-sm text-slate-500">Set your public profile handles.</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                    <Input className="pl-8" placeholder="awesome_user" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})} />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                 <Input placeholder="Johnathan Doe" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
              </div>
           </div>

           <Button
             className="w-full py-6 text-lg shadow-2xl shadow-indigo-200 dark:shadow-none bg-indigo-600 hover:bg-indigo-700"
             onClick={handleComplete}
             disabled={isLoading}
           >
              Complete Account Creation <CheckCircle2 className="ml-2 w-5 h-5" />
           </Button>
           
           <button className="w-full text-center text-xs text-slate-400 font-bold hover:underline" onClick={handleBack}>
              I need to change something
           </button>
        </div>
      )}
    </div>
  )
}
