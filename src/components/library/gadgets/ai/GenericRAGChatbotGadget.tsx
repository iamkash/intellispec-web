import React from 'react';
import { ValidationResult } from '../../core/base';
import { BaseGadget, GadgetConfig, GadgetContext, GadgetMetadata, GadgetSchema, GadgetType } from '../base';
import { GenericRAGChatbotComponent } from './GenericRAGChatbotComponent';

/**
 * Generic RAG Chatbot Gadget
 * 
 * A metadata-driven chatbot gadget that supports:
 * - GPT-5 Responses API with context retention
 * - OpenAI Realtime API for voice interactions
 * - Built-in tool calling for domain-specific functions
 * - RAG (Retrieval-Augmented Generation) with MongoDB Atlas Vector Search
 * - Tenant isolation and filter-aware context
 * 
 * Configuration is entirely driven by gadget metadata - no hardcoded business logic.
 * Can be used for any domain (VOC, Safety, Quality, etc.) by changing the configuration.
 */

export interface RAGChatbotConfig {
  // Chatbot behavior configuration
  chatbot: {
    welcomeMessage: string;
    placeholder: string;
    maxMessages?: number;
    enableHistory?: boolean;
    quickActions?: Array<{
      label: string;
      message: string;
      icon?: string;
    }>;
  };

  // RAG (Retrieval-Augmented Generation) configuration
  rag: {
    enabled: boolean;
    vectorStore: 'mongodb_atlas';
    embeddingModel: string;
    searchIndex: string;
    collection: string;
    embeddingDimensions: number;
    similarity: 'cosine' | 'euclidean' | 'dotProduct';
    fieldMappings: Record<string, string>; // Filter mappings for context-aware search
    filterFields: string[]; // Fields to include in filtering
    contextSources: string[]; // Document types to search
    semanticFields: string[]; // Fields to use for building context
  };

  // AI model configuration
  ai: {
    model: string;
    apiType?: 'responses' | 'standard';
    realtimeEnabled?: boolean;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    contextPrompt: string;
    responsesApi?: {
      store: boolean;
      contextRetention: boolean;
      previousResponseId?: string;
    };
    realtimeApi?: {
      enabled: boolean;
      voiceEnabled: boolean;
      model: string;
      voice: string;
      inputAudioFormat: string;
      outputAudioFormat: string;
      turnDetection: {
        type: string;
        threshold: number;
        prefixPaddingMs: number;
        silenceDurationMs: number;
      };
      tools: Array<{
        type: string;
        name: string;
        description: string;
        parameters: any;
      }>;
    };
  };

  // Security and tenant isolation
  security: {
    tenantIsolation: boolean;
    filterAware: boolean;
    dataEncryption?: boolean;
    auditLogging?: boolean;
    maxRequestsPerMinute?: number;
  };

  // API configuration
  api: {
    endpoint: string;
    method: string;
    headers: Record<string, string>;
    requestFormat: any;
  };

  // UI configuration
  ui: {
    theme: {
      primaryColor: string;
      backgroundColor: string;
      textColor: string;
      accentColor: string;
      mutedColor: string;
    };
    layout: {
      height: string;
      showHeader: boolean;
      showFooter: boolean;
      compactMode: boolean;
    };
    animations: {
      enabled: boolean;
      typingIndicator: boolean;
      messageTransitions: boolean;
    };
  };

  // Feature flags
  features: {
    contextRetention: boolean;
    filterIntegration: boolean;
    dataVisualization?: boolean;
    exportChat?: boolean;
    voiceInput?: boolean;
    voiceOutput?: boolean;
    realtimeAudio?: boolean;
    toolCalling?: boolean;
    multiLanguage?: boolean;
  };
}

export interface RAGChatbotGadgetProps {
  config: RAGChatbotConfig;
  context?: {
    tenantId: string;
    userId?: string;
    sessionId?: string;
    filters?: Record<string, any>;
  };
}

/**
 * Generic RAG Chatbot Gadget Class
 * Extends BaseGadget to integrate with the gadget registry system
 */
