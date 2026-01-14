export enum AppView {
  TUTORIAL = 'TUTORIAL',
  LOGIN = 'LOGIN',
  SCANNING = 'SCANNING',
  DASHBOARD = 'DASHBOARD',
  IMPACT_ANALYSIS = 'IMPACT_ANALYSIS',
  PROCESS_MINING = 'PROCESS_MINING',
  PROCESS_DIAGRAM = 'PROCESS_DIAGRAM'
}

export interface GraphNode {
  id: string;
  group: string; // Dynamic group type
  label: string;
  val: number; // For radius size
  level?: number; // For Process Tree Layout
  metadata?: {
    apiName?: string;
    recordId?: string;
    parentApiName?: string;
    type?: string;
  };
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'reference' | 'update' | 'trigger' | 'dependency' | 'process_step';
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  relatedNodes?: string[];
  timestamp: Date;
  isFavorite?: boolean;
}

export interface ScanStep {
  id: string;
  label: string;
  status: 'pending' | 'scanning' | 'completed';
  count?: number;
}

export interface ExecutionStep {
  id: string;
  label: string;
  type: 'Start' | 'Decision' | 'Assignment' | 'RecordUpdate' | 'ApexAction' | 'SubFlow' | 'End' | 'Loop' | 'Action';
  description?: string;
  outcome?: string; 
  next?: string[]; // IDs of next steps
  issues?: string[]; // Potential conflicts
  meta?: any;
}

export interface ExecutionPath {
  flowId: string;
  flowName: string;
  steps: ExecutionStep[];
}

export interface ProcessMiningConfig {
    question: string;
    diagramName: string;
    selectedObject: string;
    recordType: string;
    picklistField: string;
}