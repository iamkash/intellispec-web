/**
 * Unit Tests for Prompt Loader Utility
 * 
 * Tests the prompt loading functionality, caching, and error handling.
 */

import { 
  promptLoader, 
  getAgentPrompt, 
  getAgentPrompts, 
  clearPromptCache,
  simulateMongoDBFetch,
  simulateMongoDBBatchFetch,
  AgentPrompt 
} from './promptLoader';

// Mock the dynamic imports
jest.mock('../prompts/InspectVoiceAgent.json', () => ({
  default: {
    agent: 'InspectVoiceAgent',
    version: '1.0.0',
    description: 'Voice transcription agent',
    systemPrompt: 'You are an expert voice transcription agent...',
    userPrompt: 'Please transcribe the following voice recording...',
    examples: [
      {
        input: 'Audio recording of inspector...',
        output: 'Equipment ID: EQ-001...'
      }
    ],
    parameters: {
      model: 'whisper-1',
      temperature: 0.2,
      max_tokens: 1024
    }
  }
}), { virtual: true });

jest.mock('../prompts/InspectImageAgent.json', () => ({
  default: {
    agent: 'InspectImageAgent',
    version: '1.0.0',
    description: 'Image analysis agent',
    systemPrompt: 'You are an expert image analysis agent...',
    userPrompt: 'Analyze this inspection image...',
    examples: [],
    parameters: {
      model: 'gpt-4-vision-preview',
      temperature: 0.1,
      max_tokens: 2048
    }
  }
}), { virtual: true });

