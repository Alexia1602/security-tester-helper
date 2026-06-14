import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Plus, Code, Trash2, CheckCircle2, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusDot from '@/components/shared/StatusDot';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';


const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'go', label: 'Go' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
];

const codeSources = [
  { value: 'human', label: 'Standard Human Implementation' },
  { value: 'ai_copilot', label: 'GitHub Copilot Fragment' },
  { value: 'ai_chatgpt', label: 'ChatGPT Synthetic Snippet' },
  { value: 'ai_other', label: 'Alternative GenAI Assistant Model' },
  { value: 'mixed', label: 'Hybrid Source Layout (Human + AI)' },
];

export default function Sessions() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', target_description: '', language: 'javascript', code_source: 'human' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  

  // 1. Fetch active session containers
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 2. Fetch global tracking logs
  const { data: allVulns = [] } = useQuery({
    queryKey: ['vulnerabilities'],
    queryFn: async () => {
      const response = await api.get('/vulnerabilities');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 3. Create Session Mutation Handler
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/sessions', data);
      return response.data;
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpen(false);
      setForm({ name: '', target_description: '', language: 'javascript', code_source: 'human' });
      toast({ 
        title: "Forensic Workspace Isolated", 
        description: `Session nodes initialized successfully for workspace: "${newSession?.name || ''}".`,
        duration: 3000
      });
      if (newSession?.id) {
        setActiveSession(newSession.id);
        navigate('/analysis');
      }
    },
  });

  // 4. Freeze/Complete Session Mutation Handler
  const finishMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/sessions/${id}/finish`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({ 
        title: "Audit Context Frozen", 
        description: "Lifecycle tracking set to completed. Collected findings context frozen under cryptographic compliance parameters.",
        duration: 3000
      });
    },
  });

  // 5. Destructive Drop Workspace Mutation Handler
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/sessions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      toast({ 
        title: "Workspace Context Dropped", 
        description: "Session references purged completely from active memory tracking schemas.",
        duration: 3000
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="Audit Sessions & Workspaces"
        subtitle="Isolate running analysis target parameters and capture sequential exploit metrics safely"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/10 h-9 px-4 text-xs font-mono">
                <Plus className="w-4 h-4 mr-1.5" /> Provision New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold tracking-wide text-white">Initialize Secure Analysis Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 font-mono">Workspace Label Name</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Core API Security Pipeline Audit v3"
                    className="bg-slate-950 border-slate-800 text-slate-200 text-xs font-mono rounded-xl focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 font-mono">Target Infrastructure Scope Description</Label>
                  <Textarea
                    value={form.target_description}
                    onChange={e => setForm({ ...form, target_description: e.target.value })}
                    placeholder="Define structural application endpoints, repository boundaries, or origin layout context details..."
                    className="bg-slate-950 border-slate-800 text-slate-200 text-xs font-mono rounded-xl h-20 resize-none focus-visible:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400 font-mono">Base Code Language</Label>
                    <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 text-xs font-mono rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {languages.map(l => <SelectItem key={l.value} value={l.value} className="text-xs font-mono">{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400 font-mono">Development Provenance</Label>
                    <Select value={form.code_source} onValueChange={v => setForm({ ...form, code_source: v })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 text-xs font-mono rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {codeSources.map(s => <SelectItem key={s.value} value={s.value} className="text-xs font-mono">{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs h-10 mt-2 shadow-md font-mono"
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.name || createMutation.isPending}
                >
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing Disk Registers...</> : 'Mount Active Workspace'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* CORE DISPLAY LOGIC CONTENT VIEWS */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse"><CardContent className="p-6 h-36" /></Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 border-dashed rounded-2xl py-20 text-center text-slate-400 max-w-3xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center">
            <Shield className="w-12 h-12 text-slate-800 mb-4 animate-pulse" />
            <h3 className="font-semibold text-base text-slate-200 mb-1">Audit Tracking Index Registers Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-mono">
              Initialize a dedicated testing context container from the command controls above to separate forensic telemetry data streams.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sessions.map((session, i) => {
              if (!session) return null;
              const isSessionActive = session.status === 'active';

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card 
                    className={`bg-slate-900 border-slate-800 hover:border-slate-700 transition-all rounded-2xl shadow-xl overflow-hidden group cursor-pointer ${!isSessionActive ? 'opacity-50 hover:opacity-100 shadow-none' : ''}`} 
                    onClick={() => navigate('/analysis', { state: { sessionId: session.id } })}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <div className="flex items-center gap-2">
                          <StatusDot status={session.status || 'active'} pulse={isSessionActive} />
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">{session.status || 'active'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {isSessionActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                              title="Freeze and finalize active session logging"
                              onClick={e => { e.stopPropagation(); finishMutation.mutate(session.id); }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                            title="Purge session files from disk registries"
                            onClick={e => { e.stopPropagation(); deleteMutation.mutate(session.id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-sm text-white truncate tracking-wide font-mono">{session.name || 'Unnamed Session Node'}</h3>
                        <p className="text-xs text-slate-400 font-mono line-clamp-2 mt-1 min-h-[32px] leading-relaxed">{session.target_description || 'No context telemetry descriptors provided.'}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-950">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <Code className="w-3.5 h-3.5 text-blue-400" />
                          <span className="capitalize bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">{session.language || 'Unknown'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 font-mono text-xs">
                          {(() => {
                            const count = allVulns.filter(v => v && v.session_id === session.id).length;
                            return count > 0 ? (
                              <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-400" /> {count} Traced
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-950 text-slate-600 border border-slate-850 text-[10px] px-2 py-0.5 rounded">0 flaws</Badge>
                            );
                          })()}
                          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}