import { GoogleGenAI } from "@google/genai";
import { MOCK_GRAPH_DATA } from "../constants";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const getMockResponse = (message: string): string => {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('execution order') || lowerMsg.includes('account update')) {
    return `**Execution Order Analysis for Account Update:**

1. **Before Triggers**: \`Acc_Before_Update\` (Checks data integrity)
2. **Before-Save Flows**: \`Account_Standardization_Flow\`
3. **Validation Rules**: \`Close_Date_Rule\` (Active)
4. **After-Save Flows**: \`Update_Opp_Amount\` (Updates related Opportunities)
5. **After Triggers**: \`Acc_After_Update\` (Syncs to ERP)
6. **Assignment Rules**: None active

**Impact Note**: The \`Acc_After_Update\` trigger consumes 40% of the transaction limit due to the sync operation. Consider moving this to an asynchronous path if volume increases.`;
  }

  if (lowerMsg.includes('opportunity amount') || lowerMsg.includes('impact')) {
    return `**Impact Analysis: Opportunity Amount Field**

Modifying or deleting this field will cause **3 Breaking Changes**:

1. **Flow**: \`Update_Opp_Amount\` - Directly references this field for calculation.
2. **Trigger**: \`Opp_Stage_Change\` - Checks amount threshold before allowing stage progression.
3. **Report**: \`Quarterly_Revenue_Pipeline\` - This field is a grouping column.

**Recommendation**: Deprecate the field first by removing it from page layouts before hard deletion.`;
  }

  if (lowerMsg.includes('validation rule')) {
    return `**Validation Rule Analysis: Close_Date_Rule**

**Error Condition**: \`ISCHANGED(CloseDate) && CloseDate < TODAY() && NOT($Permission.Bypass_Rules)\`

**Why it fails**: This rule prevents backdating Opportunities. It is failing because your update tries to set \`CloseDate\` to yesterday.

**Dependencies**:
- Referenced by Flow: \`Opp_Stage_Change\`
- Impacted by: User Profile Permissions`;
  }

  return `Based on the metadata analysis, this component has dependencies on **${MOCK_GRAPH_DATA.nodes.slice(0, 3).map(n => n.label).join(', ')}**. 

I recommend running a full dependency check before making changes. The current implementation uses a mix of Flows and Triggers which may cause recursion if not carefully managed.`;
};

export const sendMessageToGemini = async (
  message: string, 
  history: { role: string; content: string }[]
): Promise<string> => {
  // Fallback if no API key is present
  if (!ai) {
    console.warn("Gemini API Key missing, using mock response.");
    return getMockResponse(message);
  }

  try {
    const context = `
      You are FlowSense AI, a Salesforce Architect assistant.
      You have access to the following org metadata graph:
      Nodes: ${MOCK_GRAPH_DATA.nodes.map(n => `${n.label} (${n.group})`).join(', ')}
      Links: ${MOCK_GRAPH_DATA.links.map(l => `${l.source} -> ${l.target} (${l.type})`).join(', ')}
      
      User Question: ${message}
      
      Provide a concise, professional answer. Explain dependencies clearly.
      If the user asks about impact, list specific components from the graph.
      Format with Markdown.
    `;

    // Use recommended model for text tasks
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: context }] }
      ]
    });

    return response.text || getMockResponse(message);
  } catch (error) {
    console.warn("Gemini API Error (falling back to mock):", error);
    // Fallback to mock response on error to ensure demo continuity
    return getMockResponse(message);
  }
};