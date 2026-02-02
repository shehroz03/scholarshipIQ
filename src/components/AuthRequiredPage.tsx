import { Button } from "./ui/button";
import { GraduationCap, LogIn, UserPlus, Lock } from "lucide-react";

export function AuthRequiredPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("landing")}>
            <div className="p-2 bg-[#1e3a8a] rounded-xl text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-[#1e3a8a]">ScholarIQ</span>
          </div>
          <Button variant="ghost" onClick={() => onNavigate("landing")} className="text-gray-600 font-medium">
            Back to Home
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600 mb-8">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            Sign up or Login required
          </h1>
          <p className="text-gray-600 font-medium mb-10 leading-relaxed">
            To access your dashboard, saved scholarships, and personalized recommendations, please sign in or create an account.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => onNavigate("login")}
              className="bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-xl px-8 py-6 font-bold text-base shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate("signup")}
              className="border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white rounded-xl px-8 py-6 font-bold text-base flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </Button>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            New here? Create a free account to get personalized scholarship matches based on your profile.
          </p>
        </div>
      </main>
    </div>
  );
}
