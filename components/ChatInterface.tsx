import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, RotateCcw, Sparkles, Star, MessageSquare } from 'lucide-react';
import { ChatMessage, GraphNode } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { MOCK_SUGGESTIONS } from '../constants';

interface ChatInterfaceProps {
  initialQuery?: string;
  onSuggestionClick?: (query: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialQuery, onSuggestionClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'chat' | 'favorites'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedQueryRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (initialQuery && initialQuery !== lastProcessedQueryRef.current) {
        lastProcessedQueryRef.current = initialQuery;
        setView('chat'); // Switch back to chat if a new query comes in
        handleSend(initialQuery);
    }
  }, [initialQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === 'chat') scrollToBottom();
  }, [messages, view]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await sendMessageToGemini(text, messages.map(m => ({role: m.role, content: m.content})));

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleFavorite = (id: string) => {
    setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, isFavorite: !msg.isFavorite } : msg
    ));
  };

  const favoriteMessages = messages.filter(m => m.isFavorite);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
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
            <Star className="w-3 h-3" /> Favorites ({favoriteMessages.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {view === 'favorites' && favoriteMessages.length === 0 && (
            <div className="text-center text-gray-400 mt-10 text-sm">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No favorites saved yet.
            </div>
        )}

        {(view === 'chat' ? messages : favoriteMessages).map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm relative group ${
                msg.role === 'user'
                  ? 'bg-gray-100 text-gray-800 rounded-br-none'
                  : 'bg-sf-light text-gray-800 border border-blue-100 rounded-bl-none'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-1 text-xs text-sf-blue font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> FlowSense AI
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
                        onClick={() => toggleFavorite(msg.id)}
                        className={`text-xs flex items-center gap-1 transition-colors ${msg.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                        title="Save to Favorites"
                   >
                        <Star className="w-3 h-3" fill={msg.isFavorite ? "currentColor" : "none"} />
                   </button>
              </div>
            </div>
          </div>
        ))}
        
        {view === 'chat' && isLoading && (
           <div className="flex justify-start">
             <div className="bg-sf-light border border-blue-100 rounded-lg rounded-bl-none p-3 shadow-sm">
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
                placeholder="Ask a question about your metadata..."
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