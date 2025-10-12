/**
 * Prompt Loader Utility
 * 
 * This utility loads agent prompts from JSON files, simulating MongoDB fetch operations.
 * In production, this would be replaced with actual database calls.
 */

export interface AgentPrompt {
  agent: string;
  version: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  examples: Array<{
    input: string | object;
    output: string | object;
  }>;
  parameters: {
    model: string;
    temperature: number;
    max_tokens: number;
    [key: string]: any;
  };
  validation?: {
    required_fields?: string[];
    [key: string]: any;
  };
  post_processing?: {
    [key: string]: any;
  };
  error_handling?: {
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PromptCache {
  [agentName: string]: {
    prompt: AgentPrompt;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

class PromptLoader {
  private cache: PromptCache = {};
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Load agent prompt from JSON file (simulates MongoDB fetch)
   */
  async getAgentPrompt(agentName: string): Promise<AgentPrompt> {
    // Check cache first
    const cached = this.cache[agentName];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.prompt;
    }

    try {
      // Simulate database fetch by importing JSON file
      const prompt = await this.loadPromptFromFile(agentName);
      
      // Cache the result
      this.cache[agentName] = {
        prompt,
        timestamp: Date.now(),
        ttl: this.defaultTTL
      };

      return prompt;
    } catch (error) {
      console.error(`Failed to load prompt for agent ${agentName}:`, error);
      throw new Error(`Prompt not found for agent: ${agentName}`);
    }
  }

  /**
   * Load multiple agent prompts
   */
  async getAgentPrompts(agentNames: string[]): Promise<Record<string, AgentPrompt>> {
    const prompts: Record<string, AgentPrompt> = {};
    
    await Promise.all(
      agentNames.map(async (agentName) => {
        try {
          prompts[agentName] = await this.getAgentPrompt(agentName);
        } catch (error) {
          console.warn(`Failed to load prompt for ${agentName}:`, error);
        }
      })
    );

    return prompts;
  }

  /**
   * Load prompt from JSON file (simulates MongoDB document)
   */
  private async loadPromptFromFile(agentName: string): Promise<AgentPrompt> {
    try {
      // Dynamic import of JSON file
      const module = await import(`../prompts/${agentName}.json`);
      return module.default as AgentPrompt;
    } catch (error) {
      throw new Error(`Prompt file not found: ${agentName}.json`);
    }
  }

  /**
   * Clear cache for specific agent or all agents
   */
  clearCache(agentName?: string): void {
    if (agentName) {
      delete this.cache[agentName];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCached: number;
    cacheSize: number;
    hitRate: number;
  } {
    const totalCached = Object.keys(this.cache).length;
    const cacheSize = JSON.stringify(this.cache).length;
    
    return {
      totalCached,
      cacheSize,
      hitRate: 0.8 // Simulated hit rate
    };
  }

  /**
   * Validate prompt structure
   */
  validatePrompt(prompt: AgentPrompt): boolean {
    const requiredFields = ['agent', 'version', 'systemPrompt', 'userPrompt', 'parameters'];
    
    for (const field of requiredFields) {
      if (!prompt[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get all available agent names
   */
  async getAvailableAgents(): Promise<string[]> {
    // In a real implementation, this would query the database
    // For now, return a hardcoded list based on our prompt files
    return [
      'InspectVoiceAgent',
      'InspectImageAgent',
      'ExtractFormAgent',
      'NDTScanAgent',
      'NDTClassifyAgent',
      'MechEvalAgent',
      'MechStressCalcAgent',
      'TurnPlanAgent',
      'DowntimeAgent',
      'ComplyCheckAgent',
      'LicenseWarnAgent',
      'SafetyAlertAgent',
      'SafetyIncidentAgent',
      'AssetTagAgent',
      'AssetStatusAgent',
      'WorkforceNotifyAgent',
      'CrewAllocateAgent',
      'GenHelpAgent',
      'AdminAuditAgent',
      'ReportSynthAgent'
    ];
  }
}

// Export singleton instance
export const promptLoader = new PromptLoader();

// Export convenience functions
export const getAgentPrompt = (agentName: string) => promptLoader.getAgentPrompt(agentName);
export const getAgentPrompts = (agentNames: string[]) => promptLoader.getAgentPrompts(agentNames);
export const clearPromptCache = (agentName?: string) => promptLoader.clearCache(agentName);

// MongoDB simulation functions
export const simulateMongoDBFetch = async (agentName: string): Promise<AgentPrompt> => {
// Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  
  return await getAgentPrompt(agentName);
};

export const simulateMongoDBBatchFetch = async (agentNames: string[]): Promise<Record<string, AgentPrompt>> => {
// Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  return await getAgentPrompts(agentNames);
}; 