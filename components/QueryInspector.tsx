import React, { useState, useEffect } from 'react';
import { Play, Download, Copy, Trash2, Database, AlertCircle, Search, X } from 'lucide-react';
import { SalesforceSession, executeSOQL } from '../services/salesforceService';

interface QueryInspectorProps {
  session: SalesforceSession | null;
  onClose?: () => void;
  onAnalyze?: (query: string) => void;
  onViewRecord?: (record: any, objectType: string) => void;
}

const QueryInspector: React.FC<QueryInspectorProps> = ({ session, onClose, onAnalyze, onViewRecord }) => {
  const [query, setQuery] = useState('SELECT Id, Name, CreatedDate FROM Account ORDER BY CreatedDate DESC LIMIT 10');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; value: string; field: string } | null>(null);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
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
    
    // Get headers excluding 'attributes'
    const headers = getHeaders();
    
    const csvContent = [
      headers.join(','),
      ...results.map(row => 
        headers.map(header => {
            const val = getNestedValue(row, header);
            // Handle strings with commas or quotes
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
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

  // Helper to extract keys recursively, excluding 'attributes'
  const getHeaders = (): string[] => {
      if (results.length === 0) return [];
      
      const keys = new Set<string>();
      
      // Look at first 5 records to guess schema if sparse
      results.slice(0, 5).forEach(row => {
          Object.keys(row).forEach(k => {
              if (k !== 'attributes') {
                  if (typeof row[k] === 'object' && row[k] !== null) {
                      // flatten one level for relationships like Account.Name
                       Object.keys(row[k]).forEach(subK => {
                           if (subK !== 'attributes') {
                               keys.add(`${k}.${subK}`);
                           }
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

  // Helper to infer object type from query
  const getObjectTypeFromQuery = () => {
      const match = query.match(/FROM\s+([a-zA-Z0-9__]+)/i);
      return match ? match[1] : 'Record';
  };

  const handleCellContextMenu = (e: React.MouseEvent, value: any, header: string) => {
    if (onAnalyze) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            value: String(value),
            field: header
        });
    }
  };

  const handleAnalyzeClick = () => {
      if (contextMenu && onAnalyze) {
          const objectType = getObjectTypeFromQuery();
          const isIdField = contextMenu.field.toLowerCase() === 'id' || contextMenu.field.toLowerCase().endsWith('id');
          
          let prompt = '';
          if (isIdField) {
               prompt = `Analyze record ${contextMenu.value} (Type: ${objectType}). Identify its dependencies and potential impact of changes.`;
          } else {
               prompt = `Analyze the value "${contextMenu.value}" for the field "${contextMenu.field}" on the ${objectType} object. Explain its significance in the context of org metadata and dependencies.`;
          }
          
          onAnalyze(prompt);
          setContextMenu(null);
      }
  };

  const headers = getHeaders();

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
        {/* Editor Section */}
        <div className="bg-white p-4 border-b border-gray-200 shadow-sm shrink-0">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Database className="w-4 h-4 text-sf-blue" />
                    SOQL Editor
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setQuery('')}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                        title="Clear Query"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-24 p-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue focus:border-transparent resize-none bg-gray-50"
                placeholder="SELECT Id, Name FROM Account..."
                spellCheck={false}
            />

            <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-gray-400">
                    {loading ? 'Executing...' : `${results.length} record(s) found`}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExecute}
                        disabled={loading || !session}
                        className="bg-sf-blue text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Run Query
                    </button>
                </div>
            </div>
            
            {error && (
                <div className="mt-3 bg-red-50 text-red-700 px-3 py-2 rounded text-xs flex items-start gap-2 border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-mono">{error}</span>
                </div>
            )}
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            {results.length > 0 && (
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-end gap-2 shrink-0">
                     <button 
                        onClick={handleCopy}
                        className="text-xs bg-white border border-gray-300 px-3 py-1 rounded text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                     >
                        <Copy className="w-3 h-3" /> Copy JSON
                     </button>
                     <button 
                        onClick={handleExportCSV}
                        className="text-xs bg-white border border-gray-300 px-3 py-1 rounded text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                     >
                        <Download className="w-3 h-3" /> Export CSV
                     </button>
                </div>
            )}
            
            <div className="flex-1 overflow-auto custom-scrollbar bg-white">
                {results.length > 0 ? (
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-2 border-b border-gray-200 font-semibold text-gray-600 w-12 text-center">#</th>
                                {headers.map(h => (
                                    <th key={h} className="p-2 border-b border-gray-200 font-semibold text-gray-600 whitespace-nowrap border-l border-gray-100">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/50 group border-b border-gray-100">
                                    <td className="p-2 text-gray-400 text-center bg-white group-hover:bg-blue-50/50">{idx + 1}</td>
                                    {headers.map(h => {
                                        const val = getNestedValue(row, h);
                                        const valStr = String(val);
                                        const isId = h.toLowerCase() === 'id' || h.toLowerCase().endsWith('id');
                                        const looksLikeId = /^[a-zA-Z0-9]{15,18}$/.test(valStr);
                                        
                                        return (
                                            <td 
                                                key={h} 
                                                className={`p-2 font-mono whitespace-nowrap border-l border-gray-100 max-w-[200px] truncate cursor-context-menu ${isId && looksLikeId ? 'text-sf-blue hover:underline cursor-pointer' : 'text-gray-800'}`} 
                                                title={valStr}
                                                onContextMenu={(e) => handleCellContextMenu(e, val, h)}
                                                onClick={() => {
                                                    if (isId && looksLikeId && onViewRecord) {
                                                        onViewRecord(row, getObjectTypeFromQuery());
                                                    }
                                                }}
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
                            <Database className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm">Run a query to see results here</p>
                        </div>
                    )
                )}
            </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
            <div 
                className="fixed z-[100] bg-white border border-gray-200 shadow-xl rounded-md py-1 w-60 animate-in fade-in zoom-in-95 duration-100"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider">
                    {contextMenu.field}: {contextMenu.value}
                </div>
                <button 
                    onClick={handleAnalyzeClick}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-sf-light hover:text-sf-blue flex items-center gap-2 transition-colors"
                >
                    <Search className="w-4 h-4" />
                    Analyze with FlowSense
                </button>
            </div>
        )}
    </div>
  );
};

export default QueryInspector;