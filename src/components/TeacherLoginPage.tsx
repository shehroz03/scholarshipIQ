import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GraduationCap, AlertCircle, Loader2, BookOpen, Users, Star, Eye, EyeOff } from "lucide-react";
import { api } from "../api";
import { Alert, AlertDescription } from "./ui/alert";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";

export function TeacherLoginPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
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
      const role = response.role || localStorage.getItem("userRole") || "student";

      if (role === "teacher") {
        onNavigate("teacher-dashboard");
      } else {
        // Student or non-teacher trying to use teacher login
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        setError("🚫 You are not allowed. This login is only for approved teachers. Please use the Student Login instead.");
      }
    } catch (err: any) {
      // Show backend error (pending approval, rejected, wrong credentials)
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)" }}>
        <div className="relative z-10 flex flex-col justify-center px-12" style={{ color: "#ffffff" }}>
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="w-12 h-12" style={{ color: "#ffffff" }} />
            <span className="text-3xl font-bold" style={{ color: "#ffffff" }}>ScholarIQ</span>
          </div>
          <div className="rounded-2xl px-4 py-2 inline-block mb-6 w-fit" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <span className="font-semibold text-sm uppercase tracking-wide" style={{ color: "#a7f3d0" }}>Teacher Portal</span>
          </div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#ffffff" }}>
            Welcome Back, Educator!
          </h1>
          <p className="text-xl mb-8" style={{ color: "#d1fae5" }}>
            Manage your courses, students, and live classes from your personalized teacher dashboard.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#059669" }}>
                <BookOpen className="w-5 h-5" style={{ color: "#ffffff" }} />
              </div>
              <span className="font-medium" style={{ color: "#ffffff" }}>Create & manage your courses</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#059669" }}>
                <Users className="w-5 h-5" style={{ color: "#ffffff" }} />
              </div>
              <span className="font-medium" style={{ color: "#ffffff" }}>Track enrolled students</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#059669" }}>
                <Star className="w-5 h-5" style={{ color: "#ffffff" }} />
              </div>
              <span className="font-medium" style={{ color: "#ffffff" }}>Schedule live classes & quizzes</span>
            </div>
          </div>
          <div className="mt-12 p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <p className="text-sm" style={{ color: "#a7f3d0" }}>
              🔒 <strong style={{ color: "#ffffff" }}>Restricted Access:</strong> Only admin-approved teachers can login here.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md border-none shadow-2xl" style={{ backgroundColor: theme.bgSecondary, color: theme.text }}>
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-3 lg:hidden">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-10 h-10 text-emerald-700" />
                <span className="text-2xl font-bold text-emerald-700">ScholarIQ</span>
              </div>
            </div>
            <div className="flex justify-center mb-2">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Teacher Portal
              </span>
            </div>
            <CardTitle className="text-2xl">Teacher Login</CardTitle>
            <p style={{ color: theme.textSecondary }} className="text-sm">
              Sign in with your approved teacher account
            </p>
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
                  placeholder="your@email.com"
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
                    className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-semibold"
                style={{ backgroundColor: "#065f46", color: "#ffffff", border: "none" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Login to Teacher Portal"
                )}
              </Button>

              <div className="text-center pt-2 space-y-2">
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  Not a teacher?{" "}
                  <button
                    type="button"
                    onClick={() => onNavigate("login")}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Student Login
                  </button>
                </p>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  Want to become a teacher?{" "}
                  <button
                    type="button"
                    onClick={() => onNavigate("signup")}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Apply here
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
