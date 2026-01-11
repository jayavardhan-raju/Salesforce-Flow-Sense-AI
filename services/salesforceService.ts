import { GraphData, GraphNode, GraphLink } from '../types';

// Interfaces for Salesforce API Responses
interface ToolingQueryResult {
  size: number;
  totalSize: number;
  done: boolean;
  records: any[];
}

export interface SalesforceCredentials {
  username: string;
  password: string;
  token: string;
  loginUrl: string;
}

export interface SalesforceSession {
  instanceUrl: string;
  accessToken: string;
}

// Helper to construct the SOAP Login Body
const getSoapBody = (creds: SalesforceCredentials) => `
  <env:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">
    <env:Body>
      <n1:login xmlns:n1="urn:partner.soap.sforce.com">
        <n1:username>${creds.username}</n1:username>
        <n1:password>${creds.password}${creds.token}</n1:password>
      </n1:login>
    </env:Body>
  </env:Envelope>
`;

// List of CORS proxies to try in order
const PROXIES = [
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.codetabs.com/v1/proxy?quest='
];

// Helper function to fetch with proxy fallback
const fetchWithProxy = async (targetUrl: string, options: RequestInit): Promise<Response> => {
  let lastError: any;

  for (const proxyBase of PROXIES) {
    try {
      // Construct Proxy URL
      let proxyUrl = '';
      if (proxyBase.includes('?quest=')) {
         proxyUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;
      } else {
         proxyUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;
      }

      const response = await fetch(proxyUrl, options);

      // If 403/404, it might be the proxy blocking or failing
      if (response.status === 403 || response.status === 404) {
         // Some proxies return 403/404 on failure, throw to try next
         throw new Error(`Proxy ${proxyBase} returned ${response.status}`);
      }

      return response;
    } catch (err) {
      console.warn(`Proxy ${proxyBase} failed:`, err);
      lastError = err;
      // Continue to next proxy
    }
  }
  throw lastError || new Error("All proxies failed");
};

export const loginToSalesforce = async (creds: SalesforceCredentials): Promise<SalesforceSession> => {
  try {
    const targetUrl = `${creds.loginUrl}/services/Soap/u/57.0`;

    // For login, we try to use the proxy
    const response = await fetchWithProxy(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'SOAPAction': 'login',
      },
      body: getSoapBody(creds)
    });

    const text = await response.text();
    
    // Parse response
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // Check for SOAP Fault
    const faultNode = xmlDoc.getElementsByTagName("faultstring")[0];
    if (faultNode) {
      const fault = faultNode.textContent || "Unknown Salesforce Error";
      const cleanFault = fault.replace(/^.*:/, ''); 
      throw new Error(cleanFault);
    }

    if (!response.ok) {
        throw new Error(`Connection Error: ${response.status} ${response.statusText}`);
    }

    const sessionId = xmlDoc.getElementsByTagName("sessionId")[0]?.textContent;
    const serverUrl = xmlDoc.getElementsByTagName("serverUrl")[0]?.textContent;

    if (!sessionId || !serverUrl) {
        throw new Error("Invalid response from Salesforce. Session ID not found.");
    }

    const instanceUrl = new URL(serverUrl).origin;

    return {
      accessToken: sessionId,
      instanceUrl: instanceUrl
    };

  } catch (error: any) {
    console.error("Salesforce Auth Error:", error);
    throw error;
  }
};

const queryTooling = async (session: SalesforceSession, query: string): Promise<ToolingQueryResult> => {
    const targetUrl = `${session.instanceUrl}/services/data/v57.0/tooling/query?q=${encodeURIComponent(query)}`;

    // GET requests usually don't need Content-Type, and X-Requested-With can block some proxies
    const res = await fetchWithProxy(targetUrl, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json'
        }
    });
    
    if (!res.ok) {
         const text = await res.text();
         try {
             const errJson = JSON.parse(text);
             if (Array.isArray(errJson) && errJson[0].message) {
                 throw new Error(errJson[0].message);
             }
         } catch(e) { /* ignore */ }
         throw new Error(`Query Failed: ${res.status} ${text.substring(0, 150)}`);
    }
    
    return res.json();
};

