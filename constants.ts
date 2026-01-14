import { GraphData, ExecutionPath } from './types';

// Mock Data for the Graph Visualization
export const MOCK_GRAPH_DATA: GraphData = {
  nodes: [
    { id: 'Account', group: 'Object', label: 'Account', val: 20 },
    { id: 'Opportunity', group: 'Object', label: 'Opportunity', val: 20 },
    { id: 'Contact', group: 'Object', label: 'Contact', val: 15 },
    { id: 'Update_Opp_Amount', group: 'Flow', label: 'Update Opp Amount', val: 10 },
    { id: 'Acc_After_Update', group: 'Trigger', label: 'Acc After Update', val: 8 },
    { id: 'Close_Date_Rule', group: 'ValidationRule', label: 'Close Date Rule', val: 5 },
    { id: 'Opp_Stage_Change', group: 'Flow', label: 'Opp Stage Change', val: 10 },
    { id: 'Risk_Score', group: 'Field', label: 'Risk Score', val: 5 },
    { id: 'AnnualRevenue', group: 'Field', label: 'AnnualRevenue', val: 5 },
    { id: 'Sync_ERP', group: 'Trigger', label: 'Sync ERP', val: 8 },
    // Added based on user feedback
    { id: 'Checkin_Time__c', group: 'Field', label: 'Checkin Time', val: 5, metadata: { apiName: 'Checkin_Time__c', parentApiName: 'Opportunity' } },
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
    // Link for new field
    { source: 'Opportunity', target: 'Checkin_Time__c', type: 'reference' },
  ]
};

// Data representing a mined process flow (Opportunity Process)
// Structured with 'level' for left-to-right tree layout
export const MOCK_PROCESS_DATA: GraphData = {
    nodes: [
      { id: 'Start', group: 'Start', label: 'Start: Opportunity Created', val: 10, level: 0 },
      
      { id: 'Prospecting', group: 'State', label: 'Prospecting', val: 15, level: 1 },
      { id: 'Role_BDR', group: 'Role', label: 'Role: BDR', val: 8, level: 1 },
      
      { id: 'Qualification', group: 'State', label: 'Qualification', val: 15, level: 2 },
      { id: 'Validation_Budget', group: 'ValidationRule', label: 'VR: Budget Confirmed?', val: 8, level: 2 },
      
      { id: 'NeedsAnalysis', group: 'State', label: 'Needs Analysis', val: 15, level: 3 },
      { id: 'Flow_Update_Prob', group: 'Flow', label: 'Flow: Update Probability', val: 10, level: 3 },
      
      { id: 'ValueProp', group: 'State', label: 'Value Proposition', val: 15, level: 4 },
      
      { id: 'DecisionMakers', group: 'State', label: 'Id. Decision Makers', val: 15, level: 5 },
      
      { id: 'Proposal', group: 'State', label: 'Proposal/Price Quote', val: 15, level: 6 },
      { id: 'Action_Create_Quote', group: 'Action', label: 'Action: New Quote', val: 12, level: 6 },
      
      { id: 'Negotiation', group: 'State', label: 'Negotiation/Review', val: 15, level: 7 },
      { id: 'Trigger_Sync_ERP', group: 'Trigger', label: 'Apex: Sync to ERP', val: 10, level: 7 },
      
      { id: 'ClosedWon', group: 'State', label: 'Closed Won', val: 15, level: 8 },
      { id: 'Flow_PostClose', group: 'Flow', label: 'Flow: Post-Sale Emails', val: 10, level: 8 },
      
      { id: 'ClosedLost', group: 'State', label: 'Closed Lost', val: 15, level: 8 },
    ],
    links: [
      { source: 'Start', target: 'Prospecting', type: 'process_step' },
      { source: 'Role_BDR', target: 'Prospecting', type: 'reference' },
      
      { source: 'Prospecting', target: 'Qualification', type: 'process_step' },
      { source: 'Qualification', target: 'Validation_Budget', type: 'dependency' },
      
      { source: 'Qualification', target: 'NeedsAnalysis', type: 'process_step' },
      { source: 'NeedsAnalysis', target: 'Flow_Update_Prob', type: 'trigger' },
      
      { source: 'NeedsAnalysis', target: 'ValueProp', type: 'process_step' },
      { source: 'ValueProp', target: 'DecisionMakers', type: 'process_step' },
      { source: 'DecisionMakers', target: 'Proposal', type: 'process_step' },
      
      { source: 'Proposal', target: 'Action_Create_Quote', type: 'reference' },
      { source: 'Proposal', target: 'Negotiation', type: 'process_step' },
      
      { source: 'Negotiation', target: 'Trigger_Sync_ERP', type: 'trigger' },
      { source: 'Negotiation', target: 'ClosedWon', type: 'process_step' },
      { source: 'Negotiation', target: 'ClosedLost', type: 'process_step' },
      
      { source: 'ClosedWon', target: 'Flow_PostClose', type: 'trigger' },
    ]
};

