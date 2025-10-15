/**
 * AgentRegistry - Dynamic agent registration and creation
 *
 * Manages the registration of agent types and their instantiation
 * with metadata-driven configuration.
 */

const { logger } = require('../../core/Logger');
const AIService = require('../../core/AIService');

const generateWithAI = AIService.generateWithAI || (async () => '');

async function generateAgentCompletion(prompt, options = {}, context = {}) {
  if (typeof AIService.generateCompletion === 'function') {
    return AIService.generateCompletion(prompt, options, context);
  }

  const {
    model,
    temperature,
    max_tokens: maxTokens,
    maxTokens: camelMaxTokens,
    reasoning
  } = options;

  const aiConfig = {
    model: model || 'gpt-4o',
    temperature: temperature ?? 0.7,
    maxTokens: camelMaxTokens ?? maxTokens ?? 2000,
    systemPrompt: prompt
  };

  if (reasoning?.reasoningEffort) {
    aiConfig.reasoningEffort = reasoning.reasoningEffort;
  }

  if (reasoning?.textVerbosity) {
    aiConfig.textVerbosity = reasoning.textVerbosity;
  }

  return generateWithAI(aiConfig, {
    ...context,
    prompt
  });
}

class AgentRegistry {
  constructor() {
    this.agentTypes = new Map();
    this.agentInstances = new Map();
  }

  /**
   * Register an agent type
   * @param {string} type - Agent type identifier
   * @param {Function} AgentClass - Agent constructor function
   */
  registerAgent(type, AgentClass) {
this.agentTypes.set(type, AgentClass);
  }

  /**
   * Check if agent type is registered
   * @param {string} type - Agent type to check
   * @returns {boolean} True if registered
   */
  hasAgent(type) {
    return this.agentTypes.has(type);
  }

  /**
   * Create agent instance from definition
   * @param {Object} agentDefinition - Agent metadata definition
   * @returns {BaseAgent} Agent instance
   */
  createAgent(agentDefinition) {
    const { id, type, config = {} } = agentDefinition;
// First try to get registered agent class
    const AgentClass = this.agentTypes.get(type);

    if (AgentClass) {
      // Use existing hardcoded agent class
      const agent = new AgentClass(config);
      agent.id = id;
      return agent;
    }

    // If no hardcoded class found, create dynamic agent from metadata
const agent = this.createDynamicAgent(agentDefinition);

    // Cache instance for reuse if needed
    this.agentInstances.set(id, agent);

    return agent;
  }

