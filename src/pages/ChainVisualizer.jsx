import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Network, Loader2, AlertTriangle, Layers, Server } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SeverityBadge from '@/components/shared/SeverityBadge';
import ChainGraph from '@/components/chain/ChainGraph';
import { useSearchParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

export default function AttackVisualizer() {
  
  const [targetEnvironment, setTargetEnvironment] = useState('nodejs_v8'); // 💡 Adăugat starea mediului poliglot
  const [chainData, setChainData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const location = useLocation(); 
  const [selectedSession, setSelectedSession] = useState(location.state?.sessionId || '');

  const { data: allVulns = [], refetch } = useQuery({
    queryKey: ['vulnerabilities'],
    queryFn: async () => {
      const response = await api.get('/vulnerabilities');
      return response.data;
    },
  });
  const handleSessionChange = (id) => {
    setSelectedSession(id);
  };
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions');
      return response.data;
    },
  });
 useEffect(() => {
  if (selectedSession) {
    console.log("Vizualizatorul a primit sesiunea:", selectedSession);
    refetch();
  }
}, [selectedSession, refetch]);


  const sessionVulns = selectedSession ? allVulns.filter(v => v.session_id === selectedSession) : [];

  const runChainAnalysis = async () => {
    setIsAnalyzing(true);
    setChainData(null);
    setSelectedNode(null);

    try {
      // Trimitem și target_environment către backend ca să știe ce graf să genereze comparativ
      const response = await api.post('/analyze/chain', {
        vulnerabilities: sessionVulns,
        session_id: selectedSession,
        target_environment: targetEnvironment 
      });

      setChainData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Network}
        title="Attack Chain Correlation Visualizer"
        subtitle="Directed structural dependency trees tracking lateral pivots and language-specific execution mechanics."
      />

      {/* WORKSPACE SELECTION INTERACTION DECK */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 bg-slate-950/20">
          
          {/* Selector Workspace Sesiune */}
          <div className="w-64">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Auditing Workspace</label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 font-mono text-xs">
                <SelectValue placeholder="Select target workspace..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id} className="font-mono text-xs">
                    {s.name} ({allVulns.filter(v => v.session_id === s.id).length || 0} findings)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 💡 SPRE COMPLEMENTARITATE: Selectorul de Ecosistem de Programare */}
          <div className="w-56">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Target Sandbox Runtime</label>
            <Select value={targetEnvironment} onValueChange={setTargetEnvironment}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white font-mono text-xs">
                <SelectItem value="nodejs_v8">Node.js (V8 Event Loop)</SelectItem>
                <SelectItem value="java_jvm">Java (JVM Bytecode Container)</SelectItem>
                <SelectItem value="python_cpython">Python (CPython Context)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-5">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs h-10 px-4 rounded-xl shadow-md"
              onClick={runChainAnalysis}
              disabled={!selectedSession || isAnalyzing}
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Correlating Stack...</>
              ) : (
                <><Network className="w-4 h-4 mr-2" /> Compile Language Graph Topology</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GRAPH CANVAS DISPLAY LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          {chainData && chainData.nodes && chainData.nodes.length > 0 ? (
            <Card className="overflow-hidden bg-slate-900 border-slate-800 rounded-2xl shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-800/40 bg-slate-950/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Sequential Directed Topology Tree</CardTitle>
                  {chainData.overall_risk_score != null && (
                    <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-xs">
                      Exploit Risk Coefficient: {chainData.overall_risk_score}/100
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-slate-950/40 min-h-[450px] flex items-center justify-center">
                <ChainGraph nodes={chainData.nodes || []} edges={chainData.edges || []} onSelectNode={setSelectedNode} selectedNode={selectedNode} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed bg-slate-900/20 border-slate-800 text-center rounded-2xl py-24">
              <CardContent className="flex flex-col items-center justify-center text-slate-400">
                <Server className="w-12 h-12 text-slate-800 mb-4 animate-pulse" />
                <h3 className="font-semibold text-base text-slate-200 mb-1">Awaiting Dependency Matrix Render</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">Map an active auditing session workspace and choose a target language environment to observe pivoting behaviors.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="xl:col-span-4 space-y-4">
          {chainData?.summary && (
            <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="pb-2 border-b border-slate-800/40 bg-slate-950/20">
                <CardTitle className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Language-Specific Chaining Narrative</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/40 p-3 border border-slate-800/50 rounded-xl">{chainData.summary}</p>
              </CardContent>
            </Card>
          )}

          {selectedNode && (
            <Card className="bg-slate-900 border-blue-500/20 text-white shadow-xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
              <CardHeader className="pb-2 border-b border-slate-800/40 bg-slate-950/20">
                <CardTitle className="text-xs font-mono font-medium text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Node properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <SeverityBadge severity={selectedNode.severity} />
                  <Badge className="bg-slate-950 text-slate-400 border border-slate-800 font-mono text-[10px]">Layer: {selectedNode.layer?.toUpperCase()}</Badge>
                </div>
                <p className="text-xs font-bold text-white font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">{selectedNode.title}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}