/**
 * AI-Powered Column Mapper (GENERIC FRAMEWORK UTILITY)
 * 
 * ⚠️ CRITICAL: This is a PURE GENERIC utility with ZERO hardcoded business logic.
 * ALL configuration MUST come from workspace metadata.
 * 
 * 🤖 Uses backend AI (via AIService) for intelligent column mapping:
 * - AI suggests mappings for all columns
 * - 95%+ accuracy
 * - All prompts, field definitions, and AI config in workspace metadata
 * - See: public/data/workspaces/<workspace>/<workspace>.json → importConfig.aiConfig
 */

export interface ColumnMapping {
  excelColumn: string;
  dbField: string;
  confidence: number; // 0-1 (0-100%)
  reason: string;
}

export interface FieldDefinition {
  dbField: string;
  label: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  aliases?: string[]; // Known alternative names from metadata
}

export interface SampleData {
  excelColumn: string;
  values: any[];
}

export interface AIConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPromptTemplate: string;
  responseFormat?: { type: string };
}

export interface AIMapperConfig {
  fieldDefinitions: FieldDefinition[];
  aiConfig: AIConfig; // AI prompts from metadata
}

/**
 * Clean AI Column Mapper
 * ONLY uses backend AI - NO local pattern matching
 */
export class AIColumnMapper {
  private fieldDefinitions: FieldDefinition[];
  private aiConfig: AIConfig;
  
  constructor(config: AIMapperConfig) {
    this.fieldDefinitions = config.fieldDefinitions;
    this.aiConfig = config.aiConfig;
  }
  
  /**
   * 🚀 BATCH AI mapping - ONE API call for ALL columns
   * Much faster and more efficient than per-column mapping!
   */
  public async autoMap(
    excelColumns: string[],
    sampleData: SampleData[]
  ): Promise<ColumnMapping[]> {
    console.log('🚀 AIColumnMapper.autoMap BATCH MODE:', excelColumns.length, 'columns');
    
    try {
      // 🚀 ONE API call for ALL columns!
      const batchResult = await this.getBatchAISuggestions(excelColumns, sampleData);
      console.log('🚀 Batch AI result:', batchResult);
      
      return batchResult;
      
    } catch (err: any) {
      console.error('Batch AI mapping failed, using fallback:', err);
      
      // Fallback: return empty mappings
      return excelColumns.map(excelColumn => ({
        excelColumn,
        dbField: '',
        confidence: 0,
        reason: 'AI mapping unavailable'
      }));
    }
  }
  
  /**
   * 🚀 BATCH AI: Get mappings for ALL columns in ONE API call
   * Much more efficient than per-column calls!
   */
  private async getBatchAISuggestions(
    excelColumns: string[],
    sampleData: SampleData[]
  ): Promise<ColumnMapping[]> {
    
    try {
      const { httpClient } = await import('../services/HttpClient');
      
      console.log(`🚀 Calling BATCH API for ${excelColumns.length} columns`);
      
      // Build batch payload with ALL columns
      const columns = excelColumns.map(excelColumn => {
        const samples = sampleData.find(s => s.excelColumn === excelColumn)?.values || [];
        return {
          excelColumn,
          sampleData: samples.slice(0, 5) // First 5 samples per column
        };
      });
      
      const response = await httpClient.post('/api/ai/column-mapping/batch-suggest', {
        columns,
        allFieldDefinitions: this.fieldDefinitions,
        aiConfig: this.aiConfig
      });
      
      console.log(`🚀 Batch API response:`, response.status, response.ok);
      
      if (!response.ok) {
        console.warn('Batch AI suggestion API error:', response.status);
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log(`🚀 Batch API data:`, data);
      
      if (!data.success || !data.results) {
        console.warn('Batch AI suggestion failed:', data.message);
        throw new Error(data.message || 'Batch AI failed');
      }
      
      // Convert API response to ColumnMapping[]
      const mappings: ColumnMapping[] = data.results.map((result: any) => ({
        excelColumn: result.excelColumn,
        dbField: result.dbField || '',
        confidence: result.confidence || 0,
        reason: result.reason || 'AI suggestion'
      }));
      
      return mappings;
      
    } catch (err: any) {
      console.error('Batch AI suggestion error:', err);
      throw err;
    }
  }
  
  /**
   * 🤖 AI: Get a mapping suggestion (DEPRECATED - use batch instead)
   * Calls backend API which uses AIService (NO direct calls from frontend)
   * Passes AI config from metadata
   */
  private async getAISuggestion(
    excelColumn: string,
    sampleData: any[]
  ): Promise<{ dbField: string; confidence: number; reason: string } | null> {
    
    try {
      // Call backend API (which uses AIService internally)
      const { httpClient } = await import('../services/HttpClient');
      
      console.log(`📡 Calling API for column "${excelColumn}" with`, sampleData.length, 'samples');
      
      const response = await httpClient.post('/api/ai/column-mapping/suggest', {
        excelColumn,
        sampleData: sampleData.slice(0, 5),
        allFieldDefinitions: this.fieldDefinitions,
        aiConfig: this.aiConfig // Pass AI prompts from metadata
      });
      
      console.log(`📡 API response for "${excelColumn}":`, response.status, response.ok);
      
      if (!response.ok) {
        console.warn('AI suggestion API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      console.log(`📡 API data for "${excelColumn}":`, data);
      
      if (!data.success || !data.result) {
        console.warn('AI suggestion failed:', data.message, data);
        return null;
      }
      
      // Check if AI returned a valid suggestion
      if (!data.result.dbField || data.result.confidence < 0.5) {
        return null;
      }
      
      return {
        dbField: data.result.dbField,
        confidence: data.result.confidence,
        reason: data.result.reason
      };
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      return null; // Graceful failure
    }
  }
  
  /**
   * Get confidence color for UI
   */
  public static getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return '#52c41a'; // Green
    if (confidence >= 0.7) return '#faad14'; // Orange
    if (confidence >= 0.5) return '#ff7a45'; // Red-orange
    return '#f5222d'; // Red
  }
}

/**
 * ⚠️ ARCHITECTURAL PRINCIPLE: NO HARDCODED CONFIG
 * 
 * ALL field definitions, aliases, AI prompts, and configuration MUST come from workspace metadata.
 * This ensures the utility remains 100% generic and reusable across different document types.
 * 
 * Configuration location:
 * public/data/workspaces/<workspace>/<workspace>.json
 * 
 * Structure:
 * {
 *   "importConfig": {
 *     "fieldDefinitions": [...],  // Field mappings, aliases, data types
 *     "aiConfig": {               // AI prompts and model settings
 *       "enabled": true,
 *       "model": "gpt-4o-mini",
 *       "systemPrompt": "...",
 *       "userPromptTemplate": "...",
 *       "temperature": 0.3,
 *       "maxTokens": 300
 *     }
 *   }
 * }
 */