export class GenericRAGChatbotGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'rag-chatbot-gadget',
    name: 'Generic RAG Chatbot',
    description: 'AI-powered chatbot with RAG, voice capabilities, and tool calling',
    version: '1.0.0',
    author: 'IntelliSpec Framework',
    tags: ['ai', 'chatbot', 'rag', 'voice', 'tools'],
    gadgetType: GadgetType.INTERACTIVE,
    widgetTypes: ['GenericRAGChatbotComponent'],
    dependencies: []
  };

  schema: GadgetSchema = {
    type: 'object',
    required: ['chatbot', 'ai', 'api'],
    widgetSchemas: {},
    properties: {
      chatbot: {
        type: 'object',
        required: ['welcomeMessage', 'placeholder'],
        properties: {
          welcomeMessage: { type: 'string' },
          placeholder: { type: 'string' },
          maxMessages: { type: 'number' },
          enableHistory: { type: 'boolean' },
          quickActions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                message: { type: 'string' },
                icon: { type: 'string' }
              }
            }
          }
        }
      },
      rag: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          vectorStore: { type: 'string', enum: ['mongodb_atlas'] },
          embeddingModel: { type: 'string' },
          searchIndex: { type: 'string' },
          collection: { type: 'string' },
          embeddingDimensions: { type: 'number' },
          similarity: { type: 'string', enum: ['cosine', 'euclidean', 'dotProduct'] },
          fieldMappings: { type: 'object' },
          filterFields: { type: 'array', items: { type: 'string' } },
          contextSources: { type: 'array', items: { type: 'string' } },
          semanticFields: { type: 'array', items: { type: 'string' } }
        }
      },
      ai: {
        type: 'object',
        required: ['model', 'systemPrompt'],
        properties: {
          model: { type: 'string' },
          apiType: { type: 'string', enum: ['responses', 'standard'] },
          realtimeEnabled: { type: 'boolean' },
          temperature: { type: 'number' },
          maxTokens: { type: 'number' },
          systemPrompt: { type: 'string' },
          contextPrompt: { type: 'string' }
        }
      }
    }
  };

  /**
   * Validate the gadget configuration
   */
  private validateConfig(config: RAGChatbotConfig): void {
    
    if (!config) {
      throw new Error('RAG Chatbot configuration is required');
    }

    // Validate required sections
    if (!config.chatbot) {
      throw new Error('Chatbot configuration is required');
    }

    if (!config.ai) {
      throw new Error('AI configuration is required');
    }

    if (!config.api?.endpoint) {
      throw new Error('API endpoint is required');
    }

    // Validate RAG configuration if enabled
    if (config.rag?.enabled) {
      if (!config.rag.searchIndex) {
        throw new Error('RAG search index is required when RAG is enabled');
      }
      if (!config.rag.collection) {
        throw new Error('RAG collection is required when RAG is enabled');
      }
      if (!config.rag.semanticFields?.length) {
        throw new Error('RAG semantic fields are required when RAG is enabled');
      }
    }

    // Validate Realtime API configuration if enabled
    if (config.ai.realtimeApi?.enabled) {
      if (!config.ai.realtimeApi.model) {
        throw new Error('Realtime API model is required when realtime is enabled');
      }
      if (!config.ai.realtimeApi.tools?.length) {
        console.warn('No tools configured for Realtime API - tool calling will be disabled');
      }
    }
  }

  /**
   * Get required widgets for this gadget
   */
  getRequiredWidgets(): string[] {
    return ['GenericRAGChatbotComponent'];
  }

  /**
   * Validate gadget configuration
   */
  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];

    try {
      this.validateConfig(config as unknown as RAGChatbotConfig);
    } catch (error) {
      errors.push((error as Error).message);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get gadget metadata for registry
   */
  getMetadata() {
    return {
      type: 'rag-chatbot-gadget',
      name: 'Generic RAG Chatbot',
      description: 'AI-powered chatbot with RAG, voice capabilities, and tool calling',
      version: '1.0.0',
      author: 'IntelliSpec Framework',
      tags: ['ai', 'chatbot', 'rag', 'voice', 'tools'],
      configSchema: {
        type: 'object',
        required: ['chatbot', 'ai', 'api'],
        properties: {
          chatbot: {
            type: 'object',
            required: ['welcomeMessage', 'placeholder'],
            properties: {
              welcomeMessage: { type: 'string' },
              placeholder: { type: 'string' },
              maxMessages: { type: 'number' },
              enableHistory: { type: 'boolean' },
              quickActions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    message: { type: 'string' },
                    icon: { type: 'string' }
                  }
                }
              }
            }
          },
          rag: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              vectorStore: { type: 'string', enum: ['mongodb_atlas'] },
              embeddingModel: { type: 'string' },
              searchIndex: { type: 'string' },
              collection: { type: 'string' },
              embeddingDimensions: { type: 'number' },
              similarity: { type: 'string', enum: ['cosine', 'euclidean', 'dotProduct'] },
              fieldMappings: { type: 'object' },
              filterFields: { type: 'array', items: { type: 'string' } },
              contextSources: { type: 'array', items: { type: 'string' } },
              semanticFields: { type: 'array', items: { type: 'string' } }
            }
          },
          ai: {
            type: 'object',
            required: ['model', 'systemPrompt'],
            properties: {
              model: { type: 'string' },
              apiType: { type: 'string', enum: ['responses', 'standard'] },
              realtimeEnabled: { type: 'boolean' },
              temperature: { type: 'number' },
              maxTokens: { type: 'number' },
              systemPrompt: { type: 'string' },
              contextPrompt: { type: 'string' }
            }
          }
        }
      }
    };
  }

  /**
   * Render the gadget body
   */
  renderBody(config: GadgetConfig, context?: GadgetContext): React.ReactNode {
    // Extract the actual RAG configuration from the gadget config
    const ragConfig = (config as any)?.config || config as unknown as RAGChatbotConfig;
console.log('GenericRAGChatbotGadget - Extracted ragConfig:', ragConfig);
    
    return (
      <GenericRAGChatbotComponent
        gadgetConfig={ragConfig}
        context={{
          filters: (context as any)?.filters || {}
        }}
      />
    );
  }

  /**
   * Get widget layout (required by BaseGadget)
   */
  getWidgetLayout(): Record<string, any> {
    return {
      chatbot: {
        component: 'GenericRAGChatbotComponent',
        span: 24,
        height: '400px'
      }
    };
  }

  /**
   * Process data flow (required by BaseGadget)
   */
  processDataFlow(data: any): any {
    // RAG chatbot doesn't need data flow processing
    return data;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle gadget refresh
   */
  refresh(): void {
    // RAG chatbot doesn't need explicit refresh
}

  /**
   * Handle gadget resize
   */
  onResize(width: number, height: number): void {
    // Notify the chatbot component of size changes
    // This can be used to adjust the UI layout
}

  /**
   * Cleanup resources when gadget is unmounted
   */
  onGadgetUnmount(): void {
    // Clean up any active connections (WebSocket, audio streams, etc.)
}
}

export default GenericRAGChatbotGadget;
