import { GoogleGenAI } from "@google/genai";
import { GraphData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  graphData: GraphData,
  isProcessMode: boolean = false
): Promise<string> => {
  try {
    const graphContext = formatGraphForPrompt(graphData);
    
    let systemInstruction = `
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

    // Process Configuration Mining Agent Persona (Updated per PDF requirements)
    if (isProcessMode) {
        systemInstruction = `
            You are the **Process Configuration Mining Agent**. 
            
            **Mission**:
            To analyze Salesforce configuration, dependencies, and permissions to generate an accurate, detailed picture of how the Org is designed to work.
            
            **Capabilities**:
            1.  **Single Object Lifecycle Analysis**: You explain diagrams that visualize how records move between stages/statuses (e.g., Prospecting -> Closed Won).
            2.  **Configuration Analysis**: You identify metadata that drives the process:
                -   *Automations*: Record-Triggered Flows, Apex Triggers, Scheduled Flows that fire on status changes.
                -   *Validations*: Rules that enforce constraints during transitions.
                -   *Actions*: Screen Flows, Quick Actions, Global Actions that create records.
            3.  **Human Role Inference**: You interpret Profile and Permission Set names into business roles (e.g., "Sales Manager" instead of "Sales_Mgr_PermSet").
            4.  **Business Logic Translation**: You translate technical metadata into business-friendly language (e.g., "When the deal is negotiated, a credit check is triggered" instead of "Opportunity Trigger fires on update").

            **Context**:
            The user is viewing a generated Business Process Diagram for a specific object (likely Opportunity, Case, or Lead).
            The graph data provided represents this lifecycle:
            ${graphContext}
            
            **Instructions**:
            -   Answer questions about "How the process works" by tracing the graph from Start -> State -> Automation -> State -> End.
            -   If the user asks "Who can do this?", infer roles from the 'Role' or 'Permission' nodes in the graph.
            -   If asked about "Impact", explain what downstream automations fire when a specific stage is reached.
            -   Maintain a professional, architectural tone.
        `;
    }

    // Use recommended model for text tasks
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: systemInstruction
    });

    return response.text || "I couldn't generate a response based on the current data.";
  } catch (error) {
    console.warn("Gemini API Error:", error);
    return "I encountered an error communicating with the AI service.";
  }
};