import { ReloadOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BaseGadget, GadgetMetadata, GadgetSchema, GadgetType } from '../base';

interface AIStreamingAdvisorConfig {
  title: string;
  description?: string;
  dataUrl: string;
  systemPrompt: string;
  userPromptTemplate: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  autoLoad?: boolean;
}

interface AIStreamingAdvisorGadgetProps {
  config: AIStreamingAdvisorConfig;
  filterContext?: any;
}

/**
 * AI Streaming Advisor Gadget
 * 
 * A generic gadget that:
 * 1. Fetches data from a specified URL
 * 2. Sends data to AI with custom prompts from metadata
 * 3. Streams the AI response in real-time
 * 4. Displays the response as formatted markdown
 * 
 * Completely metadata-driven - no hardcoded prompts or logic
 */
export class AIStreamingAdvisorGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'ai-streaming-advisor-gadget',
    name: 'AI Streaming Advisor Gadget',
    description: 'Generic AI advisor that fetches data and streams AI recommendations in real-time',
    version: '1.0.0',
    author: 'IntelliSpec',
    category: 'ai',
    tags: ['ai', 'streaming', 'recommendations', 'advisor'],
    gadgetType: GadgetType.DISPLAY,
    widgetTypes: [],
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      dataUrl: { type: 'string' },
      systemPrompt: { type: 'string' },
      userPromptTemplate: { type: 'string' },
      model: { type: 'string' },
      temperature: { type: 'number' },
      maxTokens: { type: 'number' },
      autoLoad: { type: 'boolean' },
    },
    required: ['dataUrl', 'systemPrompt', 'userPromptTemplate'],
    widgetSchemas: {},
  };
  
  validate(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config) {
      errors.push('Config is required');
    } else {
      if (!config.dataUrl) {
        errors.push('dataUrl is required');
      }
      if (!config.systemPrompt) {
        errors.push('systemPrompt is required');
      }
      if (!config.userPromptTemplate) {
        errors.push('userPromptTemplate is required');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  getWidgetLayout(): any {
    return { type: 'flex', responsive: true };
  }

  processDataFlow(data: any): any {
    return data;
  }

  renderBody(props: any, context?: any): React.ReactNode {
    const config = props.config || props;
    const filterContext = context?.filterContext;
    return <AIStreamingAdvisorContent config={config} filterContext={filterContext} />;
  }
}

const AIStreamingAdvisorContent: React.FC<AIStreamingAdvisorGadgetProps> = ({ config, filterContext }) => {
  const [loading, setLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchDataAndStream = async () => {
    try {
      setLoading(true);
      setError(null);
      setStreamedContent('');
      setHasLoaded(true);

      // Step 1: Fetch data from the specified URL
      const dataResponse = await BaseGadget.makeAuthenticatedFetch(config.dataUrl);
      
      if (!dataResponse.ok) {
        throw new Error(`Failed to fetch data: ${dataResponse.statusText}`);
      }

      const rawData = await dataResponse.json();

      // Step 2: Transform data - only assets with inspection dates
      const assets = Array.isArray(rawData) ? rawData : (rawData.data || []);
      
      const filteredInspections = assets
        .filter((asset: any) => asset.inspection?.next_inspection_date)
        .map((asset: any) => ({
          name: asset.name || asset.asset_name || 'Unknown',
          type: asset.asset_type || 'Unknown',
          dueDate: asset.inspection?.next_inspection_date
        }));

      console.log(`Found ${filteredInspections.length} inspections from ${assets.length} total assets`);

      // Prepare context for template interpolation
      const context = {
        data: JSON.stringify(filteredInspections, null, 2),
        filterContext: filterContext ? JSON.stringify(filterContext, null, 2) : ''
      };

      // Step 3: Call AI API (backend will interpolate templates)
      const isGPT5 = (config.model || 'gpt-4o').startsWith('gpt-5');
      
      const aiResponse = await BaseGadget.makeAuthenticatedFetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 2000,
          systemPrompt: config.systemPrompt,
          userPrompt: config.userPromptTemplate,
          context: context,
          stream: !isGPT5 // GPT-5 doesn't support streaming
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error response:', errorText);
        throw new Error(`AI API error: ${aiResponse.statusText} - ${errorText}`);
      }

      // Step 4: Process the response (streaming for GPT-4, non-streaming for GPT-5)
      if (isGPT5) {
        // GPT-5: Non-streaming response
        console.log('Processing non-streaming GPT-5 response...');
        console.log('Waiting for GPT-5 to complete (this may take 30-60 seconds)...');
        
        try {
          const result = await aiResponse.json();
          console.log('GPT-5 JSON parsed successfully:', result);
          
          const content = result.data || result.content || '';
          console.log('GPT-5 response received:', content.length, 'characters');
          console.log('First 200 chars:', content.substring(0, 200));
          
          if (!content) {
            console.error('GPT-5 returned empty content. Full result:', result);
            throw new Error('GPT-5 returned empty response');
          }
          
          setStreamedContent(content);
        } catch (jsonError: any) {
          console.error('Failed to parse GPT-5 response:', jsonError);
          throw new Error(`Failed to parse GPT-5 response: ${jsonError.message}`);
        }
      } else {
        // GPT-4: Streaming response
        const reader = aiResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          console.error('Response body is null or undefined:', aiResponse);
          throw new Error('No response body reader available');
        }
        
        console.log('Starting to read streaming response...');

        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                
                if (content) {
                  accumulatedContent += content;
                  setStreamedContent(accumulatedContent);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

    } catch (err: any) {
      console.error('AI Streaming error:', err);
      console.error('Error stack:', err.stack);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        cause: err.cause
      });
      setError(err.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config.autoLoad !== false) {
      fetchDataAndStream();
    }
  }, [config.dataUrl, filterContext]);

  return (
    <Card
      className="ai-streaming-advisor-gadget"
      bordered={false}
      style={{ height: '100%' }}
    >
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RobotOutlined style={{ fontSize: 20, color: 'hsl(var(--primary))' }} />
          <span style={{ fontWeight: 500 }}>AI Analysis</span>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchDataAndStream}
          loading={loading}
          disabled={loading}
        >
          Regenerate
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading && !streamedContent && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: 'hsl(var(--muted-foreground))' }}>
            {config.model?.startsWith('gpt-5') 
              ? 'GPT-5 is analyzing your inspection data... This may take 30-60 seconds for deep reasoning.'
              : 'Analyzing inspection data and generating recommendations...'}
          </div>
        </div>
      )}

      {streamedContent && (
        <div className="markdown-content" style={{ 
          padding: '16px',
          backgroundColor: 'hsl(var(--muted) / 0.3)',
          borderRadius: '8px',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem' }} {...props} />,
              h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem' }} {...props} />,
              h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.5rem' }} {...props} />,
              p: ({ node, ...props }) => <p style={{ marginBottom: '0.75rem', lineHeight: 1.6 }} {...props} />,
              ul: ({ node, ...props }) => <ul style={{ marginLeft: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
              ol: ({ node, ...props }) => <ol style={{ marginLeft: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
              li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
              strong: ({ node, ...props }) => <strong style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }} {...props} />,
              code: ({ node, inline, ...props }: any) => 
                inline ? 
                  <code style={{ 
                    backgroundColor: 'hsl(var(--muted))', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }} {...props} /> :
                  <code style={{ 
                    display: 'block',
                    backgroundColor: 'hsl(var(--muted))', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    overflowX: 'auto'
                  }} {...props} />
            }}
          >
            {streamedContent}
          </ReactMarkdown>
        </div>
      )}

      {!loading && !streamedContent && !hasLoaded && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'hsl(var(--muted-foreground))' }}>
          Click "Regenerate" to generate AI recommendations
        </div>
      )}

      {loading && streamedContent && (
        <div style={{ marginTop: 8, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          <Spin size="small" style={{ marginRight: 8 }} />
          Streaming response...
        </div>
      )}
    </Card>
  );
};

export default AIStreamingAdvisorGadget;