export const MOCK_EXECUTION_PATH: ExecutionPath = {
    flowId: 'Update_Opp_Amount',
    flowName: 'Update Opp Amount',
    steps: [
        { 
            id: 'start', 
            label: 'Start (Record Trigger: Opportunity)', 
            type: 'Start', 
            description: 'Triggered when Opportunity is Updated.', 
            next: ['decision_1'],
            meta: { object: 'Opportunity', triggerType: 'After Update' }
        },
        { 
            id: 'decision_1', 
            label: 'Amount Changed?', 
            type: 'Decision', 
            description: 'Checks if Amount field has changed.', 
            next: ['assign_tier', 'end'],
            outcome: 'Yes',
            meta: { condition: 'ISCHANGED(Amount)' }
        },
        { 
            id: 'assign_tier', 
            label: 'Set Priority Tier', 
            type: 'Assignment', 
            description: 'Sets Priority based on Amount > 100k', 
            next: ['subflow_comm'],
            meta: { assignments: ['Priority__c = High'] }
        },
        { 
            id: 'subflow_comm', 
            label: 'Calc Commission Subflow', 
            type: 'SubFlow', 
            description: 'Calls sub-flow to calculate sales commission.', 
            next: ['apex_check'],
            meta: { flowName: 'Calculate_Commission_Master' }
        },
        { 
            id: 'apex_check', 
            label: 'Apex: Credit Check', 
            type: 'ApexAction', 
            description: 'Calls external API for credit check.', 
            next: ['update_rec'],
            issues: ['Potential CPU Timeout: Callout in loop risk if batched'],
            meta: { class: 'CreditCheckService', method: 'check' }
        },
        { 
            id: 'update_rec', 
            label: 'Update Opportunity', 
            type: 'RecordUpdate', 
            description: 'Commits changes to database.', 
            next: ['end'],
            issues: ['Recursion Risk: May re-trigger itself if criteria met'],
            meta: { fields: ['Priority__c', 'Commission__c'] }
        },
        { 
            id: 'end', 
            label: 'End', 
            type: 'End', 
            description: 'Flow execution complete.' 
        }
    ]
};

// Wizard Mock Options
export const WIZARD_OBJECTS = ['Opportunity', 'Case', 'Lead', 'Order', 'Quote'];
export const WIZARD_RECORD_TYPES = ['Master', 'Enterprise', 'SMB', 'Partner'];
export const WIZARD_PICKLISTS = ['StageName', 'Status', 'ForecastCategory', 'DeliveryStatus'];

export const TUTORIAL_STEPS = [
  {
    title: "Process Configuration Mining",
    description: "Auto-generate detailed Single Object Lifecycle Diagrams directly from your Salesforce configuration. We analyze dependencies to build an accurate picture of how your Org is designed to work, eliminating guesswork.",
    icon: "Scan"
  },
  {
    title: "AI-Powered Discovery",
    description: "Combine structured metadata querying with targeted AI interpretation. We infer human roles (e.g., Sales Manager) from permissions and translate technical automations into business-friendly process steps.",
    icon: "GitMerge"
  },
  {
    title: "Impact Analysis & Safety",
    description: "Enable process-aware change. Visualize exactly which Flows, Triggers, and Validation Rules fire at each stage of your lifecycle. Understand what breaks before you deploy changes.",
    icon: "Network"
  }
];