  /**
   * Create dynamic agent from metadata (PURE METADATA-DRIVEN)
   * @param {Object} agentDefinition - Agent metadata definition
   * @returns {BaseAgent} Dynamic agent instance
   */
  createDynamicAgent(agentDefinition) {
    const { id, type, config = {} } = agentDefinition;

    // Import BaseAgent for dynamic agent creation
    const BaseAgent = require('./BaseAgent');

    // Create dynamic agent class that extends BaseAgent
    class DynamicAgent extends BaseAgent {
      constructor(config) {
        super(config);
        this.agentType = type;
        this.id = id;
        // Initialize memory for maintaining context between steps
        this.memory = {
          conversationHistory: [],
          stepData: {},
          persistentContext: {},
          metadata: {
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            totalInteractions: 0
          }
        };
      }

      // Memory management methods
      addToMemory(key, data) {
        this.memory.stepData[key] = data;
        this.memory.metadata.lastUpdated = new Date().toISOString();
        this.memory.metadata.totalInteractions++;
      }

      getFromMemory(key) {
        return this.memory.stepData[key];
      }

      addConversationEntry(role, content, step = 'unknown') {
        this.memory.conversationHistory.push({
          role,
          content,
          step,
          timestamp: new Date().toISOString()
        });
      }

      getConversationHistory() {
        return this.memory.conversationHistory;
      }

      getAllMemory() {
        return { ...this.memory };
      }

      async process(inputs) {
// Store inputs in memory for context
        this.addConversationEntry('system', `Processing inputs for ${this.agentType}`, 'agent-processing');
        this.addToMemory('lastInputs', inputs);

        // Get AI configuration from metadata
        const aiConfig = config.aiConfig || {};
        const model = aiConfig.model || 'gpt-5';
        const reasoningConfig = aiConfig.reasoningConfig || {};

        // Get analysis prompt from metadata
        const analysisPrompt = config.analysisPrompt || `Process inputs for ${this.agentType}`;

        // Extract data from Steps 1 and 2
        const voiceTranscript = inputs.voiceTranscript || inputs.transcription || '';
        const images = inputs.images || [];
        const imageUrls = inputs.imageUrls || [];
        const existingContext = this.getFromMemory('previousStepData') || {};

        logger.debug('Processing agent request', {
          agentType: this.agentType,
          hasVoice: !!voiceTranscript,
          imageCount: images.length,
          hasContext: Object.keys(existingContext).length > 0
        });

        // Build context from memory and current inputs
        const contextData = {
          voiceTranscript,
          images: imageUrls,
          previousAnalysis: existingContext,
          conversationHistory: this.getConversationHistory(),
          agentMemory: this.getAllMemory()
        };

        // ✅ METADATA-DRIVEN AI PROCESSING (NO HARDCODED LOGIC)
        // All agent-specific logic is defined in metadata, not code
        let agentResult = {};
        
        try {
          logger.info('Executing metadata-driven agent', {
            agentId: this.id,
            agentType: this.agentType,
            model,
            hasImages: imageUrls.length > 0,
            hasVoice: !!voiceTranscript
          });
          
          // Use AIService for metadata-driven processing
          const aiResponse = await generateAgentCompletion(
            analysisPrompt,
            {
              model,
              temperature: 0.7,
              max_tokens: 4000,
              reasoning: reasoningConfig,
              images: imageUrls.length > 0 ? imageUrls : undefined
            },
            {
              agentId: this.id,
              agentType: this.agentType,
              tenantId: contextData.tenantId || 'system'
            }
          );
          
          // Parse AI response into structured result
          agentResult = this.parseAIResponse(aiResponse, this.agentType);
          
          logger.info('AI processing completed', {
            agentId: this.id,
            agentType: this.agentType,
            confidence: agentResult.confidence,
            hasRecommendations: agentResult.recommendations?.length > 0
          });
          
        } catch (error) {
          logger.error('AI processing failed', {
            agentId: this.id,
            agentType: this.agentType,
            error: error.message
          });
          
          // Fallback to generic analysis
          agentResult = {
            analysis: `Error processing ${this.agentType}: ${error.message}`,
            recommendations: [],
            confidence: 0.1,
            error: true
          };
        }

        // Store results in memory for next agent
        this.addToMemory('lastResult', agentResult);
        this.addToMemory('previousStepData', agentResult);
        this.addConversationEntry('assistant', `Completed ${this.agentType} analysis`, 'agent-complete');

        const result = {
          agentId: this.id,
          agentType: this.agentType,
          processedAt: new Date().toISOString(),
          analysis: agentResult.analysis || `Metadata-driven analysis completed for ${this.agentType}`,
          recommendations: agentResult.recommendations || [],
          confidence: agentResult.confidence || 0.95,
          metadata: {
            model: model,
            reasoningEffort: reasoningConfig.reasoningEffort || 'medium',
            inputKeys: Object.keys(inputs || {}),
            memoryState: this.memory.metadata
          },
          // Include all agent-specific results
          ...agentResult
        };

        return result;
      }
      
      /**
       * Parse AI response into structured agent result
       * @param {string} aiResponse - Raw AI response text
       * @param {string} agentType - Type of agent for context
       * @returns {Object} Structured result with analysis, recommendations, confidence
       */
      parseAIResponse(aiResponse, agentType) {
        try {
          // Try to parse as JSON first (if AI returned structured JSON)
          if (aiResponse.trim().startsWith('{') || aiResponse.trim().startsWith('[')) {
            const parsed = JSON.parse(aiResponse);
            return {
              analysis: parsed.analysis || parsed.content || aiResponse,
              recommendations: parsed.recommendations || parsed.actions || [],
              confidence: parsed.confidence || 0.85,
              ...parsed, // Include all other fields from structured response
              rawResponse: aiResponse
            };
          }
          
          // Otherwise, parse structured text response
          const result = {
            analysis: '',
            recommendations: [],
            confidence: 0.85,
            rawResponse: aiResponse
          };
          
          // Extract analysis section
          const analysisMatch = aiResponse.match(/(?:Analysis|Summary|Findings):\s*(.+?)(?=\n\n|\nRecommendations?:|$)/is);
          if (analysisMatch) {
            result.analysis = analysisMatch[1].trim();
          } else {
            // If no structured sections, use first paragraph as analysis
            const firstParagraph = aiResponse.split('\n\n')[0];
            result.analysis = firstParagraph.trim();
          }
          
          // Extract recommendations
          const recsMatch = aiResponse.match(/Recommendations?:\s*(.+?)(?=\n\n|$)/is);
          if (recsMatch) {
            const recsText = recsMatch[1];
            // Split by bullet points or numbered lists
            result.recommendations = recsText
              .split(/\n[-•*\d.]+\s*/)
              .filter(r => r.trim())
              .map(r => r.trim());
          }
          
          // Extract confidence if mentioned
          const confMatch = aiResponse.match(/confidence[:\s]+(\d+\.?\d*)%?/i);
          if (confMatch) {
            const conf = parseFloat(confMatch[1]);
            result.confidence = conf > 1 ? conf / 100 : conf;
          }
          
          logger.debug('Parsed AI response', {
            agentType,
            hasAnalysis: !!result.analysis,
            recommendationCount: result.recommendations.length,
            confidence: result.confidence
          });
          
          return result;
          
        } catch (error) {
          logger.warn('Failed to parse AI response, using raw text', {
            agentType,
            error: error.message
          });
          
          // Fallback: return raw response
          return {
            analysis: aiResponse,
            recommendations: [],
            confidence: 0.7,
            rawResponse: aiResponse
          };
        }
      }
    }

    return new DynamicAgent(config);
  }

  /**
   * Get cached agent instance
   * @param {string} agentId - Agent instance ID
   * @returns {BaseAgent|null} Cached agent or null
   */
  getAgentInstance(agentId) {
    return this.agentInstances.get(agentId) || null;
  }

  /**
   * Clear all cached agent instances
   */
  clearInstances() {
this.agentInstances.clear();
  }

  /**
   * Get all registered agent types
   * @returns {string[]} Array of registered agent types
   */
  getRegisteredTypes() {
    return Array.from(this.agentTypes.keys());
  }

  /**
   * Get agent class for type
   * @param {string} type - Agent type
   * @returns {Function|null} Agent constructor or null
   */
  getAgentClass(type) {
    return this.agentTypes.get(type) || null;
  }
}

module.exports = AgentRegistry;
