import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crosshair, Loader2, ShieldCheck, Zap, Target } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const effortColors = {
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function ChainBreaker() {
  const [selectedSession, setSelectedSession] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  // 1. Fetch active session workspaces
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions');
      return response.data;
    },
  });

  // 2. Fetch all registered flaws tracking dependencies
  const { data: allVulns = [] } = useQuery({
    queryKey: ['vulnerabilities'],
    queryFn: async () => {
      const response = await api.get('/vulnerabilities');
      return response.data;
    },
  });

  const sessionVulns = selectedSession ? allVulns.filter(v => v.session_id === selectedSession) : [];

  // ⚡ STRATEGIC MITIGATION MODELLING DISPATCH PIPELINE
  const runBreakAnalysis = async () => {
    if (!sessionVulns.length) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await api.post('/analyze/break', { session_id: selectedSession });
      setAnalysis(response.data);
      
      queryClient.invalidateQueries({ queryKey: ['chain-analyses'] });
      toast({ 
        title: 'Assessment Concluded', 
        description: 'Chain Breaker countermeasure trees mapped to workspace constraints successfully.'
      });

    } catch (err) {
      console.error("Remediation calculation dropped: ", err);
      toast({ 
        title: 'Subsystem Connection Timeout', 
        description: 'The localized storage channel context could not resolve compilation parameters.', 
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Crosshair}
        title="Chain Breaker Mitigation Assessment"
        subtitle="Strategic defense-in-depth framework compiled to sever attack paths with optimized engineering footprints."
      />

      {/* WORKSPACE INDEX DROPDOWN */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl rounded-2xl overflow-hidden">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 bg-slate-950/20">
          <div className="w-72">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 font-mono text-xs">
                <SelectValue placeholder="Select target workspace context..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id} className="font-mono text-xs">
                    {s.name} ({allVulns.filter(v => v.session_id === s.id).length} vulnerabilities saved)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs h-10 px-4 rounded-xl shadow-md"
            onClick={runBreakAnalysis}
            disabled={!selectedSession || sessionVulns.length === 0 || isAnalyzing}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compiling Inversion Trees...</>
            ) : (
              <><Crosshair className="w-4 h-4 mr-2" /> Model Remediation Strategy</>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {analysis && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {/* EXECUTIVE REPORT DESCRIPTION HEADER */}
            {analysis.summary && (
              <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden border-l-4 border-l-cyan-500 animate-in fade-in duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                      <ShieldCheck className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-mono font-bold text-sm tracking-wide text-slate-200 uppercase">Strategic Remediation Matrix</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-mono mt-1">{analysis.summary}</p>
                      </div>
                      {analysis.total_risk_reduction != null && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-850">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Calculated Risk Reduction Factor</span>
                            <span className="font-bold text-cyan-400">{analysis.total_risk_reduction}%</span>
                          </div>
                          <Progress value={analysis.total_risk_reduction} className="h-2 bg-slate-950 border border-slate-850" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STRATEGIC SYSTEM OVERVIEW STACK */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase block">
                Targeted Mitigation Architecture Guidelines ({analysis.recommendations?.length || 0})
              </h3>
              
              {analysis.recommendations?.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-slate-900 border-slate-800 text-white rounded-xl shadow-md hover:border-slate-700 transition-colors">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-950 pb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
                            {i + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-200 font-mono tracking-wide">{rec.title}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{rec.type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('text-[10px] font-mono uppercase px-2 rounded font-bold tracking-wide', effortColors[rec.effort?.toLowerCase()] || effortColors.medium)}>
                          {rec.effort} Effort
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-300 font-mono leading-relaxed">{rec.description}</p>
                      
                      {rec.implementation && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wide">Implementation Refactoring Blueprint</p>
                          <pre className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {rec.implementation}
                          </pre>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-950">
                        {rec.chains_broken != null && (
                          <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                            <Zap className="w-3 h-3 text-cyan-400" />
                            Disrupts {rec.chains_broken}/{rec.total_chains || '1'} attack trees
                          </span>
                        )}
                        {rec.impact_score != null && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Target className="w-3 h-3 text-slate-500" />
                            Countermeasure Weight: {rec.impact_score}/10
                          </span>
                        )}
                        {rec.affected_layers?.map(l => (
                          <Badge key={l} variant="outline" className="text-[9px] uppercase font-mono tracking-wider border-slate-850 bg-slate-950 text-slate-400">{l}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!analysis && (
        <Card className="border-dashed bg-slate-900/10 border-slate-800 text-center rounded-2xl py-20 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center text-slate-400">
            <Crosshair className="w-14 h-14 text-slate-800 mb-4 animate-pulse" />
            <h3 className="font-semibold text-base text-slate-200 mb-1">Awaiting Mitigation Architecture Map</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">Select an isolated audit context containing logged active findings to compile defense matrices.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}