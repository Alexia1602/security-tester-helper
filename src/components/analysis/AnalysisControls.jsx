import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sword, ShieldCheck, Scan, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const modes = [
  {
    value: 'adversary',
    label: 'Adversary Mode',
    icon: Sword,
    description: 'Simulate attacker perspective',
    accent: 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20',
  },
  {
    value: 'defender',
    label: 'Defender Mode',
    icon: ShieldCheck,
    description: 'Blue team remediation',
    accent: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    value: 'audit',
    label: 'AI Code Audit',
    icon: Scan,
    description: 'Audit AI-generated code patterns',
    accent: 'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20',
  },
];

export default function AnalysisControls({ mode, setMode, language, setLanguage, onAnalyze, isAnalyzing }) {
  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2">
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-center',
              mode === m.value ? m.accent : 'border-border bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/50'
            )}
          >
            <m.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Language */}
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="bg-secondary/30 text-xs font-mono">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-800 text-white">
          {['javascript','python','java','csharp','php','go','typescript','rust','cpp','ruby'].map(l => (
            <SelectItem key={l} value={l} className="text-xs font-mono capitalize">{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Analyze button */}
      <Button
        className="w-full bg-blue-600 text-white hover:bg-blue-700 font-mono text-xs h-10 rounded-xl"
        onClick={onAnalyze}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Compiling Analysis Rules...
          </>
        ) : (
          <>
            {modes.find(m => m.value === mode)?.icon && React.createElement(modes.find(m => m.value === mode).icon, { className: 'w-4 h-4 mr-2' })}
            Execute Suite Analysis
          </>
        )}
      </Button>
    </div>
  );
}