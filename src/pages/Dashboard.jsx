import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/Client';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Code, Network, AlertTriangle, CheckCircle2, Plus, ArrowRight, Activity, FolderOpen, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SeverityBadge from '@/components/shared/SeverityBadge';
import StatusDot from '@/components/shared/StatusDot';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

function StatCard({ title, value, icon: Icon, accent, description }) {
  return (
    <motion.div {...fadeIn}>
      <Card className="relative overflow-hidden group hover:border-primary/30 transition-colors shadow-lg rounded-2xl">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${accent}`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              <p className="text-3xl font-heading font-bold mt-2 text-foreground font-mono">{value}</p>
              {description && <p className="text-xs text-muted-foreground mt-1 font-mono">{description}</p>}
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions');
      return response.data;
    },
  });

  const { data: vulnerabilities = [] } = useQuery({
    queryKey: ['vulnerabilities'],
    queryFn: async () => {
      const response = await api.get('/vulnerabilities');
      return response.data;
    },
  });

  const activeSessions = sessions.filter(s => s.status === 'active');
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high');
  const mitigated = vulnerabilities.filter(v => v.status === 'mitigated');

  const recentVulns = vulnerabilities.slice(0, 5);
  const recentSessions = sessions.slice(0, 4);

  const handleScanVictimFolder = async () => {
    try {
      if (!window.require) {
        toast({
          title: "Sandbox Environment Restriction",
          description: "Please run the application suite inside the native desktop shell to unlock direct file system diagnostics mapping channels.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }

      const { ipcRenderer } = window.require('electron');
      setScanning(true);

      const victimData = await ipcRenderer.invoke('open-victim-folder');
      
      if (victimData && victimData.path) {
        if (victimData.code && victimData.code.includes("app.js negăsit")) {
          toast({
            title: "Target Mapping Rejection",
            description: "The selected workspace directory layout misses the core deployment controller entry point (app.js).",
            variant: "destructive",
            duration: 3000
          });
          return;
        }

        const folderName = victimData.path.split(/[\\/]/).pop();

        const sessionResponse = await api.post('/sessions', {
          name: `IAST Audit Node: ${folderName}`,
          target_description: `Deep semantic data tracking instantiated inside local repository context path references: ${victimData.path}`,
          language: "javascript",
          code_source: "local_desktop"
        });

        const newSessionId = sessionResponse.data?.id;

        if (!newSessionId) {
          throw new Error("Could not initialize running instance index markers inside disk registries.");
        }

        const scanResponse = await api.post('/audit/scan-source', {
          sourceCode: victimData.code,
          language: "javascript" ,
          
          sessionId: newSessionId
        });

        if (scanResponse.data?.success) {
          toast({
            title: "Interactive Analysis Concluded",
            description: `Workspace node active. Captured and synchronized ${scanResponse.data.count} core architectural vulnerability states.`,
            duration: 3000
          });
          
          setTimeout(() => {
            navigate('/visualizer');
          }, 1500);
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Telemetry Sync Failure",
        description: err.message || "Compilation sequence broken during source code telemetry ingestion processing loop.",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Activity}
        title="Security Operations Dashboard"
        subtitle="Centralized infrastructure monitor showing forensic scanning operations metrics"
        actions={
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleScanVictimFolder} 
              disabled={scanning}
              className="bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 font-medium h-9 rounded-xl text-xs font-mono"
            >
              {scanning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ingesting Data...</>
              ) : (
                <><FolderOpen className="w-4 h-4 mr-2 text-blue-400" /> Ingest Local Target Application</>
              )}
            </Button>

            <Button onClick={() => navigate('/sessions')} className="bg-blue-600 text-white hover:bg-blue-700 font-medium h-9 rounded-xl text-xs font-mono">
              <Plus className="w-4 h-4 mr-1.5" /> Initialize Workspace
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Workspaces" value={activeSessions.length} icon={Shield} accent="bg-blue-500" description={`${sessions.length} recorded registries`} />
        <StatCard title="Tracked Vulnerabilities" value={vulnerabilities.length} icon={AlertTriangle} accent="bg-red-500" description={`${criticalVulns.length} critical/high priority`} />
        <StatCard title="Enforced Mitigations" value={mitigated.length} icon={CheckCircle2} accent="bg-emerald-400" description={vulnerabilities.length > 0 ? `${Math.round(mitigated.length / vulnerabilities.length * 100)}% counterbalanced` : 'No metrics loaded'} />
        <StatCard title="Analyzed Attack Paths" value={sessions.filter(s => s.status === 'completed').length} icon={Network} accent="bg-purple-500" description="Frozen contexts" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div {...fadeIn} className="lg:col-span-1">
          <Card className="rounded-2xl shadow-xl border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                Recent Workspace Nodes
                <Link to="/sessions" className="text-blue-500 text-xs hover:underline flex items-center gap-1 font-sans capitalize normal-case font-medium">
                  Show all <ArrowRight className="w-3 h-3" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSessions.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground text-center py-8">No environments registered.</p>
              ) : (
                recentSessions.map(session => (
                  <Link
                    key={session.id}
                    to={`/analysis?session=${session.id}`}
                    className="block p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StatusDot status={session.status} pulse={session.status === 'active'} />
                      <span className="text-sm font-bold truncate text-white tracking-wide">{session.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <Code className="w-3 h-3 text-blue-400" />
                      <span className="capitalize">{session.language || 'Unknown'}</span>
                      <span className="text-[10px] bg-slate-850 px-1.5 py-0.2 rounded text-slate-400 border border-slate-800">
                        {session.code_source?.replace('ai_', 'AI Engine: ') || 'Source Target'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="rounded-2xl shadow-xl border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                Latest Telemetry Finding Records
                <Link to="/checklist" className="text-blue-500 text-xs hover:underline flex items-center gap-1 font-sans capitalize normal-case font-medium">
                  Full Register Overview <ArrowRight className="w-3 h-3" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentVulns.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground text-center py-8">Vulnerability database index channels empty.</p>
              ) : (
                <div className="space-y-2">
                  {recentVulns.map(vuln => (
                    <div key={vuln.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <SeverityBadge severity={vuln.severity} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-200 truncate tracking-wide">{vuln.title}</p>
                          <p className="text-xs text-slate-400 font-mono">{vuln.cwe_id} · {vuln.owasp_category?.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                        <StatusDot status={vuln.status} />
                        <span className="text-slate-500 text-[10px] uppercase font-bold">{vuln.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}