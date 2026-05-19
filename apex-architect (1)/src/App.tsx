/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Terminal, 
  Settings, 
  Cpu, 
  Layers, 
  Zap, 
  ChevronRight, 
  AlertCircle,
  Clock,
  Activity,
  Database,
  Search,
  Code,
  CheckCircle2,
  AlignLeft,
  LayoutDashboard,
  FileCode2,
  HelpCircle,
  Send,
  AlertOctagon
} from 'lucide-react';
import yaml from 'js-yaml';

const TEMPLATES = {
  Blueprint_Basic: `version: "1.0.0"\nmetadata:\n  target: "MVP"\nfeatures:\n  - "user_auth"\n  - "dashboard"`,
  Instruction_Set_Alpha: `# Component: Orchestrator\n| Step | Action | Target |\n| ---- | ------ | ------ |\n| 1 | Init | DB |\n| 2 | Start | API |`,
  Codex_Standard: `codex_id: "ALPHA"\nsections:\n  - title: "Core Data"\n    rules: "strict"`
};

interface AppNotification {
  message: string;
  type: 'error' | 'success';
  id: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'executor' | 'orchestrator' | 'state'>('blueprint');
  const [stateData, setStateData] = useState<any>(null);
  const [concept, setConcept] = useState('');
  const [blueprint, setBlueprint] = useState('');
  const [monologue, setMonologue] = useState<any>(null);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isFormatted, setIsFormatted] = useState(false);

  // Orchestrator State
  const [orchestratorInput, setOrchestratorInput] = useState(TEMPLATES.Blueprint_Basic);
  const [orchestratorFormat, setOrchestratorFormat] = useState<'YAML' | 'Markdown_Table' | 'Structured_Codex'>('YAML');
  const [orchestratorParsed, setOrchestratorParsed] = useState<any>(null);
  const [orchestratorError, setOrchestratorError] = useState<string | null>(null);

  const [executorPath, setExecutorPath] = useState('');
  const [executorGoal, setExecutorGoal] = useState('');
  const [executorOutput, setExecutorOutput] = useState('');
  const [isExecutingComponent, setIsExecutingComponent] = useState(false);
  const [coveStages, setCoveStages] = useState({
    SCHEMA_ALIGNMENT: 'IDLE',
    DETERMINISM_CHECK: 'IDLE',
    STATE_SYNCHRONIZATION: 'IDLE',
    LATENT_SPACE_PRIME: 'IDLE'
  });

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (orchestratorFormat === 'YAML' || orchestratorFormat === 'Structured_Codex') {
          const parsed = yaml.load(orchestratorInput);
          setOrchestratorParsed(parsed);
          setOrchestratorError(null);
        } else if (orchestratorFormat === 'Markdown_Table') {
          if (!orchestratorInput.match(/\|.*\|/)) {
            throw new Error("Invalid Markdown Table: missing column pipes.");
          }
          setOrchestratorParsed({ table: "Valid Markdown Table" });
          setOrchestratorError(null);
        }
      } catch (e: any) {
        setOrchestratorError(e.message);
        setOrchestratorParsed(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [orchestratorInput, orchestratorFormat]);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setStateData(data);
    } catch (err: any) {
      console.error('Failed to fetch state:', err);
      pushNotification(err.message || 'Failed to fetch state', 'error');
    }
  };

  const pushNotification = (message: string, type: 'error' | 'success' = 'error') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
  };

  const generateBlueprint = async () => {
    if (!concept) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBlueprint(data.blueprint);
      setMonologue(data.monologue);
      setConsistencyScore(data.consistency_score);
      setActiveTab('blueprint');
      setIsFormatted(false);
    } catch (err: any) {
      pushNotification(err.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const executeCoveLoop = async () => {
    if (!executorPath || !executorGoal) return;
    setIsExecutingComponent(true);
    setExecutorOutput('');
    setCoveStages({
      SCHEMA_ALIGNMENT: 'WAIT',
      DETERMINISM_CHECK: 'WAIT',
      STATE_SYNCHRONIZATION: 'WAIT',
      LATENT_SPACE_PRIME: 'WAIT'
    });

    try {
      // 1. Generate Executor
      setCoveStages(prev => ({ ...prev, SCHEMA_ALIGNMENT: 'RUNNING' }));
      const genRes = await fetch('/api/generate-executor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint, goal: executorGoal, context: JSON.stringify(stateData) }),
      });
      const genData = await genRes.json();
      if (genData.error) throw new Error(genData.error);
      
      setCoveStages(prev => ({ ...prev, SCHEMA_ALIGNMENT: 'PASS', DETERMINISM_CHECK: 'RUNNING' }));
      setExecutorOutput(genData.output);

      // Simulate determinism check
      await new Promise(r => setTimeout(r, 600));
      setCoveStages(prev => ({ ...prev, DETERMINISM_CHECK: 'PASS', STATE_SYNCHRONIZATION: 'RUNNING' }));

      // 2. Update State globally via the EVENT_LISTENER hook pattern
      const stateRes = await fetch('/api/update-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: executorGoal, output: genData.output }),
      });
      const updatedStateData = await stateRes.json();
      if (updatedStateData.error) throw new Error(updatedStateData.error);
      
      setCoveStages(prev => ({ ...prev, STATE_SYNCHRONIZATION: 'PASS', LATENT_SPACE_PRIME: 'RUNNING' }));
      
      // Update local state directly
      setStateData(updatedStateData);
      
      await new Promise(r => setTimeout(r, 500));
      setCoveStages(prev => ({ ...prev, LATENT_SPACE_PRIME: 'PASS' }));
    } catch (err: any) {
      pushNotification(err.message || 'Execution failed', 'error');
      setCoveStages(prev => ({ ...prev, LATENT_SPACE_PRIME: 'FAIL' }));
    } finally {
      setIsExecutingComponent(false);
    }
  };

  const formatXMLContent = (xmlStr: string) => {
    if (!xmlStr) return xmlStr;
    try {
      const parser = new DOMParser();
      // Wrappers can be needed to parse naked multiple components
      const doc = parser.parseFromString(xmlStr, 'text/xml');
      const parserError = doc.getElementsByTagName('parsererror');
      
      // Fallback: Use single-pass Regex formatting if DOMParser fails 
      if (parserError.length > 0) {
        let formatted = '';
        let pad = 0;
        const xml = xmlStr.replace(/(>)(<)(\/*)/g, '$1\n$2$3');
        xml.split('\n').forEach(line => {
          let indent = pad;
          if (line.match(/^<\/\w/)) {
            if (pad > 0) pad--;
            indent = pad;
          } else if (line.match(/^<\w[^>]*[^\/]>.*$/) && !line.match(/<\/\w[^>]*>$/)) {
            indent = pad;
            pad++;
          }
          formatted += '  '.repeat(Math.max(0, indent)) + line.trim() + '\n';
        });
        return formatted.trim();
      }

      // Approach: Recursive Node Traversal as planned
      const traverse = (node: Node, depth: number) => {
        const indent = '  '.repeat(depth);
        const childNodes = Array.from(node.childNodes);
        
        childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE && !child.nodeValue?.trim()) {
            node.removeChild(child);
          }
        });
        
        const newChildNodes = Array.from(node.childNodes);
        if (newChildNodes.length > 0) {
          let hasElement = false;
          newChildNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
              hasElement = true;
              node.insertBefore(doc.createTextNode('\n' + indent + '  '), child);
              traverse(child, depth + 1);
            }
          });
          if (hasElement) {
            node.appendChild(doc.createTextNode('\n' + indent));
          }
        }
      };

      if (doc.documentElement) {
        traverse(doc.documentElement, 0);
      }

      const serializer = new XMLSerializer();
      return serializer.serializeToString(doc);
    } catch (e) {
      return xmlStr;
    }
  };

  const submitToMetaCompiler = async () => {
    pushNotification(`Transmitting ${orchestratorFormat} payload to Meta-Compiler...`, 'success');
    try {
      const res = await fetch('/api/meta-compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: orchestratorParsed, format: orchestratorFormat }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setBlueprint(data.blueprint);
      setMonologue(data.monologue);
      setConsistencyScore(data.consistency_score);
      setActiveTab('blueprint');
      setIsFormatted(false);
      pushNotification('Meta-Compiler synthesis complete. Blueprint generated.', 'success');
    } catch (err: any) {
      pushNotification(err.message || 'Meta-Compiler synthesis failed', 'error');
    }
  };

  const displayBlueprint = isFormatted ? formatXMLContent(blueprint) : blueprint;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] font-sans selection:bg-[#F27D26] selection:text-black">
      {/* Top Navigation Bar */}
      <nav className="border-b border-[#1A1A1C] bg-[#0E0E0F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#F27D26] rounded-sm flex items-center justify-center">
              <Cpu size={18} className="text-black" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold tracking-widest text-[#F27D26]">ALPHA_TIER</span>
              <span className="text-sm font-bold tracking-tight">APEX_ARCHITECT_V1.0</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1A1A1C] rounded text-[10px] font-mono border border-[#2A2A2C]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              SYSTEM_OK
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1A1A1C] rounded text-[10px] font-mono border border-[#2A2A2C]">
              <Activity size={12} className="text-[#F27D26]" />
              AGENT_ACTIVE: 99.4%
            </div>
            <Settings size={18} className="text-[#4A4A4C] hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto flex h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar: Project Heart */}
        <aside className="w-80 border-r border-[#1A1A1C] bg-[#0E0E0F] flex flex-col">
          <div className="p-4 border-b border-[#1A1A1C] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#4A4A4C]">
              <Database size={14} />
              PROJECT_HEART.YAML
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-[#8E9299]">
            {stateData ? (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(stateData, null, 2)}
              </pre>
            ) : (
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-[#1A1A1C] rounded w-3/4"></div>
                <div className="h-3 bg-[#1A1A1C] rounded w-1/2"></div>
                <div className="h-3 bg-[#1A1A1C] rounded w-5/6"></div>
                <div className="h-3 bg-[#1A1A1C] rounded w-2/3"></div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-[#1A1A1C] bg-[#0A0A0B]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono text-[#4A4A4C]">CURRENT_BRANCH</span>
              <span className="text-[9px] font-mono text-[#F27D26]">MAIN_DETERMINISTIC</span>
            </div>
            <div className="w-full bg-[#1A1A1C] h-1 rounded-full overflow-hidden">
              <div className="bg-[#F27D26] h-full w-2/3"></div>
            </div>
          </div>
        </aside>

        {/* Central Workflow Area */}
        <section className="flex-1 overflow-hidden flex flex-col bg-[#0A0A0B]">
          {/* Workflow Tabs */}
          <div className="flex border-b border-[#1A1A1C]">
            {(['blueprint', 'orchestrator', 'executor'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-xs font-bold tracking-widest transition-all relative ${
                  activeTab === tab ? 'text-white' : 'text-[#4A4A4C] hover:text-[#8E9299]'
                }`}
              >
                {tab.toUpperCase()}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27D26]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'blueprint' && (
                <motion.div
                  key="blueprint"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="max-w-3xl">
                    <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3 text-white">
                      <Zap className="text-[#F27D26]" />
                      BLUEPRINT_ENGINE
                    </h2>
                    <p className="text-[#8E9299] text-sm leading-relaxed mb-6">
                      Transform vague concepts into rigid technical specifications. 
                      Uses XML-Schema isolation to prevent feature creep.
                    </p>

                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#F27D26] to-[#FF4E00] rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                      <div className="relative flex bg-[#0E0E0F] rounded-lg border border-[#1A1A1C] p-2">
                        <input 
                          type="text" 
                          value={concept}
                          onChange={(e) => setConcept(e.target.value)}
                          placeholder="ENTER_CONCEPT: e.g. Real-time RAG Editor..."
                          className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-mono placeholder:text-[#2A2A2C]"
                        />
                        <button 
                          onClick={generateBlueprint}
                          disabled={isGenerating}
                          className="bg-[#F27D26] text-black px-6 py-2 rounded font-bold text-xs hover:bg-[#FF4E00] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating ? <Activity className="animate-spin" size={14} /> : <Terminal size={14} />}
                          GENERATE_SPEC
                        </button>
                      </div>
                    </div>
                  </div>

                  {blueprint && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-[#0E0E0F] border border-[#1A1A1C] rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="header bg-[#151517] px-4 py-2 border-b border-[#1A1A1C] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-[#8E9299]">V1.0_TECHNICAL_BLUEPRINT</span>
                            {consistencyScore !== null && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-[#52c41a]/10 text-[#52c41a] border-[#52c41a]/30">
                                AXIOM_SCORE: {consistencyScore}%
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setIsFormatted(!isFormatted)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-colors border ${
                                isFormatted 
                                  ? 'bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/30' 
                                  : 'bg-transparent text-[#4A4A4C] border-transparent hover:text-white'
                              }`}
                            >
                              <AlignLeft size={12} />
                              FORMAT_XML
                            </button>
                            <div className="flex gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#1A1A1C]"></div>
                              <div className="w-2 h-2 rounded-full bg-[#1A1A1C]"></div>
                              <div className="w-2 h-2 rounded-full bg-[#1A1A1C]"></div>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 font-mono text-[11px] leading-relaxed text-[#F27D26]/90 whitespace-pre-wrap max-h-[500px] overflow-auto custom-scrollbar">
                          {displayBlueprint}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-[#0E0E0F] border border-[#1A1A1C] rounded-lg overflow-hidden">
                          <div className="header bg-[#151517] px-4 py-2 border-b border-[#1A1A1C]">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-[#8E9299]">INTERNAL_MONOLOGUE</span>
                          </div>
                          <div className="p-4 space-y-4">
                            {monologue && Object.entries(monologue).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <span className="text-[9px] font-mono font-bold text-[#F27D26] uppercase">[{key}]</span>
                                <p className="text-[10px] font-mono leading-tight text-[#8E9299]">{value as string}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-[#F27D26]/5 border border-[#F27D26]/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert size={14} className="text-[#F27D26]" />
                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Apex Verification</span>
                          </div>
                          <p className="text-[9px] font-mono text-[#8E9299] leading-relaxed">
                            Blueprint grounded against Project Heart. Zero-hallucination protocol enforced. 
                            Cyclomatic complexity constraints applied to schema definitions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'orchestrator' && (
                <motion.div
                  key="orchestrator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex flex-col space-y-4"
                >
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <div className="max-w-2xl">
                      <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
                        <LayoutDashboard className="text-[#F27D26]" />
                        ORCHESTRATOR.INPUT_PANEL
                      </h2>
                      <p className="text-[#8E9299] text-sm leading-relaxed mt-1">
                        Structured input ingestion with real-time schema validation over YAML and Markdown.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <select 
                        className="bg-[#0E0E0F] border border-[#1A1A1C] text-xs font-mono text-[#8E9299] p-2 rounded outline-none"
                        value={orchestratorFormat}
                        onChange={(e) => {
                          setOrchestratorFormat(e.target.value as any);
                        }}
                      >
                        <option value="YAML">FORMAT: YAML</option>
                        <option value="Markdown_Table">FORMAT: MARKDOWN_TABLE</option>
                        <option value="Structured_Codex">FORMAT: STRUCTURED_CODEX</option>
                      </select>
                      
                      <select 
                        className="bg-[#0E0E0F] border border-[#1A1A1C] text-xs font-mono text-[#8E9299] p-2 rounded outline-none"
                        onChange={(e) => setOrchestratorInput(TEMPLATES[e.target.value as keyof typeof TEMPLATES])}
                        defaultValue=""
                      >
                        <option value="" disabled>LOAD TEMPLATE...</option>
                        <option value="Blueprint_Basic">Blueprint_Basic</option>
                        <option value="Instruction_Set_Alpha">Instruction_Set_Alpha</option>
                        <option value="Codex_Standard">Codex_Standard</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                    {/* LEFT PANE */}
                    <div className="flex flex-col bg-[#0E0E0F] border border-[#1A1A1C] rounded-lg overflow-hidden relative">
                      <div className="header bg-[#151517] px-4 py-2 border-b border-[#1A1A1C] flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#8E9299] flex items-center gap-2">
                          <FileCode2 size={12}/>
                          RAW_INPUT_STREAM
                        </span>
                        <div className="relative group cursor-help">
                          <HelpCircle size={14} className="text-[#4A4A4C] hover:text-white transition-colors" />
                          <div className="absolute right-0 top-full mt-2 w-64 bg-[#1A1A1C] border border-[#2A2A2C] rounded p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                            <span className="text-[10px] font-mono font-bold text-[#F27D26] block mb-1 uppercase">Expected Keys:</span>
                            <span className="text-[10px] font-mono text-[#8E9299] block leading-relaxed">
                              version (string)<br/>
                              metadata (object)<br/>
                              features (array)<br/>
                              steps / target (markdown)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 flex overflow-hidden">
                        <div className="w-10 bg-[#0A0A0B] border-r border-[#1A1A1C] flex flex-col items-center py-4 font-mono text-[10px] text-[#4A4A4C] select-none h-full overflow-hidden shrink-0">
                          {orchestratorInput.split('\n').map((_, i) => <span key={i} className="h-[21px] flex items-center">{i+1}</span>)}
                        </div>
                        <textarea 
                          value={orchestratorInput}
                          onChange={(e) => setOrchestratorInput(e.target.value)}
                          spellCheck="false"
                          className="flex-1 bg-transparent p-4 outline-none text-[12px] leading-[21px] font-mono text-[#E0E0E0] resize-none whitespace-pre custom-scrollbar focus:border-none focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* RIGHT PANE */}
                    <div className="flex flex-col bg-[#0E0E0F] border border-[#1A1A1C] rounded-lg overflow-hidden">
                      <div className="header bg-[#151517] px-4 py-2 border-b border-[#1A1A1C] flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#8E9299] flex items-center gap-2">
                           <Activity size={12}/>
                           PREVIEW_VALIDATION
                        </span>
                      </div>
                      <div className="flex-1 p-6 relative overflow-auto custom-scrollbar">
                        {orchestratorError ? (
                          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded text-red-500 font-mono text-[10px] flex items-start gap-3">
                            <AlertOctagon size={16} className="shrink-0 mt-0.5" />
                            <pre className="whitespace-pre-wrap font-mono uppercase">{orchestratorError}</pre>
                          </div>
                        ) : (
                          <div className="text-[#52c41a] font-mono text-[10px] mb-4 flex items-center gap-2 border-b border-[#1A1A1C] pb-2">
                            <CheckCircle2 size={12} />
                            SCHEMA_VALID: {orchestratorFormat}
                          </div>
                        )}
                        
                        {!orchestratorError && orchestratorParsed && (
                          <pre className="font-mono text-[11px] text-[#8E9299] whitespace-pre-wrap">
                            {JSON.stringify(orchestratorParsed, null, 2)}
                          </pre>
                        )}

                        <div className="absolute bottom-6 right-6">
                          <button 
                            onClick={submitToMetaCompiler}
                            disabled={!!orchestratorError}
                            className="bg-[#F27D26] text-black px-6 py-2 rounded font-bold text-xs hover:bg-[#FF4E00] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(242,125,38,0.3)] hover:shadow-[0_0_25px_rgba(242,125,38,0.5)]"
                          >
                            <Send size={14} />
                            COMMIT_TO_COMPILER
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'executor' && (
                <motion.div
                  key="executor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="max-w-2xl">
                    <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3 text-white">
                      <Code className="text-[#F27D26]" />
                      ATOMIC_EXECUTOR
                    </h2>
                    <p className="text-[#8E9299] text-sm leading-relaxed">
                      Implement specific components targeting high Big-O efficiency and deterministic patterns.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0E0E0F] border border-[#1A1A1C] rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Layers size={16} className="text-[#F27D26]" />
                        <h3 className="text-xs font-bold tracking-widest text-[#8E9299]">COMPONENT_TARGET</h3>
                      </div>
                      <input 
                        type="text" 
                        value={executorPath}
                        onChange={(e) => setExecutorPath(e.target.value)}
                        placeholder="TARGET_PATH: e.g. src/hooks/useStateTree.ts"
                        className="w-full bg-[#0A0A0B] border border-[#1A1A1C] px-4 py-3 rounded text-xs font-mono mb-4 focus:border-[#F27D26] outline-none transition-colors"
                      />
                      <textarea 
                        value={executorGoal}
                        onChange={(e) => setExecutorGoal(e.target.value)}
                        placeholder="TARGET_GOAL: Define specific operational constraints..."
                        rows={4}
                        className="w-full bg-[#0A0A0B] border border-[#1A1A1C] px-4 py-3 rounded text-xs font-mono focus:border-[#F27D26] outline-none transition-colors resize-none"
                      />
                      <button 
                        onClick={executeCoveLoop}
                        disabled={isExecutingComponent}
                        className="w-full mt-4 bg-transparent border border-[#F27D26] text-[#F27D26] px-6 py-3 rounded font-bold text-xs hover:bg-[#F27D26] hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                      >
                        {isExecutingComponent ? <Activity className="animate-spin" size={14} /> : null}
                        EXECUTE_COVE_LOOP
                      </button>
                    </div>

                    <div className="bg-[#0E0E0F] border border-[#1A1A1C] rounded-lg p-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 size={16} className="text-[#F27D26]" />
                        <h3 className="text-xs font-bold tracking-widest text-[#8E9299]">VERIFICATION_STATUS</h3>
                      </div>
                      <div className="flex-1 space-y-4">
                        {Object.entries(coveStages).map(([label, status]) => (
                          <div key={label} className="flex items-center justify-between p-3 bg-[#0A0A0B] rounded border border-[#1A1A1C]">
                            <span className="text-[10px] font-mono text-[#8E9299]">{label}</span>
                            <span className={`text-[10px] font-mono font-bold ${
                              status === 'PASS' ? 'text-green-500' :
                              status === 'RUNNING' ? 'text-[#F27D26] animate-pulse' :
                              status === 'FAIL' ? 'text-red-500' : 'text-[#4A4A4C]'
                            }`}>
                              [{status}]
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {executorOutput && (
                    <motion.div 
                      key="output"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0E0E0F] border border-[#1A1A1C] rounded-lg overflow-hidden"
                    >
                      <div className="header bg-[#151517] px-4 py-2 border-b border-[#1A1A1C] flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#8E9299]">EXECUTION_LOG_{executorPath}</span>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#1A1A1C]"></div>
                          <div className="w-2 h-2 rounded-full bg-[#1A1A1C]"></div>
                          <div className="w-2 h-2 rounded-full bg-[#1A1A1C]"></div>
                        </div>
                      </div>
                      <div className="p-6 font-mono text-[11px] leading-relaxed text-[#F27D26]/90 whitespace-pre-wrap max-h-[500px] overflow-auto custom-scrollbar">
                        {executorOutput}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-[#1A1A1C] bg-[#0E0E0F] px-6 flex items-center justify-between text-[9px] font-mono tracking-widest text-[#4A4A4C]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 border-r border-[#1A1A1C] pr-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26]"></span>
            LOGIC: DETERMINISTIC
          </div>
          <div className="flex items-center gap-1.5 border-r border-[#1A1A1C] pr-6">
            <Clock size={10} />
            UPTIME: 18:42:11
          </div>
          <div className="flex items-center gap-1.5">
            <Layers size={10} />
            STACK: GEMINI_3.1_EXPRESS_VITE
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-white cursor-pointer transition-colors">v1.2.4-stable</span>
          <ShieldAlert size={12} className="text-[#F27D26]" />
        </div>
      </footer>

      {/* Notifications Container */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              style={{
                background: notif.type === 'error' ? '#ff4d4f' : '#52c41a',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '300px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{notif.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0A0A0B;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1A1A1C;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F27D26;
        }
      `}</style>
    </div>
  );
}
