import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Scan, Loader2, Bot, ShieldAlert, Save } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import CodeEditor from '@/components/analysis/CodeEditor';
import FindingsPanel from '@/components/analysis/FindingsPanel';
import { api } from '@/api/Client';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

const aiSources = [
  { value: 'ai_copilot', label: 'GitHub Copilot', icon: '🤖' },
  { value: 'ai_chatgpt', label: 'ChatGPT / GPT-4', icon: '💬' },
  { value: 'ai_other', label: 'Alternative Assistant Model', icon: '🧠' },
];

export default function AIAudit() {
  const [code, setCode] = useState('');
  const [source, setSource] = useState('ai_copilot');
  const [language, setLanguage] = useState('javascript');
  const [context, setContext] = useState('');
  const [findings, setFindings] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedSession, setSelectedSession] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions');
      return response.data;
    },
  });

  const runAudit = async () => {
    if (!code.trim()) return;
    setIsAuditing(true);
    setFindings([]);
    setAuditSummary(null);

    try {
      const response = await api.post('/analyze/audit-ai', {
        code,
        language,
        source,
        context
      });

      const result = response.data;
      setFindings((result.findings || []).map(f => ({ ...f, detected_by: 'ai_auditor', ai_source_concern: true })));
      setAuditSummary(result.audit_summary);
      toast({
        title: "Generative Compilation Finished",
        description: "AI-generated source structures audited against latent training data flaws.",
        duration: 3000
      });
    } catch (err) {
      toast({ 
        title: 'Audit Process Interrupted', 
        description: 'Failed to establish connection payload validation structures with the backend compiler.', 
        variant: 'destructive',
        duration: 4000
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const saveAllToSession = async () => {
    if (!selectedSession || findings.length === 0) return;
    setIsSaving(true);
    try {
      for (const f of findings) {
        await api.post('/vulnerabilities', { ...f, session_id: selectedSession, detected_by: 'ai_auditor', ai_source_concern: true });
      }
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      toast({ 
        title: 'Registry Updated', 
        description: `Successfully exported all ${findings.length} findings into current workspace environment container.`,
        duration: 3000
      });
    } catch (err) {
      toast({ title: 'Export transaction failed', variant: 'destructive', duration: 4000 });
    } finally {
      setIsSaving(false);
    }
  };

  const saveOneToSession = async (finding) => {
    if (!selectedSession) {
      toast({ title: 'Workspace Selection Target Missing', description: 'Please assign a session key context first before attempting exports.', variant: 'destructive', duration: 3000 });
      return;
    }
    await api.post('/vulnerabilities', { ...finding, session_id: selectedSession, detected_by: 'ai_auditor', ai_source_concern: true });
    queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
    toast({ title: 'Asset Captured', description: `"${finding.title}" appended inside system data structures successfully.`, duration: 3000 });
  };

  return (
    <div>
      <PageHeader
        icon={Scan}
        title="AI-Generated Source Code Auditor"
        subtitle="Decompile statistical anti-patterns and systemic hazards leaked from foundational LLM training pools"
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 space-y-4">
          <CodeEditor value={code} onChange={setCode} language={language} />

          <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb- block font-mono uppercase tracking-wide">Map findings to analysis session tracking dashboard</label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 mt-1.5"><SelectValue placeholder="Assign active tracking workspace target..." /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block font-mono uppercase tracking-wide">Source Generator Assistant</label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      {aiSources.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block font-mono uppercase tracking-wide">Source Language Target</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      {['javascript','python','java','csharp','php','go','typescript','rust','cpp'].map(l => (
                        <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block font-mono uppercase tracking-wide">Upstream Prompt Constraints / Context</label>
                <Textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Paste what initial engineering instructions, constraints, or raw text inputs were submitted to the LLM agent to output this block..."
                  className="h-16 bg-slate-950 border-slate-800 text-white text-xs font-mono"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium h-10 text-xs font-mono rounded-xl shadow-md"
                  onClick={runAudit}
                  disabled={!code.trim() || isAuditing}
                >
                  {isAuditing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compiling Deep Intelligence Traces...</>
                  ) : (
                    <><Scan className="w-4 h-4 mr-2" /> Audit Generative Patterns</>
                  )}
                </Button>
                {findings.length > 0 && selectedSession && (
                  <Button
                    variant="outline"
                    onClick={saveAllToSession}
                    disabled={isSaving}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 h-10 text-xs font-mono rounded-xl"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                    Export Batch Findings
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-5 space-y-4">
          {auditSummary && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-slate-900 border-purple-500/30 text-white rounded-2xl shadow-xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-slate-800/60 bg-slate-950/10">
                  <CardTitle className="text-xs font-mono font-medium text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4" /> Generative Telemetry Integrity Scorecard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-mono font-bold shrink-0 border ${
                      auditSummary.ai_trust_score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      auditSummary.ai_trust_score >= 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {auditSummary.ai_trust_score}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-wide">Software Trust Coefficient</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-normal font-mono">
                        {auditSummary.ai_trust_score >= 70 ? 'Secure production environment layout with trace best-practice suggestions.' :
                         auditSummary.ai_trust_score >= 40 ? 'Structural systemic bugs identified. Verification barriers required.' :
                         'Critical cyber exposure threats located. Immediate code refactoring enforced.'}
                      </p>
                    </div>
                  </div>

                  {auditSummary.common_patterns_found?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono font-bold text-slate-400 mb-2 flex items-center gap-1 uppercase tracking-wide">
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Correlated AI Anti-Pattern Matches
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {auditSummary.common_patterns_found.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs text-purple-400 border-purple-500/30 bg-purple-500/5 font-mono">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {auditSummary.recommendation && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                      <p className="text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wide">Remediation Framework Directive</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">{auditSummary.recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          <FindingsPanel findings={findings} mode="audit" onSaveVuln={selectedSession ? saveOneToSession : undefined} />
        </div>
      </div>
    </div>
  );
}