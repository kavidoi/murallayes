import { AuthService } from './authService';

export interface Document {
  id: string;
  title: string;
  type: 'policy' | 'sop' | 'guide' | 'template' | 'history';
  category: string;
  content: string;
  tags: string[];
  lastUpdated: string;
  author: string;
  version: string;
  views: number;
  rating: number;
  status: 'draft' | 'published' | 'archived';
  attachments?: Attachment[];
  relatedDocuments?: string[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface SearchResult {
  document: Document;
  relevance: number;
  snippet: string;
  highlights: string[];
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  status: 'draft' | 'review' | 'active' | 'archived';
  approvedBy: string;
  acknowledgments: number;
  totalEmployees: number;
  compliance: number;
  tags: string[];
  relatedSOPs: string[];
}

export interface SOP {
  id: string;
  title: string;
  process: string;
  description: string;
  steps: SOPStep[];
  lastUpdated: string;
  version: string;
  owner: string;
  reviewers: string[];
  status: 'draft' | 'review' | 'active' | 'archived';
  estimatedTime: string;
  frequency: string;
  complexity: 'low' | 'medium' | 'high';
  relatedPolicies: string[];
}

export interface SOPStep {
  id: string;
  title: string;
  description: string;
  owner: string;
  estimatedTime: string;
  dependencies: string[];
  tools: string[];
  checkpoints: string[];
}

function buildQuery(params: Record<string, any>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const KnowledgeService = {
  // Document operations
  async getAllDocuments(params: {
    type?: string;
    category?: string;
    status?: string;
    tags?: string[];
    take?: number;
    skip?: number;
  } = {}): Promise<Document[]> {
    return AuthService.apiCall<Document[]>(`/knowledge/documents${buildQuery(params)}`);
  },

  async getDocument(id: string): Promise<Document> {
    return AuthService.apiCall<Document>(`/knowledge/documents/${id}`);
  },

  async createDocument(data: Partial<Document>): Promise<Document> {
    return AuthService.apiCall<Document>('/knowledge/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    return AuthService.apiCall<Document>(`/knowledge/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(id: string): Promise<void> {
    return AuthService.apiCall<void>(`/knowledge/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // Search operations
  async searchDocuments(query: string, params: {
    type?: string;
    category?: string;
    tags?: string[];
    take?: number;
  } = {}): Promise<SearchResult[]> {
    return AuthService.apiCall<SearchResult[]>(`/knowledge/search${buildQuery({ ...params, q: query })}`);
  },

  async getPopularDocuments(take: number = 10): Promise<Document[]> {
    return AuthService.apiCall<Document[]>(`/knowledge/documents/popular${buildQuery({ take })}`);
  },

  async getRecentDocuments(take: number = 10): Promise<Document[]> {
    return AuthService.apiCall<Document[]>(`/knowledge/documents/recent${buildQuery({ take })}`);
  },

  async getRecommendedDocuments(userId: string, take: number = 5): Promise<Document[]> {
    return AuthService.apiCall<Document[]>(`/knowledge/documents/recommended/${userId}${buildQuery({ take })}`);
  },

  // Analytics
  async getKnowledgeAnalytics(params: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
  } = {}): Promise<{
    totalDocuments: number;
    totalViews: number;
    avgRating: number;
    topCategories: Array<{ category: string; count: number; views: number }>;
    searchTrends: Array<{ query: string; count: number; growth: number }>;
    userEngagement: Array<{ date: string; views: number; searches: number }>;
  }> {
    return AuthService.apiCall(`/knowledge/analytics${buildQuery(params)}`);
  },

  // Policy operations
  async getAllPolicies(params: {
    category?: string;
    status?: string;
    take?: number;
    skip?: number;
  } = {}): Promise<Policy[]> {
    return AuthService.apiCall<Policy[]>(`/knowledge/policies${buildQuery(params)}`);
  },

  async getPolicy(id: string): Promise<Policy> {
    return AuthService.apiCall<Policy>(`/knowledge/policies/${id}`);
  },

  async createPolicy(data: Partial<Policy>): Promise<Policy> {
    return AuthService.apiCall<Policy>('/knowledge/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updatePolicy(id: string, data: Partial<Policy>): Promise<Policy> {
    return AuthService.apiCall<Policy>(`/knowledge/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async acknowledgePolicy(id: string, userId: string, notes?: string): Promise<void> {
    return AuthService.apiCall<void>(`/knowledge/policies/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, notes }),
    });
  },

  async getPolicyCompliance(id: string): Promise<{
    totalEmployees: number;
    acknowledgedCount: number;
    complianceRate: number;
    pendingUsers: Array<{ id: string; name: string; department: string }>;
  }> {
    return AuthService.apiCall(`/knowledge/policies/${id}/compliance`);
  },

  // SOP operations
  async getAllSOPs(params: {
    process?: string;
    status?: string;
    complexity?: string;
    take?: number;
    skip?: number;
  } = {}): Promise<SOP[]> {
    return AuthService.apiCall<SOP[]>(`/knowledge/sops${buildQuery(params)}`);
  },

  async getSOP(id: string): Promise<SOP> {
    return AuthService.apiCall<SOP>(`/knowledge/sops/${id}`);
  },

  async createSOP(data: Partial<SOP>): Promise<SOP> {
    return AuthService.apiCall<SOP>('/knowledge/sops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateSOP(id: string, data: Partial<SOP>): Promise<SOP> {
    return AuthService.apiCall<SOP>(`/knowledge/sops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async executeSOPStep(sopId: string, stepId: string, data: {
    notes?: string;
    timeSpent?: number;
    completedBy: string;
  }): Promise<void> {
    return AuthService.apiCall<void>(`/knowledge/sops/${sopId}/steps/${stepId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getSOPExecutions(sopId: string, params: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  } = {}): Promise<Array<{
    id: string;
    executedBy: string;
    startedAt: string;
    completedAt?: string;
    status: 'in-progress' | 'completed' | 'failed';
    timeSpent: number;
    notes?: string;
  }>> {
    return AuthService.apiCall(`/knowledge/sops/${sopId}/executions${buildQuery(params)}`);
  },

  // File operations
  async uploadAttachment(file: File, documentId: string): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);

    return AuthService.apiCall<Attachment>('/knowledge/attachments', {
      method: 'POST',
      body: formData,
    });
  },

  async deleteAttachment(id: string): Promise<void> {
    return AuthService.apiCall<void>(`/knowledge/attachments/${id}`, {
      method: 'DELETE',
    });
  },

  // Rating and feedback
  async rateDocument(documentId: string, rating: number, feedback?: string): Promise<void> {
    return AuthService.apiCall<void>(`/knowledge/documents/${documentId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, feedback }),
    });
  },

  async getDocumentFeedback(documentId: string): Promise<Array<{
    id: string;
    rating: number;
    feedback?: string;
    createdBy: string;
    createdAt: string;
  }>> {
    return AuthService.apiCall(`/knowledge/documents/${documentId}/feedback`);
  },

  // Categories and tags
  async getCategories(): Promise<Array<{ name: string; count: number; description: string }>> {
    return AuthService.apiCall('/knowledge/categories');
  },

  async getTags(): Promise<Array<{ name: string; count: number; category?: string }>> {
    return AuthService.apiCall('/knowledge/tags');
  },

  // AI-powered features
  async getAISuggestions(params: {
    userId?: string;
    category?: string;
    type?: string;
  } = {}): Promise<{
    recommendedContent: Array<{ type: string; title: string; reason: string }>;
    missingContent: Array<{ area: string; suggestion: string; priority: 'high' | 'medium' | 'low' }>;
    outdatedContent: Array<{ documentId: string; title: string; lastUpdated: string; reason: string }>;
  }> {
    return AuthService.apiCall(`/knowledge/ai/suggestions${buildQuery(params)}`);
  },

  async getAIInsights(): Promise<{
    searchTrends: Array<{ query: string; growth: number; volume: number }>;
    contentGaps: Array<{ area: string; confidence: number; suggestedActions: string[] }>;
    usagePatterns: Array<{ pattern: string; description: string; impact: string }>;
    optimizationTips: Array<{ tip: string; expectedImpact: string; effort: 'low' | 'medium' | 'high' }>;
  }> {
    return AuthService.apiCall('/knowledge/ai/insights');
  },

  // Utility functions
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getDocumentIcon(type: string): string {
    switch (type) {
      case 'policy': return '📋';
      case 'sop': return '⚙️';
      case 'guide': return '📖';
      case 'template': return '📄';
      case 'history': return '📚';
      default: return '📄';
    }
  },

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
      case 'published': 
        return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'review': 
        return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      case 'draft': 
        return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'archived': 
        return 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
};