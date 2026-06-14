import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Recover Clearance Passkey"
      subtitle="The local node architecture will compile a dynamic sandbox unlock hash"
      footer={
        <Link to="/login" className="text-blue-500 font-medium hover:underline inline-flex items-center gap-1 font-mono text-xs">
          <ArrowLeft className="w-3 h-3" /> Abort and return to authorization index
        </Link>
      }
    >
      {sent ? (
        <div className="text-center space-y-3 font-mono text-xs leading-relaxed">
          <p className="text-slate-200">
            If the identity reference <span className="text-blue-400 font-bold">{email}</span> maps onto a valid disk register, an emergency recovery configuration pointer has been compiled.
          </p>
          <p className="text-[10px] text-slate-500 italic border-t border-slate-850 pt-2.5">
            Dissertation Notice: Inside local development runtimes, passwords can be verified manually within backend data structures under the file path: backend/data/users.json.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
          <div className="space-y-2">
            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Identity Account Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="email"
                placeholder="you@security.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 text-xs font-mono rounded-xl"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 font-medium font-mono text-xs rounded-xl shadow-md transition-all" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning Identity Registers...</>
            ) : (
              "Compile Verification Link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}