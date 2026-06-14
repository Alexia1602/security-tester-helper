import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // 💡 Fixed: Removed broken loadingSession reference
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data?.token) {
        login(response.data.token, response.data.user);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials signature or secure server node unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Operator Authentication Gateway"
      subtitle="Provide clearance parameters to mount the centralized control panels"
      footer={
        <p className="text-slate-400 text-xs">
          Missing local credential allocation keys?{" "}
          <Link to="/register" className="text-blue-500 font-medium hover:underline">
            Register local account identity
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-white">
        <div className="space-y-2">
          <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Access Channel Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="email"
              placeholder="you@security.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 focus-visible:ring-blue-500 text-xs font-mono rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Passkey Token</Label>
            <Link to="/register" className="text-[11px] text-blue-400 hover:underline font-mono">
              Forgot key?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 focus-visible:ring-blue-500 text-xs font-mono rounded-xl"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded-xl shadow-md transition-all font-mono text-xs tracking-wide" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resolving Identity Cryptography...</>
          ) : (
            "Authorize Local Connection"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}