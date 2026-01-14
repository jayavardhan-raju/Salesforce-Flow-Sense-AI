import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, RotateCcw, Sparkles, Star, MessageSquare, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { ChatMessage, GraphData } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatInterfaceProps {
  initialQuery?: { text: string; id: number } | null;
  onSuggestionClick?: (query: string) => void;
  graphData: GraphData;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    initialQuery, 
    onSuggestionClick, 
    graphData,
    isExpanded,
    onToggleExpand
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [favorites, setFavorites] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'favorites'>('chat');
  
  // Basic check to see if we are in process mode based on graph data context (simplification)
  // In a real app, this should be a prop, but here we infer it if nodes contain 'State' or 'Action' groups
  const isProcessMode = graphData.nodes.some(n => n.group === 'State' || n.group === 'Action');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load favorites from local storage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('flowSenseFavorites');
    if (savedFavorites) {
        try {
            setFavorites(JSON.parse(savedFavorites));
        } catch (e) {
            console.error("Failed to parse favorites", e);
        }
    }
  }, []);

  // Save favorites when updated
  useEffect(() => {
    localStorage.setItem('flowSenseFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Handle external query trigger
  useEffect(() => {
    if (initialQuery) {
        setView('chat'); 
        handleSend(initialQuery.text);
    }
  }, [initialQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === 'chat') scrollToBottom();
  }, [messages, view, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const responseText = await sendMessageToGemini(
            text, 
            messages.map(m => ({role: m.role, content: m.content})),
            graphData,
            isProcessMode
        );
        
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
        setError("Failed to get response from AI. Please check your connection or try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleFavorite = (msg: ChatMessage) => {
    setFavorites(prev => {
        const exists = prev.find(f => f.id === msg.id);
        if (exists) {
            return prev.filter(f => f.id !== msg.id);
        } else {
            return [...prev, { ...msg, isFavorite: true }];
        }
    });
    
    // Also update current messages state to reflect visual change if needed
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isFavorite: !m.isFavorite } : m));
  };

  const isFavorite = (id: string) => {
      return favorites.some(f => f.id === id);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Switcher & Header Controls */}
      <div className={`flex border-b border-gray-200 ${isProcessMode ? 'bg-purple-50' : 'bg-white'}`}>
        <button 
            onClick={() => setView('chat')}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-2 ${view === 'chat' ? 'text-sf-blue border-b-2 border-sf-blue' : 'text-gray-500 hover:text-gray-700'}`}
        >
            <MessageSquare className="w-3 h-3" /> Chat
        </button>
        <button 
            onClick={() => setView('favorites')}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-2 ${view === 'favorites' ? 'text-sf-blue border-b-2 border-sf-blue' : 'text-gray-500 hover:text-gray-700'}`}
        >
            <Star className="w-3 h-3" /> Favorites ({favorites.length})
        </button>
        
        {/* Expand Button in Header */}
        {onToggleExpand && (
            <button 
                onClick={onToggleExpand}
                className="px-3 border-l border-gray-100 text-gray-400 hover:text-sf-blue hover:bg-gray-50 transition-colors"
                title={isExpanded ? "Minimize Chat" : "Expand Chat"}
            >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Error Banner */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 absolute top-2 left-2 right-2 z-10 shadow-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
        )}

        {view === 'favorites' && favorites.length === 0 && (
            <div className="text-center text-gray-400 mt-10 text-sm flex flex-col items-center">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <Star className="w-6 h-6 text-gray-300" />
                </div>
                <p>No favorites saved yet.</p>
                <p className="text-xs mt-1">Star any message in chat to save it here.</p>
            </div>
        )}

        {(view === 'chat' ? messages : favorites).map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm relative group ${
                msg.role === 'user'
                  ? 'bg-gray-100 text-gray-800 rounded-br-none'
                  : isProcessMode && msg.role === 'assistant' 
                        ? 'bg-purple-50 text-gray-800 border border-purple-100 rounded-bl-none'
                        : 'bg-sf-light text-gray-800 border border-blue-100 rounded-bl-none'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className={`flex items-center gap-1 mb-1 text-xs font-bold uppercase tracking-wider ${isProcessMode ? 'text-purple-600' : 'text-sf-blue'}`}>
                  <Sparkles className="w-3 h-3" /> {isProcessMode ? 'Process Mining Agent' : 'Salesforce FlowSense AI'}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              
              {/* Action Bar */}
              <div className="mt-2 pt-2 border-t border-black/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {msg.role === 'assistant' && (
                    <>
                        <button className="text-xs flex items-center gap-1 text-gray-500 hover:text-sf-blue transition-colors">
                            <Copy className="w-3 h-3" />
                        </button>
                        <button className="text-xs flex items-center gap-1 text-gray-500 hover:text-sf-blue transition-colors">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    </>
                  )}
                   <button 
                        onClick={() => toggleFavorite(msg)}
                        className={`text-xs flex items-center gap-1 transition-colors ${isFavorite(msg.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                        title={isFavorite(msg.id) ? "Remove from Favorites" : "Save to Favorites"}
                   >
                        <Star className="w-3 h-3" fill={isFavorite(msg.id) ? "currentColor" : "none"} />
                   </button>
              </div>
            </div>
          </div>
        ))}
        
        {view === 'chat' && isLoading && (
           <div className="flex justify-start">
             <div className={`border border-blue-100 rounded-lg rounded-bl-none p-3 shadow-sm ${isProcessMode ? 'bg-purple-50' : 'bg-sf-light'}`}>
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-sf-blue/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-sf-blue/50 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-sf-blue/50 rounded-full animate-bounce delay-200"></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Only in Chat view) */}
      {view === 'chat' && (
        <div className="p-4 border-t border-gray-200 bg-white">
            <div className="relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isProcessMode ? "Ask about process steps, owners, or gaps..." : "Ask a question about your metadata..."}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue focus:border-transparent text-sm transition-shadow"
            />
            <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-sf-blue text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
            </div>
            <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400">AI can make mistakes. Verify critical dependencies.</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;