export const executeSOQL = async (session: SalesforceSession, query: string): Promise<any[]> => {
    // Standard Data API (not Tooling)
    const targetUrl = `${session.instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(query)}`;

    const res = await fetchWithProxy(targetUrl, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json'
        }
    });
    
    if (!res.ok) {
         const text = await res.text();
         try {
             const errJson = JSON.parse(text);
             if (Array.isArray(errJson) && errJson[0].message) {
                 throw new Error(errJson[0].message);
             }
         } catch(e) { /* ignore */ }
         throw new Error(`SOQL Error: ${text}`);
    }
    
    const json = await res.json();
    return json.records || [];
};

export const fetchOrgGraphData = async (session: SalesforceSession, onProgress: (msg: string) => void): Promise<GraphData> => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    try {
        // 1. Fetch Objects
        onProgress("Fetching Objects...");
        const objQuery = "SELECT QualifiedApiName, Label, KeyPrefix FROM EntityDefinition WHERE IsTriggerable = true ORDER BY QualifiedApiName LIMIT 1000";
        const objRes = await queryTooling(session, objQuery);
        const objects = objRes.records || [];
        
        objects.forEach((obj: any) => {
            nodes.push({ 
                id: obj.QualifiedApiName, 
                label: obj.QualifiedApiName, 
                group: 'Object', 
                val: 20,
                metadata: {
                    apiName: obj.QualifiedApiName,
                    type: 'Object'
                }
            });
        });

        // 2. Fetch Active Flows
        onProgress("Analyzing Flows...");
        const flowQuery = "SELECT Id, MasterLabel, ProcessType FROM Flow WHERE Status = 'Active' LIMIT 500";
        const flowRes = await queryTooling(session, flowQuery);
        const flows = flowRes.records || [];

        flows.forEach((flow: any) => {
            nodes.push({ 
                id: flow.Id, 
                label: flow.MasterLabel, 
                group: 'Flow', 
                val: 12,
                metadata: {
                    recordId: flow.Id,
                    type: 'Flow'
                }
            });
            if (objects.length > 0) {
                const matchedObj = objects.find((o: any) => flow.MasterLabel.includes(o.QualifiedApiName));
                if (matchedObj) {
                    links.push({ source: flow.Id, target: matchedObj.QualifiedApiName, type: 'update' });
                }
            }
        });

        // 3. Fetch Triggers
        onProgress("Mapping Triggers...");
        const trigRes = await queryTooling(session, "SELECT Id, Name, TableEnumOrId FROM ApexTrigger");
        const triggers = trigRes.records || [];

        triggers.forEach((trig: any) => {
            nodes.push({ 
                id: trig.Id, 
                label: trig.Name, 
                group: 'Trigger', 
                val: 10,
                metadata: {
                    recordId: trig.Id,
                    type: 'ApexTrigger'
                }
            });
            const objName = trig.TableEnumOrId;
            const targetObj = nodes.find(n => n.id === objName || n.id === objName + '__c');
            
            if (!targetObj) {
                 const standardId = objName;
                 if (!nodes.find(n => n.id === standardId)) {
                     nodes.push({ id: standardId, label: objName, group: 'Object', val: 20, metadata: { apiName: objName } });
                 }
                 links.push({ source: trig.Id, target: standardId, type: 'trigger' });
            } else {
                 links.push({ source: trig.Id, target: targetObj.id, type: 'trigger' });
            }
        });

        // 4. Validation Rules
        onProgress("Scanning Validation Rules...");
        const ruleQuery = "SELECT Id, ValidationName, EntityDefinition.QualifiedApiName FROM ValidationRule LIMIT 1000";
        const ruleRes = await queryTooling(session, ruleQuery);
        const rules = ruleRes.records || [];

        rules.forEach((rule: any) => {
            const parentObj = rule.EntityDefinition?.QualifiedApiName;
            nodes.push({ 
                id: rule.Id, 
                label: rule.ValidationName, 
                group: 'ValidationRule', // Changed from Field to ValidationRule for better grouping
                val: 8,
                metadata: {
                    recordId: rule.Id,
                    parentApiName: parentObj,
                    type: 'ValidationRule'
                } 
            }); 
            
            if (parentObj) {
                const parentNode = nodes.find(n => n.id === parentObj);
                if (parentNode) {
                    links.push({ source: parentNode.id, target: rule.Id, type: 'reference' });
                }
            }
        });

        // 5. Apex Classes
        onProgress("Scanning Apex Classes...");
        const classQuery = "SELECT Id, Name, Status FROM ApexClass WHERE Status = 'Active' AND NamespacePrefix = null LIMIT 500";
        const classRes = await queryTooling(session, classQuery);
        const classes = classRes.records || [];
        classes.forEach((cls: any) => {
             nodes.push({
                 id: cls.Id,
                 label: cls.Name,
                 group: 'ApexClass',
                 val: 12,
                 metadata: {
                     recordId: cls.Id,
                     apiName: cls.Name,
                     type: 'ApexClass'
                 }
             });
        });

        // 6. LWC Bundles
        onProgress("Scanning LWC Bundles...");
        const lwcQuery = "SELECT Id, MasterLabel FROM LightningComponentBundle WHERE NamespacePrefix = null LIMIT 200";
        const lwcRes = await queryTooling(session, lwcQuery);
        const lwcs = lwcRes.records || [];
        lwcs.forEach((lwc: any) => {
             nodes.push({
                 id: lwc.Id,
                 label: lwc.MasterLabel,
                 group: 'LWC',
                 val: 10,
                 metadata: {
                     recordId: lwc.Id,
                     apiName: lwc.MasterLabel,
                     type: 'LightningComponentBundle'
                 }
             });
        });

        // 7. Aura Components
        onProgress("Scanning Aura Components...");
        const auraQuery = "SELECT Id, MasterLabel FROM AuraDefinitionBundle WHERE NamespacePrefix = null LIMIT 200";
        const auraRes = await queryTooling(session, auraQuery);
        const auras = auraRes.records || [];
        auras.forEach((aura: any) => {
             nodes.push({
                 id: aura.Id,
                 label: aura.MasterLabel,
                 group: 'Aura',
                 val: 8,
                 metadata: {
                     recordId: aura.Id,
                     apiName: aura.MasterLabel,
                     type: 'AuraDefinitionBundle'
                 }
             });
        });
        
        // 8. Visualforce Pages
        onProgress("Scanning Visualforce Pages...");
        const pageQuery = "SELECT Id, Name FROM ApexPage WHERE NamespacePrefix = null LIMIT 200";
        const pageRes = await queryTooling(session, pageQuery);
        const pages = pageRes.records || [];
        pages.forEach((page: any) => {
             nodes.push({
                 id: page.Id,
                 label: page.Name,
                 group: 'Visualforce',
                 val: 8,
                 metadata: {
                     recordId: page.Id,
                     apiName: page.Name,
                     type: 'ApexPage'
                 }
             });
        });

        // 9. Batched Field Scan
        onProgress("Mapping Fields...");
        const relevantObjects = objects
            .filter((o: any) => o.QualifiedApiName.endsWith('__c') || ['Account','Contact','Opportunity','Lead','Case','User','Task','Event'].includes(o.QualifiedApiName))
            .slice(0, 50); 

        if (relevantObjects.length > 0) {
            const objNames = relevantObjects.map((o: any) => `'${o.QualifiedApiName}'`).join(',');
            const fieldQuery = `SELECT QualifiedApiName, Label, EntityDefinition.QualifiedApiName FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName IN (${objNames}) LIMIT 1000`;
            
            const fieldRes = await queryTooling(session, fieldQuery);
            const fields = fieldRes.records || [];
            
            fields.forEach((f: any) => {
                 const parentObjId = f.EntityDefinition?.QualifiedApiName;
                 if (parentObjId && nodes.find(n => n.id === parentObjId)) {
                    if (!nodes.find(n => n.id === f.QualifiedApiName)) {
                        nodes.push({
                            id: f.QualifiedApiName, 
                            label: f.Label,
                            group: 'Field',
                            val: 4,
                            metadata: {
                                apiName: f.QualifiedApiName,
                                parentApiName: parentObjId,
                                type: 'Field'
                            }
                        });
                        links.push({ source: parentObjId, target: f.QualifiedApiName, type: 'reference' });
                    }
                 }
            });
        }

    } catch (e: any) {
        console.error("Graph fetch failed", e);
        throw new Error(e.message || "Failed to fetch metadata. Please check your connection.");
    }

    return { nodes, links };
};