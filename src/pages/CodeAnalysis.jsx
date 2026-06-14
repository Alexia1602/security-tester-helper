import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/Client';
import axios from 'axios';
import { 
  Code, Loader2, AlertCircle, Terminal, Shield, ShieldAlert, 
  ShieldCheck, Play, RotateCcw, Server, Database, Lock, Key, Network 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import CodeEditor from '@/components/analysis/CodeEditor';
import AnalysisControls from '@/components/analysis/AnalysisControls';
import FindingsPanel from '@/components/analysis/FindingsPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const VICTIM_API_URL = 'http://localhost:5000/api';

const LAB_EXPLOIT_MANIFEST = {
  targetDefaultHost: 'http://localhost:5000',
  steps: [
    {
      stepId: 1,
      name: "Information Disclosure Vector",
      cwe: "CWE-200",
      description: "Inspection of unmapped verbose telemetry registers or system logs.",
      endpoint: "/api/v1/system/debug-logs",
      method: "GET",
      payload: null,
      extractor: (responseData) => {
        if (responseData?.recent_internal_calls) {
          const criticalCall = responseData.recent_internal_calls.find(c => c.ticket_entity);
          return { nextTargetId: criticalCall ? criticalCall.ticket_entity : "102" };
        }
        return null;
      }
    },
    {
      stepId: 2,
      name: "Insecure Direct Object Reference (IDOR)",
      cwe: "CWE-284",
      description: "Bypass authorization constraints by manipulating key identifiers.",
      endpoint: (context) => `/api/v1/tickets/${context.nextTargetId || '102'}`,
      method: "GET",
      payload: null,
      extractor: (responseData) => {
        const desc = responseData.description || '';
        const tokenMatch = desc.match(/SECRET_ADMIN_TOKEN_[0-9]+/);
        return tokenMatch ? { adminToken: tokenMatch[0] } : null;
      }
    },
    {
      stepId: 3,
      name: "Privilege Escalation Gate",
      cwe: "CWE-269",
      description: "Submit unauthorized token metadata to elevate interface access.",
      endpoint: "/api/v1/auth/verify-admin",
      method: "POST",
      payload: (context) => ({ token: context.adminToken }),
      extractor: (responseData) => responseData.success ? { authenticated: true } : null
    },
    {
      stepId: 4,
      name: "Remote OS Command Injection",
      cwe: "CWE-78",
      description: "Hijack the runtime subshell process execution flow.",
      endpoint: "/api/v1/system/diagnostic",
      method: "POST",
      payload: (context) => ({ ip: `127.0.0.1 ; dump_vault --session=${context.sessionId}` }),
      extractor: (responseData) => responseData.attack_compromised ? { loot: responseData.exfiltrated_loot } : null
    }
  ]
};

export default function CodeAnalysis() {
  const location = useLocation();
  const sessionId = location.state?.sessionId;
  
  
  
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [mode, setMode] = useState('adversary');
  const [language, setLanguage] = useState('javascript');
  const [findings, setFindings] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [patchActive, setPatchActive] = useState(false);
  const [currentAttackStep, setCurrentStep] = useState(0); 
  const [isExploiting, setIsExploiting] = useState(false);
  const [exfiltratedLoot, setExfiltratedLoot] = useState(null);
  const [labContext, setLabContext] = useState({ sessionId: sessionId });
  const [terminalLogs, setLogs] = useState([
    { type: 'info', text: 'Modular Orchestrator Engine initialized. Standing by for pipeline instructions.' }
  ]);
const navigate = useNavigate();

  useEffect(() => {
    setCurrentStep(0);
    setExfiltratedLoot(null);
    setFindings([]);
    setCode('');
    setLabContext({ sessionId: sessionId });
    setLogs([
      { type: 'info', text: 'Workspace context changed or destroyed. Sandbox state wiped clean.' }
    ]);
  }, [sessionId]);

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (session) {
      if (session.code_snippet) setCode(session.code_snippet);
      if (session.language) setLanguage(session.language);
    }
    checkVictimPatchStatus();
  }, [session]);

  const checkVictimPatchStatus = async () => {
    try {
      const res = await axios.get(`${VICTIM_API_URL}/debug/patch-status`);
      setPatchActive(res.data.active);
    } catch (err) {
      addTerminalLog('error', 'Target node offline: Connection refused on http://localhost:5000');
    }
  };

  const addTerminalLog = (type, text) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, text: `[${timestamp}] ${text}` }]);
  };

  const handleTogglePatch = async (checked) => {
    try {
      setIsExploiting(true);
      const res = await axios.post(`${VICTIM_API_URL}/debug/toggle-patch`, { active: checked });
      if (res.data.success) {
        setPatchActive(res.data.patch_active);
        addTerminalLog(
          res.data.patch_active ? 'success' : 'warn',
          `Remote configuration update: Hot-remediative source switching set to ${res.data.patch_active ? 'ENABLED' : 'DISABLED'}`
        );
        toast({
          title: res.data.patch_active ? "Remediation Enforced" : "Protections Removed",
          description: res.data.patch_active ? "Regex filters and authorization tokens activated." : "Target environment is now vulnerable."
        });
      }
    } catch (err) {
      addTerminalLog('error', 'Failed to communicate defense parameters to target application node.');
    } finally {
      setIsExploiting(false);
    }
  };

  const executePipelineStep = async (stepIndex) => {
    if (!sessionId) return;
    
    const stepConfig = LAB_EXPLOIT_MANIFEST.steps[stepIndex];
    if (!stepConfig) return;

    setIsExploiting(true);
    
    const targetEndpoint = typeof stepConfig.endpoint === 'function' 
      ? stepConfig.endpoint(labContext) 
      : stepConfig.endpoint;
    
    const targetUrl = `${LAB_EXPLOIT_MANIFEST.targetDefaultHost}${targetEndpoint}`;
    const computedPayload = typeof stepConfig.payload === 'function' ? stepConfig.payload(labContext) : stepConfig.payload;

    addTerminalLog('exploit', `Launching Step ${stepConfig.stepId} [${stepConfig.cwe}]: Tracing vector via ${stepConfig.method} ${targetEndpoint}`);

    try {
      let response;
      if (stepConfig.method === 'POST') {
        response = await axios.post(targetUrl, computedPayload);
      } else {
        response = await axios.get(targetUrl);
      }

      if (stepConfig.extractor) {
        const extractedData = stepConfig.extractor(response.data);
        if (extractedData) {
          setLabContext(prev => {
            const updated = { ...prev, ...extractedData };
            if (extractedData.loot) setExfiltratedLoot(extractedData.loot);
            return updated;
          });
          
          Object.entries(extractedData).forEach(([key, val]) => {
            if (key !== 'loot') {
              addTerminalLog('loot', `Discovered asset [${key}]: ${typeof val === 'object' ? JSON.stringify(val) : val}`);
            }
          });
        }
      }

      setCurrentStep(stepConfig.stepId);
      addTerminalLog('success', `Step ${stepConfig.stepId} Engine Response: Action concluded successfully.`);

      if (stepConfig.stepId === LAB_EXPLOIT_MANIFEST.steps.length) {
        addTerminalLog('success', 'CHAINED INFRASTRUCTURE COMPROMISE COMPLETED.');
        await api.post('/vulnerabilities', {
          title: "Chained Infrastructure Compromise via Manifest Pipeline",
          description: `Full execution sequence concluded successfully by identifying cascading vectors from Step 1 to Step ${stepConfig.stepId}.`,
          severity: "critical",
          cwe_id: stepConfig.cwe,
          owasp_category: "A03_2021-Injection",
          status: "found",
          layer: "backend",
          session_id: sessionId
        });
        queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
        addTerminalLog('info', 'Exploitation metrics pushed automatically to global security registry tracker.');
      }

    } catch (err) {
      if (err.response && err.response.status === 403) {
        addTerminalLog('error', `Exploit Blocked (403 Forbidden): Target environment validated access constraints successfully.`);
      } else if (err.response && err.response.data && err.response.data.error === "Security Exception") {
        addTerminalLog('error', `Exploit Aborted: Mitigation filters inside target node rejected the metadata parsing payload.`);
      } else {
        addTerminalLog('error', `Pipeline execution exception: Connection drop or transmission rejection on endpoint.`);
      }
    } finally {
      setIsExploiting(false);
    }
  };

  const clearLabSandbox = () => {
    setCurrentStep(0);
    setExfiltratedLoot(null);
    setLabContext({ sessionId: sessionId });
    addTerminalLog('info', 'Sandbox memory context flushed. Laboratory orchestration reset.');
  };

  const runAnalysis = async () => {
    if (!code.trim()) {
      toast({ title: 'Input Empty', description: 'Please paste source code inside the editor component.', variant: 'destructive' });
      return;
    }
    setIsAnalyzing(true);
    setFindings([]);
    try {
      let response;
      if (mode === 'audit') {
        response = await api.post('/analyze/audit-ai', { code, language });
      } else {
        response = await api.post('/analyze', { code, language, mode });
      }
      
      const incomingFindings = response.data.findings || [];
      setFindings(incomingFindings);

      if (sessionId) {
        await api.put(`/sessions/${sessionId}`, { code_snippet: code, language });
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
      }
      toast({ title: "Analysis Concluded", description: `Successfully compiled rules for [${mode.toUpperCase()}] mode.` });
    } catch (err) {
      toast({ title: 'Analysis Error', description: 'Express backend compiler rejected request.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🛡️ REPARAT DEFINITIV: Mapare flexibilă cu fallback-uri structurate
  const saveVuln = async (finding) => {
    if (!sessionId) {
      toast({ title: 'No Session Found', description: 'Please map this action inside an active auditing workspace context.', variant: 'destructive' });
      return;
    }
    try {
      await api.post('/vulnerabilities', { 
        title: finding.title || "Unspecified Security Finding",
        description: finding.description || "Forensic telemetry record log tracking missing context data parameters.",
        severity: finding.severity || "high",
        cwe_id: finding.cwe_id || finding.cwe || "CWE-89",
        owasp_category: finding.owasp_category ? finding.owasp_category.replace(/ /g, '_') : "A03_2021-Injection",
        layer: finding.layer || "backend",
        session_id: sessionId ,
        status: "found"
      });
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      toast({ title: 'Flaw Exported', description: `Successfully added "${finding.title}" to global tracker registry.` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Export failed', description: 'Communication failure with local data storage endpoint.', variant: 'destructive' });
    }
  };

  if (loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400 font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <p className="text-xs">Loading active analysis workspace metadata context...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Code}
        title="Source Code Intelligence Suite"
        subtitle={session ? `Active Workspace Node: ${session.name}` : 'Execute advanced semantic compilation and dynamic exploit chaining.'}
      />

      <Tabs defaultValue="static_audit" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl h-11 w-full max-w-md grid grid-cols-2">
          <TabsTrigger value="static_audit" className="text-xs font-mono font-bold rounded-lg data-[state=active]:bg-slate-950">
            <Code className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Static Semantic Audit
          </TabsTrigger>
          <TabsTrigger value="dynamic_lab" className="text-xs font-mono font-bold rounded-lg data-[state=active]:bg-slate-950">
            <Terminal className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> Dynamic Exploit Lab
          </TabsTrigger>
        </TabsList>

        <TabsContent value="static_audit" className="mt-6 space-y-6">
          {!sessionId && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3 text-yellow-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Sandbox Workspace Isolation Mode Active: Queries execute freely but logging requires an active tracking session context.</span>
            </div>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 space-y-4">
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
                <CodeEditor value={code} onChange={setCode} language={language} />
              </div>
              <Card className="bg-slate-900 border-slate-800 text-white shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-800/40 bg-slate-950/20">
                  <CardTitle className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Analysis Matrix Configuration</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <AnalysisControls
                    mode={mode} setMode={setMode}
                    language={language} setLanguage={setLanguage}
                    onAnalyze={runAnalysis} isAnalyzing={isAnalyzing}
                  />
                  {findings.length > 0 && (
  <div className="mt-4">
    <Button
      variant="outline"
      className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30 h-10 text-xs font-mono rounded-xl"
      onClick={() => navigate('/visualizer', { state: { sessionId: sessionId } })}
    >
      <Network className="w-4 h-4 mr-2" /> Visualise Attack Chain
    </Button>
  </div>
)}
                </CardContent>
              </Card>
            </div>
            <div className="xl:col-span-5">
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow-xl p-1 h-full">
                <FindingsPanel findings={findings} onSaveVuln={saveVuln} mode={mode} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dynamic_lab" className="mt-6 space-y-6">
          {!sessionId ? (
            <Card className="bg-slate-900 border-slate-800 border-dashed rounded-2xl py-20 text-center text-slate-400 max-w-2xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <Lock className="w-12 h-12 text-slate-800 animate-pulse" />
                <h3 className="font-semibold text-base text-slate-200">Dynamic Pipeline Context Missing</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-mono">
                  Advanced multi-stage attack chaining simulations require a running forensic logging session. Please initialize or activate a session workspace from the "Audit Sesiuni" dashboard panel first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              <Card className="bg-slate-900 border-slate-800 text-white lg:col-span-4 rounded-2xl shadow-2xl">
                <CardHeader className="pb-3 border-b border-slate-800/60 bg-slate-950/20">
                  <CardTitle className="text-xs font-mono font-bold tracking-wide flex items-center justify-between uppercase text-slate-400">
                    <span className="flex items-center gap-2"><Server className="w-4 h-4 text-blue-400" /> Target Control Engine</span>
                    <Badge variant={patchActive ? "success" : "destructive"} className="text-[9px] font-mono tracking-widest">
                      {patchActive ? 'SECURED' : 'VULNERABLE'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block font-mono text-slate-200">Defensive Hot-Patch</span>
                      <span className="text-[9px] text-slate-500 block">Deploy source mitigations instantly</span>
                    </div>
                    <Switch checked={patchActive} onCheckedChange={handleTogglePatch} disabled={isExploiting} />
                  </div>

                  <div className="space-y-2.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase block">
                      Kill Chain Automation Pipeline
                    </span>
                    
                    {LAB_EXPLOIT_MANIFEST.steps.map((step, index) => {
                      const isStepPassed = currentAttackStep >= step.stepId;
                      const isStepCurrent = currentAttackStep === index;

                      return (
                        <div 
                          key={step.stepId} 
                          className={`p-3 rounded-xl border transition-all duration-200 ${
                            isStepPassed 
                              ? 'bg-blue-500/5 border-blue-500/20' 
                              : isStepCurrent 
                                ? 'bg-slate-950 border-slate-700 shadow-md ring-1 ring-slate-800' 
                                : 'bg-slate-950/40 border-slate-850 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 font-mono text-xs">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                isStepPassed ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {step.stepId}
                              </span>
                              <div>
                                <span className="font-bold block text-slate-200">{step.name}</span>
                                <span className="text-[9px] text-slate-500 block">{step.cwe} • Modular Vector</span>
                              </div>
                            </div>
                            
                            <Button 
                              size="icon" 
                              className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-md shrink-0 transition-transform active:scale-95" 
                              onClick={() => executePipelineStep(index)} 
                              disabled={isExploiting || !isStepCurrent}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>

                          {step.stepId === 1 && labContext.nextTargetId && (
                            <div className="mt-2.5 pt-2 border-t border-slate-850/60 flex items-center gap-1.5 animate-in fade-in duration-200 text-[10px] font-mono text-slate-400">
                              <AlertCircle className="w-3 h-3 text-cyan-400" /> Target Mapped ID: <span className="text-cyan-400 font-bold">{labContext.nextTargetId}</span>
                            </div>
                          )}
                          {step.stepId === 2 && labContext.adminToken && (
                            <div className="mt-2.5 pt-2 border-t border-slate-850/60 flex items-center gap-1.5 animate-in fade-in duration-200 text-[10px] font-mono text-slate-400">
                              <Key className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="text-slate-400">Extracted Key:</span>
                              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono px-1 rounded font-bold">
                                {labContext.adminToken}
                              </Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Button variant="outline" className="w-full border-slate-800 hover:bg-slate-800 text-xs font-mono font-bold h-9 rounded-xl text-slate-300" onClick={clearLabSandbox}><RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Laboratory Context</Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-8 flex flex-col gap-4">
                <Card className="bg-slate-950 border-slate-900 text-slate-300 font-mono shadow-2xl flex-1 flex flex-col rounded-2xl min-h-[260px]">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-950 flex items-center gap-2 rounded-t-2xl">
                    <div className="flex gap-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-2">Exploit Orchestrator Subshell Logs</span>
                  </div>
                  <CardContent className="p-4 text-xs space-y-1.5 overflow-y-auto max-h-[250px] flex-1">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className={`leading-relaxed tracking-wide ${
                        log.type === 'success' ? 'text-emerald-400 font-semibold' :
                        log.type === 'error' ? 'text-rose-400 font-bold' :
                        log.type === 'exploit' ? 'text-cyan-400' :
                        log.type === 'loot' ? 'text-purple-400 font-semibold underline' : 'text-slate-500'
                      }`}>{log.text}</div>
                    ))}
                  </CardContent>
                </Card>

                {exfiltratedLoot && (
                  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl border-l-4 border-l-purple-500 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Database className="w-4 h-4" /> Exfiltrated Core Assets Storage (Target Data Vault)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="bg-slate-950 rounded-xl border border-slate-850 p-3 overflow-x-auto">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-500">
                              <th className="pb-2 font-bold uppercase">Asset Node</th>
                              <th className="pb-2 font-bold uppercase">Host Reference</th>
                              <th className="pb-2 font-bold uppercase">Compromised Credentials</th>
                              <th className="pb-2 font-bold uppercase">Context Domain Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exfiltratedLoot.map((loot, idx) => (
                              <tr key={idx} className="border-b border-slate-900/60 last:border-0 text-slate-300">
                                <td className="py-2 text-cyan-400 font-bold">{loot.asset_id}</td>
                                <td className="py-2">{loot.host}</td>
                                <td className="py-2 text-amber-400 font-bold">{loot.credentials}</td>
                                <td className="py-2 text-slate-400">{loot.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {sessionId && (
            <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl overflow-hidden shadow-2xl">
              <CardHeader className="border-b border-slate-800/60 pb-4 bg-slate-950/10">
                <CardTitle className="text-sm font-bold tracking-wide font-mono flex items-center gap-2 uppercase text-slate-300">
                  <Shield className="w-4 h-4 text-emerald-400" /> Remediation Framework & Code Fix Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="cwe284" className="w-full">
                  <TabsList className="bg-slate-950 border border-slate-850 p-1 rounded-xl h-10 w-full max-w-sm grid grid-cols-2">
                    <TabsTrigger value="cwe284" className="text-xs font-mono font-bold rounded-lg data-[state=active]:bg-slate-900">CWE-284: IDOR</TabsTrigger>
                    <TabsTrigger value="cwe78" className="text-xs font-mono font-bold rounded-lg data-[state=active]:bg-slate-900">CWE-78: OS Command Injection</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cwe284" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono font-bold text-rose-400 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Vulnerable System Pattern</span>
                      <pre className="bg-slate-950 border border-red-950/20 p-4 rounded-xl font-mono text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`app.get('/api/v1/tickets/:id', (req, res) => {
  const { id } = req.params;
  
  // 🚨 CRITICAL: Missing authorization context verification
  const ticket = database.tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: "Not Found" });
  res.json(ticket);
});`}
                      </pre>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Secure Engineering Control</span>
                      <pre className="bg-slate-950 border border-emerald-950/20 p-4 rounded-xl font-mono text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`app.get('/api/v1/tickets/:id', (req, res) => {
  const { id } = req.params;
  const userSession = req.user; // Authenticated session token mapping

  // ✔️ RESTRICTION: Asset tokens checked against user properties
  if (userSession.role !== 'admin' && id !== userSession.allowedId) {
    return res.status(403).json({ error: "Access Denied: Missing Context" });
  }
  const ticket = database.tickets.find(t => t.id === id);
  res.json(ticket);
});`}
                    </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="cwe78" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono font-bold text-rose-400 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Vulnerable System Pattern</span>
                      <pre className="bg-slate-950 border border-red-950/20 p-4 rounded-xl font-mono text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`app.post('/api/v1/system/diagnostic', (req, res) => {
  const { ip } = req.body;

  // 🚨 CRITICAL: Shell concatenation introduces system context switching
  let command = \`ping -c 1 \${ip}\`;
  exec(command, (err, stdout, stderr) => {
    res.json({ output: stdout || stderr });
  });
});`}
                      </pre>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Secure Engineering Control</span>
                      <pre className="bg-slate-950 border border-emerald-950/20 p-4 rounded-xl font-mono text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`app.post('/api/v1/system/diagnostic', (req, res) => {
  const { ip } = req.body;

  // ✔️ HARDENING: Enforce strict alphanumeric formatting via Whitelist Regex
  const ipRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  if (!ipRegex.test(ip.trim())) {
    return res.status(400).json({ error: "Malicious Injection Blocked" });
  }

  exec(\`ping -c 1 \${ip}\`, (err, stdout, stderr) => {
    res.json({ output: stdout || stderr });
  });
});`}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}