import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { GraduationCap, AlertCircle, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { api } from "../api";
import { Alert, AlertDescription } from "./ui/alert";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";

export function LoginPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await api.auth.login(formData);
      // Check role from response OR localStorage (fallback)
      const role = response.role || localStorage.getItem("userRole") || "student";
      if (role === "teacher") {
        // Teacher accounts are NOT allowed on the student login page
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        setError("🚫 You have a Teacher account. Please use the Teacher Login page to sign in.");
        return;
      }
      onNavigate('dashboard');
    } catch (err: any) {
      if (err.message?.includes("EMAIL_NOT_VERIFIED")) {
        setError("Please verify your email first. Check your inbox for the OTP code.");
      } else {
        setError(err.message || "Invalid credentials");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.bg, color: theme.text }}>
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
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium">Access 50,000+ verified scholarships</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium">Track your applications in one place</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium">Get personalized AI recommendations</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#10b981]/20 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute top-8 right-8">
            <ThemeToggle />
        </div>
        <Card className="w-full max-w-md border-none shadow-2xl" style={{ backgroundColor: theme.bgSecondary, color: theme.text }}>
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-10 h-10 text-[#1e3a8a]" />
                <span className="text-2xl font-bold text-[#1e3a8a]">ScholarIQ</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p style={{ color: theme.textSecondary }}>Sign in to your account to continue</p>
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
                <Label htmlFor="email" style={{ color: theme.text }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: theme.text }}>Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    style={{ color: theme.textSecondary }}
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm hover:underline"
                  style={{ color: isDark ? '#60a5fa' : '#1e3a8a' }}
                  onClick={() => onNavigate("forgot-password")}
                >
                  Forgot password?
                </button>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white"
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
                <span className="text-sm" style={{ color: theme.textSecondary }}>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="text-sm hover:underline font-medium"
                  style={{ color: isDark ? '#60a5fa' : '#1e3a8a' }}
                >
                  Create a new account
                </button>
              </div>
              <div className="text-center pt-2 border-t" style={{ borderColor: theme.border }}>
                <p className="text-xs mb-2" style={{ color: theme.textSecondary }}>Are you a teacher?</p>
                <button
                  type="button"
                  onClick={() => onNavigate('teacher-login')}
                  className="text-sm hover:underline font-semibold text-emerald-600"
                >
                  🎓 Go to Teacher Login →
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
