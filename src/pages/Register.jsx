import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useToast } from "@/components/ui/use-toast";

export default function Register() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("The password configurations specified do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { email, password });
      
      toast({
        title: "Account Credentials Persisted",
        description: "Local analyst security identity pre-approved by operational policy parameters.",
        duration: 3000
      });
      
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration transaction aborted. Check cluster state server registry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Register Analyst Identity"
      subtitle="Instantiate a localized cryptographic role profile to authorize diagnostic runs"
      footer={
        <p className="text-slate-400 text-xs">
          Already own a verified access key?{" "}
          <Link to="/login" className="text-blue-500 font-medium hover:underline">
            Return to Authenticator
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
          <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Target Registration Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="email"
              placeholder="operator@security.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 focus-visible:ring-blue-500 text-xs font-mono rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Passkey Assignment</Label>
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

        <div className="space-y-2">
          <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Re-verify Passkey</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 focus-visible:ring-blue-500 text-xs font-mono rounded-xl"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-all font-mono text-xs tracking-wide" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Provisioning Node Access Registers...</>
          ) : (
            "Generate Local Role Token"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}