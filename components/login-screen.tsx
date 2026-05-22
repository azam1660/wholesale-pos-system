"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, KeyRound, User, Globe, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginScreen() {
  const { login } = useAuth();
  const { t, setLanguage, language } = useLanguage();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.error || t("invalidCredentials"));
      }
    } catch (err) {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-yellow-950 p-4 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <Card className="w-full max-w-[420px] bg-slate-900/60 border-slate-700/50 backdrop-blur-xl rounded-[16px] shadow-2xl overflow-hidden text-white border">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                {t("appTitle")}
              </span>
            </div>
            
            {/* Language Switcher Button */}
            <Button
              onClick={() => setLanguage(language === "en" ? "mr" : "en")}
              variant="ghost"
              className="hover:bg-white/10 text-white/80 hover:text-white rounded-[9px] text-xs font-semibold px-2.5 h-8 flex items-center gap-1.5 border border-white/10"
            >
              <Globe className="w-3.5 h-3.5" />
              {language === "en" ? "मराठी" : "English"}
            </Button>
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white/95">
              {t("systemLogin")}
            </CardTitle>
            <CardDescription className="text-sm text-slate-400 leading-relaxed">
              {t("welcomeBack")}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-500/50 text-red-200 rounded-[12px]">
              <AlertCircle className="h-4 w-4 stroke-red-400" />
              <AlertTitle className="font-semibold">{language === "en" ? "Error" : "त्रुटी"}</AlertTitle>
              <AlertDescription className="text-xs text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                {t("username")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <Input
                  type="text"
                  placeholder={language === "en" ? "Enter username" : "वापरकर्तानाव प्रविष्ट करा"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-4 bg-slate-950/40 border-slate-700/60 text-white placeholder-slate-500 focus:border-yellow-500/80 focus:ring-yellow-500/30 rounded-[12px] h-[46px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                {t("password")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <Input
                  type="password"
                  placeholder={language === "en" ? "Enter password" : "पासवर्ड प्रविष्ट करा"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-4 bg-slate-950/40 border-slate-700/60 text-white placeholder-slate-500 focus:border-yellow-500/80 focus:ring-yellow-500/30 rounded-[12px] h-[46px]"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-bold rounded-[12px] h-[48px] shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 transition-all duration-200 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("signingIn")}
                </>
              ) : (
                <>
                  {t("login")}
                </>
              )}
            </Button>
          </form>

          {/* Quick-Seeded Accounts Tips for Reviewers */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1 bg-slate-950/20 -mx-6 -mb-6 p-4">
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
              {language === "en" ? "Demo Accounts:" : "डेमो खाती:"}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800/40">
                <span className="font-medium text-slate-400">POS Only:</span>
                <p className="text-slate-500">pos / pos</p>
              </div>
              <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800/40">
                <span className="font-medium text-slate-400">Admin & POS:</span>
                <p className="text-slate-500">admin / admin</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
