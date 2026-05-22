import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Lock, Loader2, Zap } from "lucide-react";
import { api } from "../../api";

interface AdminLoginProps {
    onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("password123");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const doLogin = async (u: string, p: string) => {
        setIsLoading(true);
        setError("");
        localStorage.removeItem("token");
        try {
            await api.admin.login({ username: u, password: p });
            onLogin();
        } catch (err: any) {
            setError(err.message || "Invalid admin credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await doLogin(username, password);
    };

    const handleQuickLogin = async () => {
        await doLogin("admin", "password123");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Card className="w-96 bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
                    <p className="text-gray-400 text-sm">Restricted Access Only</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Username</label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                                placeholder="admin"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Authenticate
                        </Button>
                        <Button
                            type="button"
                            onClick={handleQuickLogin}
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Quick Login (Dev)
                        </Button>
                        <div className="text-center text-xs text-gray-500 mt-4">
                            Authorized personnel only. All activities are monitored.
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