describe('PromptLoader', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearPromptCache();
  });

  describe('getAgentPrompt', () => {
    it('should load a valid agent prompt', async () => {
      const prompt = await getAgentPrompt('InspectVoiceAgent');
      
      expect(prompt).toBeDefined();
      expect(prompt.agent).toBe('InspectVoiceAgent');
      expect(prompt.version).toBe('1.0.0');
      expect(prompt.systemPrompt).toContain('expert voice transcription agent');
      expect(prompt.parameters.model).toBe('whisper-1');
    });

    it('should cache loaded prompts', async () => {
      // First load
      const prompt1 = await getAgentPrompt('InspectVoiceAgent');
      
      // Second load should use cache
      const prompt2 = await getAgentPrompt('InspectVoiceAgent');
      
      expect(prompt1).toEqual(prompt2);
      
      // Verify cache stats
      const stats = promptLoader.getCacheStats();
      expect(stats.totalCached).toBe(1);
    });

    it('should handle missing agent prompts', async () => {
      await expect(getAgentPrompt('NonExistentAgent')).rejects.toThrow(
        'Prompt not found for agent: NonExistentAgent'
      );
    });

    it('should validate prompt structure', async () => {
      const prompt = await getAgentPrompt('InspectVoiceAgent');
      const isValid = promptLoader.validatePrompt(prompt);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid prompt structure', () => {
      const invalidPrompt = {
        agent: 'TestAgent',
        // Missing required fields
      } as AgentPrompt;
      
      const isValid = promptLoader.validatePrompt(invalidPrompt);
      expect(isValid).toBe(false);
    });
  });

  describe('getAgentPrompts', () => {
    it('should load multiple agent prompts', async () => {
      const prompts = await getAgentPrompts(['InspectVoiceAgent', 'InspectImageAgent']);
      
      expect(prompts).toHaveProperty('InspectVoiceAgent');
      expect(prompts).toHaveProperty('InspectImageAgent');
      expect(prompts.InspectVoiceAgent.agent).toBe('InspectVoiceAgent');
      expect(prompts.InspectImageAgent.agent).toBe('InspectImageAgent');
    });

    it('should handle partial failures gracefully', async () => {
      const prompts = await getAgentPrompts(['InspectVoiceAgent', 'NonExistentAgent']);
      
      expect(prompts).toHaveProperty('InspectVoiceAgent');
      expect(prompts).not.toHaveProperty('NonExistentAgent');
    });

    it('should return empty object for all failed loads', async () => {
      const prompts = await getAgentPrompts(['NonExistentAgent1', 'NonExistentAgent2']);
      
      expect(Object.keys(prompts)).toHaveLength(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear specific agent cache', async () => {
      // Load agent to populate cache
      await getAgentPrompt('InspectVoiceAgent');
      
      // Verify cache has content
      let stats = promptLoader.getCacheStats();
      expect(stats.totalCached).toBe(1);
      
      // Clear specific agent
      clearPromptCache('InspectVoiceAgent');
      
      // Verify cache is cleared
      stats = promptLoader.getCacheStats();
      expect(stats.totalCached).toBe(0);
    });

    it('should clear all cache', async () => {
      // Load multiple agents
      await getAgentPrompt('InspectVoiceAgent');
      await getAgentPrompt('InspectImageAgent');
      
      // Verify cache has content
      let stats = promptLoader.getCacheStats();
      expect(stats.totalCached).toBe(2);
      
      // Clear all cache
      clearPromptCache();
      
      // Verify cache is cleared
      stats = promptLoader.getCacheStats();
      expect(stats.totalCached).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = promptLoader.getCacheStats();
      
      expect(stats).toHaveProperty('totalCached');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.totalCached).toBe('number');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('MongoDB Simulation', () => {
    it('should simulate MongoDB fetch with delay', async () => {
      const startTime = Date.now();
      
      const prompt = await simulateMongoDBFetch('InspectVoiceAgent');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(prompt).toBeDefined();
      expect(prompt.agent).toBe('InspectVoiceAgent');
      expect(duration).toBeGreaterThan(50); // Should have simulated delay
    });

    it('should simulate batch MongoDB fetch', async () => {
      const startTime = Date.now();
      
      const prompts = await simulateMongoDBBatchFetch(['InspectVoiceAgent', 'InspectImageAgent']);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(prompts).toHaveProperty('InspectVoiceAgent');
      expect(prompts).toHaveProperty('InspectImageAgent');
      expect(duration).toBeGreaterThan(100); // Should have simulated delay
    });
  });

  describe('Error Handling', () => {
    it('should handle import errors gracefully', async () => {
      // Mock a failed import
      jest.doMock('../prompts/FailedAgent.json', () => {
        throw new Error('Import failed');
      }, { virtual: true });
      
      await expect(getAgentPrompt('FailedAgent')).rejects.toThrow(
        'Prompt not found for agent: FailedAgent'
      );
    });

    it('should handle malformed JSON', async () => {
      // Mock malformed JSON
      jest.doMock('../prompts/MalformedAgent.json', () => ({
        default: 'invalid json structure'
      }), { virtual: true });
      
      await expect(getAgentPrompt('MalformedAgent')).rejects.toThrow(
        'Prompt not found for agent: MalformedAgent'
      );
    });
  });

  describe('Performance', () => {
    it('should use cache for repeated requests', async () => {
      const startTime = Date.now();
      
      // First request
      await getAgentPrompt('InspectVoiceAgent');
      const firstLoadTime = Date.now() - startTime;
      
      // Second request (should use cache)
      const cacheStartTime = Date.now();
      await getAgentPrompt('InspectVoiceAgent');
      const cacheLoadTime = Date.now() - cacheStartTime;
      
      // Cache should be faster
      expect(cacheLoadTime).toBeLessThan(firstLoadTime);
    });

    it('should handle concurrent requests', async () => {
      const promises = [
        getAgentPrompt('InspectVoiceAgent'),
        getAgentPrompt('InspectImageAgent'),
        getAgentPrompt('InspectVoiceAgent') // Should use cache
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results[0].agent).toBe('InspectVoiceAgent');
      expect(results[1].agent).toBe('InspectImageAgent');
      expect(results[2].agent).toBe('InspectVoiceAgent');
    });
  });

  describe('Available Agents', () => {
    it('should return list of available agents', async () => {
      const agents = await promptLoader.getAvailableAgents();
      
      expect(Array.isArray(agents)).toBe(true);
      expect(agents).toContain('InspectVoiceAgent');
      expect(agents).toContain('InspectImageAgent');
      expect(agents).toContain('ExtractFormAgent');
    });

    it('should include all expected agent types', async () => {
      const agents = await promptLoader.getAvailableAgents();
      
      // Check for different agent categories
      expect(agents.some(agent => agent.includes('Voice'))).toBe(true);
      expect(agents.some(agent => agent.includes('Image'))).toBe(true);
      expect(agents.some(agent => agent.includes('Form'))).toBe(true);
      expect(agents.some(agent => agent.includes('NDT'))).toBe(true);
      expect(agents.some(agent => agent.includes('Report'))).toBe(true);
    });
  });
}); 