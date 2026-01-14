import React, { useState, useEffect, useRef } from 'react';
import { Play, Download, Copy, Trash2, Database, AlertCircle, Search, X, BarChart, ChevronRight } from 'lucide-react';
import { SalesforceSession, executeSOQL } from '../services/salesforceService';
import { GraphData } from '../types';

interface QueryInspectorProps {
  session: SalesforceSession | null;
  onClose?: () => void;
  onAnalyze?: (query: string) => void;
  onViewRecord?: (record: any, objectType: string) => void;
  initialQuery?: string;
  graphData?: GraphData; // Added for autocomplete logic
}

const QueryInspector: React.FC<QueryInspectorProps> = ({ session, onClose, onAnalyze, onViewRecord, initialQuery, graphData }) => {
  const [query, setQuery] = useState('SELECT Id, Name, CreatedDate FROM Account ORDER BY CreatedDate DESC LIMIT 10');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; value?: string; field: string; type: 'cell' | 'header' } | null>(null);
  
  // Autocomplete State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      if (initialQuery) {
          setQuery(initialQuery);
      }
  }, [initialQuery]);

  useEffect(() => {
    const handleClick = () => { setContextMenu(null); setShowSuggestions(false); };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleExecute = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const data = await executeSOQL(session, query);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = getHeaders();
    const csvContent = [
      headers.join(','),
      ...results.map(row => 
        headers.map(header => {
            const val = getNestedValue(row, header);
            if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
            return val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
  };

  // Helper to extract keys
  const getHeaders = (): string[] => {
      if (results.length === 0) return [];
      const keys = new Set<string>();
      results.slice(0, 5).forEach(row => {
          Object.keys(row).forEach(k => {
              if (k !== 'attributes') {
                  if (typeof row[k] === 'object' && row[k] !== null) {
                       Object.keys(row[k]).forEach(subK => {
                           if (subK !== 'attributes') keys.add(`${k}.${subK}`);
                       });
                  } else {
                      keys.add(k);
                  }
              }
          });
      });
      return Array.from(keys);
  };

  const getNestedValue = (obj: any, path: string) => {
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
          if (current === null || current === undefined) return '';
          current = current[part];
      }
      return current;
  };

  const getObjectTypeFromQuery = () => {
      const match = query.match(/FROM\s+([a-zA-Z0-9__]+)/i);
      return match ? match[1] : 'Record';
  };

  // --- Autocomplete Logic ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey && e.code === 'Space') {
          e.preventDefault();
          // User requested "all fields should be automatically added" functionality on Ctrl+Space
          insertAllFields();
      } else if (showSuggestions) {
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedIndex(prev => (prev + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === 'Enter') {
              e.preventDefault();
              insertSuggestion(suggestions[selectedIndex]);
          } else if (e.key === 'Escape') {
              setShowSuggestions(false);
          }
      }
  };

  const insertAllFields = () => {
      const targetObj = getObjectTypeFromQuery();
      let fields: string[] = [];

      // 1. Try to fetch fields from Graph Metadata
      if (graphData && graphData.nodes.length > 0) {
          fields = graphData.nodes
            .filter(n => (n.group === 'Field' || n.metadata?.type === 'Field') && n.metadata?.parentApiName === targetObj)
            .map(n => n.metadata?.apiName || n.label);
      }

      // 2. Fallback to common fields if no metadata available (or scanned)
      if (fields.length === 0) {
          fields = ['Id', 'Name', 'CreatedDate', 'LastModifiedDate', 'OwnerId'];
          if (targetObj === 'Account') fields.push('Type', 'Industry', 'AnnualRevenue', 'BillingCity', 'Phone', 'Website');
          else if (targetObj === 'Opportunity') fields.push('StageName', 'Amount', 'CloseDate', 'AccountId', 'Probability', 'Type');
          else if (targetObj === 'Contact') fields.push('Email', 'FirstName', 'LastName', 'AccountId', 'MobilePhone', 'Title');
          else if (targetObj === 'Case') fields.push('Status', 'Origin', 'Subject', 'Description', 'Priority', 'CaseNumber');
      }
      
      // 3. Construct the insertion string
      const fieldsStr = fields.sort().join(', ');
      
      // 4. Insert at cursor position
      if (textAreaRef.current) {
          const textarea = textAreaRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const currentVal = query;
          
          const before = currentVal.substring(0, start);
          const after = currentVal.substring(end);
          
          // Smart comma insertion: Add comma if previous char is not a space or comma and we are not at start of SELECT
          const trimmedBefore = before.trimEnd();
          const needsComma = trimmedBefore.length > 0 && 
                             !trimmedBefore.endsWith(',') && 
                             !trimmedBefore.toUpperCase().endsWith('SELECT');
                             
          const prefix = needsComma ? ', ' : '';
          
          const newQuery = before + prefix + fieldsStr + after;
          setQuery(newQuery);
          
          // Reset suggestions
          setShowSuggestions(false);
          
          // Refocus
          setTimeout(() => textarea.focus(), 0);
      }
  };

  // Keep original logic for typing-based autocomplete (not bound to Ctrl+Space anymore in this version, but logic kept for reference or future use)
  const triggerAutocomplete = () => {
      // ... logic preserved if needed, but Ctrl+Space now calls insertAllFields ...
  };

  const insertSuggestion = (field: string) => {
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const text = query;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const prefix = (before.trim().endsWith(',') || before.trim().endsWith('SELECT')) ? ' ' : ', ';
      const newQuery = before + prefix + field + after;
      setQuery(newQuery);
      setShowSuggestions(false);
      setTimeout(() => {
          textAreaRef.current?.focus();
          const newCursorPos = start + prefix.length + field.length;
          textAreaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
  };

  const handleCellContextMenu = (e: React.MouseEvent, value: any, header: string) => {
    if (onAnalyze) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, value: String(value), field: header, type: 'cell' });
    }
  };

  const handleHeaderContextMenu = (e: React.MouseEvent, header: string) => {
      if (onAnalyze) {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY, field: header, type: 'header' });
      }
  };

  const handleAnalyzeClick = () => {
      if (contextMenu && onAnalyze) {
          const objectType = getObjectTypeFromQuery();
          const isIdField = contextMenu.field.toLowerCase().endsWith('id');
          let prompt = contextMenu.type === 'cell' 
             ? (isIdField ? `Analyze record ${contextMenu.value} (Type: ${objectType}).` : `Analyze value "${contextMenu.value}" for "${contextMenu.field}" on ${objectType}.`)
             : `Analyze data distribution for column '${contextMenu.field}' in ${objectType} results.`;
          onAnalyze(prompt);
          setContextMenu(null);
      }
  };

  const headers = getHeaders();

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
        {/* Editor Section */}
        <div className="bg-white p-3 border-b border-gray-200 shadow-sm shrink-0 flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
                    <Database className="w-3.5 h-3.5 text-sf-blue" />
                    Query Editor
                </div>
                <div className="flex gap-2 text-xs">
                    <button onClick={() => setQuery('')} className="text-gray-400 hover:text-red-500 flex items-center gap-1 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"><Trash2 className="w-3 h-3" /> Clear</button>
                </div>
            </div>
            
            <div className="relative">
                <textarea
                    ref={textAreaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-24 p-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue focus:border-transparent resize-none bg-gray-50 leading-relaxed"
                    placeholder="SELECT Id, Name FROM Account..."
                    spellCheck={false}
                />
                
                {/* Autocomplete Dropdown - Hidden for now as Ctrl+Space does auto-fill, can be re-enabled for typing suggestions later */}
                {showSuggestions && (
                    <div className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto bg-white border border-gray-300 shadow-xl rounded-md z-50 flex flex-col">
                        <div className="bg-gray-100 px-2 py-1 text-[10px] text-gray-500 font-bold border-b border-gray-200">
                            SUGGESTED FIELDS ({suggestions.length})
                        </div>
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={suggestion}
                                onClick={() => insertSuggestion(suggestion)}
                                className={`text-left px-3 py-1.5 text-xs font-mono hover:bg-sf-light w-full flex items-center justify-between ${idx === selectedIndex ? 'bg-sf-blue text-white hover:bg-sf-blue' : 'text-gray-700'}`}
                            >
                                {suggestion}
                                {idx === selectedIndex && <ChevronRight className="w-3 h-3 opacity-50" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mt-1">
                <div className="flex gap-4 text-xs text-gray-500">
                     <span>{loading ? 'Executing...' : `${results.length} records`}</span>
                     <span className="hidden sm:inline opacity-60">Ctrl+Space to add all fields</span>
                </div>
                <button 
                    onClick={handleExecute}
                    disabled={loading || !session}
                    className="bg-sf-blue text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                >
                    <Play className="w-3 h-3 fill-current" />
                    Execute
                </button>
            </div>
            
            {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-xs flex items-start gap-2 border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-mono break-all whitespace-pre-wrap">{error}</span>
                </div>
            )}
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-white">
            {results.length > 0 && (
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex justify-end gap-2 shrink-0">
                     <button onClick={handleCopy} className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded text-gray-600 hover:bg-gray-50 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy JSON</button>
                     <button onClick={handleExportCSV} className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded text-gray-600 hover:bg-gray-50 flex items-center gap-1"><Download className="w-3 h-3" /> Export CSV</button>
                </div>
            )}
            
            <div className="flex-1 overflow-auto custom-scrollbar">
                {results.length > 0 ? (
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-2 border-b border-gray-200 font-semibold text-gray-600 w-10 text-center bg-gray-50">#</th>
                                {headers.map(h => (
                                    <th 
                                        key={h} 
                                        className="p-2 border-b border-gray-200 font-semibold text-gray-600 whitespace-nowrap border-l border-gray-200 cursor-context-menu hover:bg-gray-100 bg-gray-50"
                                        onContextMenu={(e) => handleHeaderContextMenu(e, h)}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50 group border-b border-gray-100">
                                    <td className="p-2 text-gray-400 text-center bg-white group-hover:bg-blue-50 font-mono text-[10px]">{idx + 1}</td>
                                    {headers.map(h => {
                                        const val = getNestedValue(row, h);
                                        const valStr = String(val);
                                        const isId = h.toLowerCase().endsWith('id');
                                        const looksLikeId = /^[a-zA-Z0-9]{15,18}$/.test(valStr);
                                        
                                        return (
                                            <td 
                                                key={h} 
                                                className={`p-2 font-mono whitespace-nowrap border-l border-gray-100 max-w-[200px] truncate cursor-context-menu ${isId && looksLikeId ? 'text-sf-blue hover:underline cursor-pointer' : 'text-gray-700'}`} 
                                                title={valStr}
                                                onContextMenu={(e) => handleCellContextMenu(e, val, h)}
                                                onClick={() => { if (isId && looksLikeId && onViewRecord) onViewRecord(row, getObjectTypeFromQuery()); }}
                                            >
                                                {valStr}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    !loading && !error && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <Database className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">No results to display</p>
                            <p className="text-xs text-gray-400">Run a query to see data here</p>
                        </div>
                    )
                )}
            </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
            <div 
                className="fixed z-[100] bg-white border border-gray-200 shadow-xl rounded-md py-1 w-64 animate-in fade-in zoom-in-95 duration-100"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider">
                    {contextMenu.type === 'header' ? `Column: ${contextMenu.field}` : `${contextMenu.field}: ${contextMenu.value}`}
                </div>
                <button onClick={handleAnalyzeClick} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-sf-light hover:text-sf-blue flex items-center gap-2 transition-colors">
                    {contextMenu.type === 'header' ? <BarChart className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                    {contextMenu.type === 'header' ? 'Analyze Column Stats' : 'Analyze with FlowSense'}
                </button>
            </div>
        )}
    </div>
  );
};

export default QueryInspector;