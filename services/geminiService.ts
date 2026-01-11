import { GoogleGenAI } from "@google/genai";
import { GraphData } from "../types";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to format graph for prompt
const formatGraphForPrompt = (data: GraphData): string => {
    const nodes = data.nodes.slice(0, 50).map(n => `- ${n.label} (${n.group})`).join('\n');
    const links = data.links.slice(0, 50).map(l => {
        const source = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const target = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return `- ${source} -> ${target} (${l.type})`;
    }).join('\n');
    return `Nodes:\n${nodes}\n\nLinks:\n${links}`;
};

export const sendMessageToGemini = async (
  message: string, 
  history: { role: string; content: string }[],
  graphData: GraphData
): Promise<string> => {
  // Fallback if no API key is present
  if (!ai) {
    console.warn("Gemini API Key missing.");
    return "API Key missing. I cannot process your request without a valid API key.";
  }

  try {
    const graphContext = formatGraphForPrompt(graphData);
    
    const context = `
      You are FlowSense AI, a Salesforce Architect assistant.
      You have access to the following REAL metadata graph from the user's org:
      
      ${graphContext}
      
      User Question: ${message}
      
      Provide a concise, professional answer. 
      - Explain dependencies clearly based ONLY on the provided graph data.
      - If the graph data is empty or missing the component asked about, state that clearly.
      - If the user asks about impact, list specific components from the provided links.
      - Format with Markdown.
    `;

    // Use recommended model for text tasks
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: context }] }
      ]
    });

    return response.text || "I couldn't generate a response based on the current data.";
  } catch (error) {
    console.warn("Gemini API Error:", error);
    return "I encountered an error communicating with the AI service.";
  }
};