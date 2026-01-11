import { GraphData } from './types';

// Mock Data for the Graph Visualization
export const MOCK_GRAPH_DATA: GraphData = {
  nodes: [
    { id: 'Account', group: 'Object', label: 'Account', val: 20 },
    { id: 'Opportunity', group: 'Object', label: 'Opportunity', val: 20 },
    { id: 'Contact', group: 'Object', label: 'Contact', val: 15 },
    { id: 'Update_Opp_Amount', group: 'Flow', label: 'Update Opp Amount', val: 10 },
    { id: 'Acc_After_Update', group: 'Trigger', label: 'Acc After Update', val: 8 },
    { id: 'Close_Date_Rule', group: 'Field', label: 'Close Date Rule', val: 5 },
    { id: 'Opp_Stage_Change', group: 'Flow', label: 'Opp Stage Change', val: 10 },
    { id: 'Risk_Score', group: 'Field', label: 'Risk Score', val: 5 },
    { id: 'AnnualRevenue', group: 'Field', label: 'AnnualRevenue', val: 5 },
    { id: 'Sync_ERP', group: 'Trigger', label: 'Sync ERP', val: 8 },
  ],
  links: [
    { source: 'Account', target: 'Opportunity', type: 'reference' },
    { source: 'Account', target: 'Contact', type: 'reference' },
    { source: 'Update_Opp_Amount', target: 'Opportunity', type: 'update' },
    { source: 'Acc_After_Update', target: 'Account', type: 'trigger' },
    { source: 'Acc_After_Update', target: 'Risk_Score', type: 'update' },
    { source: 'AnnualRevenue', target: 'Risk_Score', type: 'reference' },
    { source: 'Opportunity', target: 'Opp_Stage_Change', type: 'trigger' },
    { source: 'Opp_Stage_Change', target: 'Close_Date_Rule', type: 'reference' },
    { source: 'Contact', target: 'Sync_ERP', type: 'trigger' },
  ]
};

export const MOCK_SUGGESTIONS = [
  "What automations touch Opportunity Amount?",
  "Why does the validation rule fail?",
  "Show execution order for Account updates"
];

export const TUTORIAL_STEPS = [
  {
    title: "Scan your org",
    description: "Instantly fetch metadata, Apex, Flows, and Objects to build a complete picture.",
    icon: "Scan"
  },
  {
    title: "Ask questions",
    description: "Use natural language to ask architect-level questions about your implementation.",
    icon: "MessageSquare"
  },
  {
    title: "See impact analysis",
    description: "Visualize dependencies and understand what breaks before you deploy.",
    icon: "Network"
  }
];