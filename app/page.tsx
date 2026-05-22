"use client"

import POSSystem from "@/components/pos-system"
import LoginScreen from "@/components/login-screen"
import { useAuth } from "@/contexts/AuthContext"

export default function Page() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4 text-yellow-400"></div>
          <p className="text-slate-400">Restoring session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <POSSystem />
}
