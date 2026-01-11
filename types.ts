export enum AppView {
  TUTORIAL = 'TUTORIAL',
  LOGIN = 'LOGIN',
  SCANNING = 'SCANNING',
  DASHBOARD = 'DASHBOARD',
  IMPACT_ANALYSIS = 'IMPACT_ANALYSIS'
}

export interface GraphNode {
  id: string;
  group: string; // Dynamic group type
  label: string;
  val: number; // For radius size
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
  type: 'reference' | 'update' | 'trigger' | 'dependency';
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