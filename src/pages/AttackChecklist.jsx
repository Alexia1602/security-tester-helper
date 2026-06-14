import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Filter, CheckCircle2, XCircle, AlertTriangle, Clock, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import PageHeader from '@/components/shared/PageHeader';
import SeverityBadge from '@/components/shared/SeverityBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const owaspCategories = [
  { value: 'all', label: 'All OWASP Categories' },
  { value: 'A03_Injection', label: 'A03 Injection' },
  { value: 'A01_Broken_Access_Control', label: 'A01 Broken Access Control' },
  { value: 'A02_Cryptographic_Failures', label: 'A02 Cryptographic Failures' },
  { value: 'A04_Insecure_Design', label: 'A04 Insecure Design' },
  { value: 'A05_Security_Misconfiguration', label: 'A05 Security Misconfiguration' },
];

const statusActions = [
  { value: 'found', label: 'Detected', icon: AlertTriangle, color: 'text-red-400 bg-red-500/10' },
  { value: 'confirmed', label: 'Confirmed', icon: Clock, color: 'text-orange-400 bg-orange-500/10' },
  { value: 'mitigated', label: 'Mitigated', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'false_positive', label: 'False Positive', icon: XCircle, color: 'text-slate-400 bg-slate-500/10' },
];

export default function AttackChecklist() {
  const { toast } = useToast();
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterSession, setFilterSession] = useState('all');
  const queryClient = useQueryClient();

  // 1. Loading vulnerabilities from Express local backend storage
  const { data: vulnerabilities = [], isLoading: loadingVulns } = useQuery({
    queryKey: ['vulnerabilities'],
    queryFn: async () => {
      const response = await api.get('/vulnerabilities');
      return response.data;
    },
  });

  // 2. Loading active tracking workspace nodes
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions');
      return response.data;
    },
  });

  // 3. Status update mutation trigger
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.post('/vulnerabilities/update-status', { id, status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      toast({
        title: "Status Updated Successfully",
        description: "The targeted security finding state has been persisted inside local registry logs.",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Database Synchronization Exception",
        description: "Failed to establish a valid control channel connection to the Express API registry node.",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  const filtered = vulnerabilities.filter(v => {
    if (filterCategory !== 'all' && v.owasp_category !== filterCategory) return false;
    if (filterSeverity !== 'all' && v.severity !== filterSeverity) return false;
    if (filterSession !== 'all' && v.session_id !== filterSession) return false;
    return true;
  });

  const stats = {
    total: filtered.length,
    critical: filtered.filter(v => v.severity === 'critical').length,
    mitigated: filtered.filter(v => v.status === 'mitigated').length,
  };

  // Academic Forensic PDF Export Compilation Script
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const sessionName = filterSession !== 'all' ? sessions.find(s => s.id === filterSession)?.name || 'All Sessions' : 'All Sessions';
    let y = 20;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(56, 189, 248);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Security Intelligence Suite — Forensic Vulnerability Report', 15, 18);
    
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Workspace Context: ${sessionName}  |  Compiled On: ${new Date().toLocaleDateString()}  |  Total Traced Risks: ${stats.total}`, 15, 30);
    y = 55;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`Executive Risk Summary: Critical Threats: ${stats.critical}  |  Verified Mitigations: ${stats.mitigated}`, 15, y);
    y += 12;

    const severityColor = { critical: [239, 68, 68], high: [249, 115, 22], medium: [234, 179, 8], low: [59, 130, 246], info: [100, 116, 139] };

    filtered.forEach((v, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const [r, g, b] = severityColor[v.severity] || [100, 116, 139];
      doc.setFillColor(r, g, b);
      doc.rect(15, y - 3, 3, 11, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${i + 1}. ${v.title}`, 22, y + 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Severity Level: ${v.severity?.toUpperCase()}  |  Identifier: ${v.cwe_id || 'N/A'}  |  OWASP Matrix: ${v.owasp_category?.replace(/_/g, ' ') || 'N/A'}  |  Lifecycle State: ${v.status?.toUpperCase()}`, 22, y + 7);
      
      y += 12;
    });

    doc.save(`forensic-audit-report-${sessionName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  if (loadingVulns || loadingSessions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400 font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs">Streaming active vulnerability infrastructure registry tables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CheckSquare}
        title="Vulnerability Register & Tracker"
        subtitle={`${stats.total} total system flaws cataloged · ${stats.mitigated} successfully remediated`}
        actions={
          filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportPDF} className="text-xs border-slate-800 text-slate-300 hover:bg-slate-900">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Compile Executive PDF Report
            </Button>
          )
        }
      />

      {/* FILTER CONTROLS MATRICES */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            
            <Select value={filterSession} onValueChange={setFilterSession}>
              <SelectTrigger className="w-48 bg-slate-950 border-slate-800 text-slate-300"><SelectValue placeholder="Workspace Filter" /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="all">All Workspace Sessions</SelectItem>
                {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-56 bg-slate-950 border-slate-800 text-slate-300"><SelectValue placeholder="OWASP Category" /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                {owaspCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-36 bg-slate-950 border-slate-800 text-slate-300"><SelectValue placeholder="Severity Threshold" /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="all">All Severities</SelectItem>
                {['critical','high','medium','low','info'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* DYNAMIC TRACKER FEED */}
      {filtered.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 text-slate-400 border-dashed rounded-2xl py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center">
            <CheckSquare className="w-12 h-12 text-slate-800 mb-3" />
            <h3 className="font-semibold text-base text-slate-200 mb-1">No Flaws Detected Inside Scope</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-mono">
              Execute static compilation audits or dynamic automated exploit lab simulations to populate this logging tracker database registry.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((vuln, i) => (
              <motion.div
                key={vuln.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className={cn(
                  'bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors rounded-xl shadow-md',
                  vuln.status === 'mitigated' && 'opacity-40'
                )}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SeverityBadge severity={vuln.severity} />
                          <h4 className={cn(
                            "font-bold text-sm text-white tracking-wide",
                            vuln.status === 'mitigated' && 'line-through text-slate-500'
                          )}>{vuln.title}</h4>
                        </div>
                        <p className="text-xs text-slate-300 font-mono bg-slate-950/40 p-2 border border-slate-850 rounded leading-relaxed">{vuln.description}</p>
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <Badge className="bg-slate-950 text-blue-400 border border-blue-900/40 font-mono text-[10px]">{vuln.cwe_id}</Badge>
                          {vuln.owasp_category && (
                            <Badge className="bg-slate-950 text-purple-400 border border-purple-900/40 font-mono text-[10px]">{vuln.owasp_category.replace(/_/g, ' ')}</Badge>
                          )}
                          {vuln.layer && (
                            <Badge className="bg-slate-950 text-slate-400 border border-slate-800 font-mono text-[10px]">{vuln.layer?.toUpperCase()}</Badge>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS LIFECYCLE TICKER TOGGLE BUTTONS */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1.5 border border-slate-850 rounded-xl self-end sm:self-center">
                        {statusActions.map(action => (
                          <Button
                            key={action.value}
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-8 w-8 rounded-md transition-all',
                              vuln.status === action.value ? action.color : 'text-slate-600 hover:text-slate-300'
                            )}
                            onClick={() => updateStatusMutation.mutate({ id: vuln.id, status: action.value })}
                            title={action.label}
                          >
                            <action.icon className="w-4 h-4" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}