import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Shield, Code, Layers, CheckCircle2, Save } from 'lucide-react';
import SeverityBadge from '@/components/shared/SeverityBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/Client';

export default function FindingsPanel({ findings = [], onSaveVuln, mode }) {
  if (findings.length === 0) {
    return (
      <Card className="border-dashed bg-slate-900/40 border-slate-800 rounded-2xl py-12 text-center text-slate-500 font-mono">
        <CardContent className="flex flex-col items-center justify-center">
          <Shield className="w-10 h-10 text-slate-800 mb-3 animate-pulse" />
          <p className="text-xs">Execute a suite analysis to populate tracked vulnerability feeds.</p>
        </CardContent>
      </Card>
    );
  }

  const modeColors = {
    adversary: 'border-l-red-500',
    defender: 'border-l-blue-500',
    audit: 'border-l-purple-500',
  };

  return (
    <div className="space-y-3 font-mono text-white">
      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Identified Artifact Metrics ({findings.length} {findings.length === 1 ? 'Finding' : 'Findings'})
        </h3>
      </div>

      <Accordion type="multiple" className="space-y-2">
        <AnimatePresence>
          {findings.map((finding, i) => (
            <motion.div
              key={finding.id || i}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <AccordionItem 
                value={`finding-${i}`} 
                className={`border rounded-xl bg-slate-900/90 border-slate-850 border-l-4 ${modeColors[mode] || 'border-l-blue-500'} shadow-md overflow-hidden`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-950/30 transition-colors">
                  <div className="flex items-start gap-3 text-left w-full pr-4">
                    <div className="mt-0.5 shrink-0">
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-200 truncate tracking-wide">{finding.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {finding.cwe_id || finding.cwe || 'CWE-89'} · Line {finding.code_line || finding.line || '14'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4 pt-2 border-t border-slate-950 bg-slate-950/20 space-y-3 text-xs">
                  {/* Description Box */}
                  <p className="text-slate-400 text-[11px] leading-relaxed font-sans">{finding.description}</p>

                  {/* Vulnerable Snippet Code Mirror */}
                  {(finding.code_context || finding.vulnerable_code) && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Code className="w-3 h-3" /> Vulnerable Dynamic Context
                      </p>
                      <pre className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-[11px] font-mono text-rose-400 overflow-x-auto whitespace-pre-wrap leading-normal">
                        {finding.code_context || finding.vulnerable_code}
                      </pre>
                    </div>
                  )}

                  {/* Offensive Attack Parameters Instruction */}
                  {finding.attack_vector && (
                    <div className="space-y-1 bg-red-500/5 p-2.5 rounded-lg border border-red-500/10">
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" /> Attacker Exploit Vector
                      </p>
                      <p className="text-slate-400 text-[11px] leading-relaxed font-sans mt-0.5">{finding.attack_vector}</p>
                    </div>
                  )}

                  {/* Defensive Secure Coding Countermeasures */}
                  {(finding.remediation || finding.reremediation) && (
                    <div className="space-y-1 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                      <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Secure Remediation Strategy
                      </p>
                      <p className="text-slate-400 text-[11px] leading-relaxed font-sans mt-0.5">{finding.remediation || finding.reremediation}</p>
                    </div>
                  )}

{/* Core Metric Badges Footer */}
<div className="flex flex-col gap-3 pt-3 border-t border-slate-900">
  <div className="flex items-center gap-1.5 flex-wrap">
    <Badge variant="outline" className="text-[9px] font-mono uppercase bg-slate-950 border-slate-800 text-slate-400 rounded px-1.5 py-0.5">
      <Layers className="w-2.5 h-2.5 mr-1" />{finding.layer || 'backend'}
    </Badge>
    {finding.owasp_category && (
      <Badge variant="outline" className="text-[9px] font-mono uppercase bg-slate-950 border-slate-800 text-slate-400 rounded px-1.5 py-0.5">
        {finding.owasp_category.replace(/_/g, ' ')}
      </Badge>
    )}
    {finding.ai_source_concern && (
      <Badge variant="outline" className="text-[9px] font-mono uppercase bg-purple-950/40 border-purple-500/20 text-purple-400 rounded px-1.5 py-0.5">
        AI Artifact Concerns
      </Badge>
    )}
  </div>

  <div className="flex items-center justify-between gap-2">
    {/* 🧠 Feedback Loop Buttons */}
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 px-2 text-[10px] text-emerald-500 hover:bg-emerald-950/30"
        onClick={() => api.post('/api/audit/feedback', { vulnId: finding.id, isCorrect: true })}
      >
        <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 px-2 text-[10px] text-rose-500 hover:bg-rose-950/30"
        onClick={() => api.post('/api/audit/feedback', { vulnId: finding.id, isCorrect: false })}
      >
        <AlertTriangle className="w-3 h-3 mr-1" /> Dismiss
      </Button>
    </div>

    {/* 💾 Save to Session */}
    {onSaveVuln && (
      <Button
        variant="outline"
        size="sm"
        className="bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white h-7 text-[10px] font-mono rounded-lg flex items-center gap-1 shrink-0 transition-all active:scale-95"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("[EMIT EVENT] Propagating finding payload context:", finding);
          onSaveVuln(finding);
        }}
      >
        <Save className="w-3 h-3 text-cyan-400" /> Save
      </Button>
    )}
  </div>
</div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </Accordion>
    </div>
  );
}