import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import { api } from "../api";
import { Alert, AlertDescription } from "./ui/alert";

export function LoginPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      await api.auth.login(formData);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a]/5 via-white to-[#10b981]/5 flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1e3a8a] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] to-[#1e3a8a]/80" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="w-12 h-12" />
            <span className="text-3xl font-bold">ScholarIQ</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Welcome Back to Your Scholarship Journey
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Continue discovering opportunities tailored just for you with AI-powered recommendations.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <span>Access 50,000+ verified scholarships</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <span>Track your applications in one place</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <span>Get personalized AI recommendations</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#10b981]/20 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-10 h-10 text-[#1e3a8a]" />
                <span className="text-2xl font-bold text-[#1e3a8a]">ScholarIQ</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-700 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-[#1e3a8a] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <div className="text-center pt-4">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="text-sm text-[#1e3a8a] hover:underline font-medium"
                >
                  Create a new account
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
