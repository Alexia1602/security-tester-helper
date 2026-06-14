import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("The passkey parameters provided do not match.");
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Passkey Overwritten Successfully",
        description: "The underlying profile credential registry data has been updated.",
        duration: 3000
      });
      navigate("/login");
    }, 1200);
  };

  return (
    <AuthLayout
      icon={Lock}
      title="OverwriteFile Profile Passkey"
      subtitle="Establish a resilient access string to overwrite current validation boundaries"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-white">
        <div className="space-y-2">
          <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">New Access Passkey</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 text-xs font-mono rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Confirm Passkey Parameters</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 text-xs font-mono rounded-xl"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 font-medium font-mono text-xs rounded-xl shadow-md transition-all" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving System Changes...</>
          ) : (
            "Enforce Passkey Rotation"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}