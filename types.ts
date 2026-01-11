export enum AppView {
  TUTORIAL = 'TUTORIAL',
  SCANNING = 'SCANNING',
  DASHBOARD = 'DASHBOARD',
  IMPACT_ANALYSIS = 'IMPACT_ANALYSIS'
}

export interface GraphNode {
  id: string;
  group: 'Object' | 'Flow' | 'Trigger' | 'Field';
  label: string;
  val: number; // For radius size
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'reference' | 'update' | 'trigger';
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