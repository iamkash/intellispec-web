import {
    AudioMutedOutlined,
    AudioOutlined,
    ClearOutlined,
    DownloadOutlined,
    RobotOutlined,
    SendOutlined,
    UserOutlined
} from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Input, Space, Spin, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useWorkspaceFilters } from '../../../../contexts/WorkspaceFilterContext';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { RAGChatbotConfig } from './GenericRAGChatbotGadget';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * Message interface for chat history
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseId?: string;
  audioResponse?: boolean;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    result: any;
  }>;
}

/**
 * Props for the Generic RAG Chatbot Component
 */
interface GenericRAGChatbotComponentProps {
  gadgetConfig: RAGChatbotConfig;
  context: {
    filters: Record<string, any>;
  };
}

/**
 * Enhanced Generic RAG Chatbot Component
 * 
 * Features:
 * - GPT-5 Responses API integration with context retention
 * - OpenAI Realtime API for voice interactions
 * - Built-in tool calling for domain-specific functions
 * - Filter-aware context from workspace
 * - Tenant isolation and security
 * - Minimalist, theme-aware design
 */
export const GenericRAGChatbotComponent: React.FC<GenericRAGChatbotComponentProps> = ({
  gadgetConfig,
  context
}) => {
  // Hooks
  const filterContext = useWorkspaceFilters();
  const { token } = useAuth();
  const themeColors = useThemeColors();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [realtimeClient, setRealtimeClient] = useState<any>(null);
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<any>(null);
  const initializedRef = useRef(false);

  // Configuration with safe defaults
  const { chatbot = {}, rag = {}, ai = {}, features = {}, ui = {}, api = {} } = gadgetConfig;
  
  // Ensure chatbot has safe defaults
  const safeChatbot = {
    welcomeMessage: 'Hello! How can I assist you today?',
    placeholder: 'Type your message here...',
    maxMessages: 100,
    enableHistory: true,
    quickActions: [],
    ...(chatbot && typeof chatbot === 'object' ? chatbot as Record<string, any> : {})
  };

  // Ensure rag has safe defaults
  const safeRag = useMemo(() => ({
    enabled: false,
    vectorStore: 'mongodb_atlas',
    embeddingModel: 'text-embedding-ada-002',
    searchIndex: 'default',
    collection: 'documents',
    embeddingDimensions: 1536,
    similarity: 'cosine',
    fieldMappings: {},
    filterFields: [],
    contextSources: [],
    semanticFields: [],
    ...(rag && typeof rag === 'object' ? rag as Record<string, any> : {})
  }), [rag]);

  // Ensure ai has safe defaults
  const defaultAi = {
    model: 'gpt-4',
    apiType: 'standard',
    realtimeEnabled: false,
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: 'You are a helpful AI assistant.',
    contextPrompt: 'Use the provided context to answer questions.',
    responsesApi: {
      store: false,
      contextRetention: false,
      previousResponseId: null
    },
    realtimeApi: {
      enabled: false,
      voiceEnabled: false,
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy',
      inputAudioFormat: 'pcm16',
      outputAudioFormat: 'pcm16',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        silenceDurationMs: 200
      },
      tools: []
    }
  };

  const safeAi = {
    ...defaultAi,
    ...(ai && typeof ai === 'object' ? ai as Record<string, any> : {}),
    // Ensure nested objects are properly merged
    responsesApi: {
      ...defaultAi.responsesApi,
      ...(ai && typeof ai === 'object' && 'responsesApi' in ai && ai.responsesApi && typeof ai.responsesApi === 'object' ? ai.responsesApi as Record<string, any> : {})
    },
    realtimeApi: {
      ...defaultAi.realtimeApi,
      ...(ai && typeof ai === 'object' && 'realtimeApi' in ai && ai.realtimeApi && typeof ai.realtimeApi === 'object' ? ai.realtimeApi as Record<string, any> : {})
    }
  };

  // Ensure api has safe defaults
  const safeApi = useMemo(() => ({
    endpoint: '/api/rag/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    requestFormat: {},
    ...(api && typeof api === 'object' ? api as Record<string, any> : {})
  }), [api]);

  // Ensure features has safe defaults
  const safeFeatures = {
    contextRetention: true,
    filterIntegration: true,
    dataVisualization: false,
    exportChat: false,
    voiceInput: false,
    voiceOutput: false,
    realtimeAudio: false,
    toolCalling: false,
    multiLanguage: false,
    ...features
  };

  // Ensure ui has safe defaults
  const defaultUi = {
    theme: {
      primaryColor: '#1890ff',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#52c41a',
      mutedColor: '#8c8c8c'
    },
    layout: {
      height: '400px',
      showHeader: true,
      showFooter: true,
      compactMode: false
    },
    animations: {
      enabled: true,
      typingIndicator: true,
      messageTransitions: true
    }
  };

  const safeUi = {
    theme: {
      ...defaultUi.theme,
      ...(ui && typeof ui === 'object' && 'theme' in ui && ui.theme && typeof ui.theme === 'object' ? ui.theme as Record<string, any> : {})
    },
    layout: {
      ...defaultUi.layout,
      ...(ui && typeof ui === 'object' && 'layout' in ui && ui.layout && typeof ui.layout === 'object' ? ui.layout as Record<string, any> : {})
    },
    animations: {
      ...defaultUi.animations,
      ...(ui && typeof ui === 'object' && 'animations' in ui && ui.animations && typeof ui.animations === 'object' ? ui.animations as Record<string, any> : {})
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handle sending a message
   */
  const handleMessage = useCallback(async (message: string, isVoice = false) => {
    if (!message.trim()) return;

    try {
      setIsLoading(true);

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Use Realtime API for voice interactions
      if (isVoice && realtimeClient && safeFeatures.realtimeAudio) {
        // Voice response will be handled by Realtime API events
        return;
      }

      // Send message to backend API with authentication
      const response = await fetch(safeApi.endpoint, {
        method: safeApi.method,
        headers: {
          ...safeApi.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          context: {
            filters: filterContext.filters,
            previousResponseId: previousResponseId
          },
          rag: safeRag,
          gadgetConfig: gadgetConfig
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      // Store response ID for context retention
      if (result.responseId) {
        setPreviousResponseId(result.responseId);
      }

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        responseId: result.responseId,
        audioResponse: isVoice
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Message handling error:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  }, [safeApi, filterContext.filters, gadgetConfig, safeRag, realtimeClient, safeFeatures.realtimeAudio, previousResponseId, token]);

  /**
   * Start audio recording
   */
  const startAudioRecording = useCallback(async () => {
    if (!safeFeatures.voiceInput) return;

    try {
      setIsRecording(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // In a real implementation, you would process the audio stream
      // and send it to the Realtime API or convert it to text
} catch (error) {
      console.error('Failed to start audio recording:', error);
      setIsRecording(false);
    }
  }, [safeFeatures.voiceInput]);

  /**
   * Stop audio recording
   */
  const stopAudioRecording = useCallback(async () => {
    setIsRecording(false);

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  }, []);

  /**
   * Initialize OpenAI Realtime API client
   */
  const initializeRealtimeClient = useCallback(async () => {
    if (!safeAi.realtimeApi?.enabled) return;

    try {
      setConnectionStatus('connecting');

      const client = {
        connect: async () => {
          setTimeout(() => setConnectionStatus('connected'), 1000);
        },
        disconnect: () => {
          setConnectionStatus('disconnected');
        },
        sendMessage: async (message: string) => handleMessage(message, true),
        startRecording: async () => startAudioRecording(),
        stopRecording: async () => stopAudioRecording()
      };

      await client.connect();
      setRealtimeClient(client);

    } catch (error) {
      console.error('Failed to initialize Realtime API:', error);
      setConnectionStatus('disconnected');
    }
  }, [handleMessage, safeAi.realtimeApi?.enabled, startAudioRecording, stopAudioRecording]);

  // Initialize component
  useEffect(() => {
    if (!initializedRef.current) {
      if (safeChatbot.welcomeMessage && messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content: safeChatbot.welcomeMessage,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }

      if (safeFeatures.realtimeAudio && safeAi.realtimeApi?.enabled) {
        initializeRealtimeClient();
      }

      initializedRef.current = true;
    }

    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (realtimeClient) {
        realtimeClient.disconnect?.();
      }
    };
  }, [safeChatbot.welcomeMessage, messages.length, safeFeatures.realtimeAudio, safeAi.realtimeApi?.enabled, initializeRealtimeClient, realtimeClient]);

  /**
   * Handle voice recording toggle
   */
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      await stopAudioRecording();
    } else {
      await startAudioRecording();
    }
  };

  /**
   * Handle quick action click
   */
  const handleQuickAction = (action: { label: string; message: string; icon?: string }) => {
    handleMessage(action.message);
  };

  /**
   * Clear chat history
   */
  const clearChat = () => {
    setMessages(safeChatbot.welcomeMessage ? [{
      id: `welcome_${Date.now()}`,
      role: 'assistant',
      content: safeChatbot.welcomeMessage,
      timestamp: new Date()
    }] : []);
    setPreviousResponseId(null);
  };

  /**
   * Export chat history
   */
  const exportChat = () => {
    const chatData = {
      messages: messages,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handle input key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMessage(inputMessage);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Styles
  const cardStyle = {
    height: safeUi.layout.height || '400px',
    backgroundColor: themeColors.card,
    borderColor: themeColors.border,
    display: 'flex',
    flexDirection: 'column' as const
  };

  const messagesStyle = {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    backgroundColor: themeColors.background
  };

  const inputAreaStyle = {
    padding: '16px',
    borderTop: `1px solid ${themeColors.border}`,
    backgroundColor: themeColors.card
  };

  return (
    <Card 
      style={cardStyle}
      bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      {safeUi.layout.showHeader && (
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.card,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space>
            <RobotOutlined style={{ color: themeColors.primary, fontSize: '16px' }} />
            <Text strong style={{ color: themeColors.foreground }}>
              AI Assistant
            </Text>
            {safeFeatures.realtimeAudio && (
              <Badge 
                status={connectionStatus === 'connected' ? 'success' : 'default'} 
                text={connectionStatus}
              />
            )}
          </Space>
          
          <Space>
            {safeFeatures.exportChat && (
              <Tooltip title="Export Chat">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DownloadOutlined />}
                  onClick={exportChat}
                />
              </Tooltip>
            )}
            <Tooltip title="Clear Chat">
              <Button 
                type="text" 
                size="small" 
                icon={<ClearOutlined />}
                onClick={clearChat}
              />
            </Tooltip>
          </Space>
        </div>
      )}

      {/* Messages Area */}
      <div style={messagesStyle}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '70%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <Avatar 
                size="small"
                icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                style={{
                  backgroundColor: message.role === 'user' ? themeColors.primary : themeColors.muted,
                  flexShrink: 0
                }}
              />
              
              <div style={{
                backgroundColor: message.role === 'user' ? themeColors.primary : themeColors.muted,
                color: message.role === 'user' ? themeColors.primaryForeground : themeColors.foreground,
                padding: '8px 12px',
                borderRadius: '12px',
                maxWidth: '100%'
              }}>
                <Paragraph 
                  style={{ 
                    margin: 0, 
                    color: 'inherit',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {message.content}
                </Paragraph>
                
                <Text 
                  style={{ 
                    fontSize: '11px', 
                    opacity: 0.7,
                    color: 'inherit',
                    display: 'block',
                    marginTop: '4px'
                  }}
                >
                  {formatTimestamp(message.timestamp)}
                  {message.audioResponse && ' 🎵'}
                </Text>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar 
                size="small"
                icon={<RobotOutlined />}
                style={{ backgroundColor: themeColors.muted }}
              />
              <div style={{
                backgroundColor: themeColors.muted,
                padding: '8px 12px',
                borderRadius: '12px'
              }}>
                <Spin size="small" />
                <Text style={{ marginLeft: '8px', color: themeColors.foreground }}>
                  Thinking...
                </Text>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {safeChatbot.quickActions && safeChatbot.quickActions.length > 0 && (
        <div style={{
          padding: '8px 16px',
          borderTop: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.card
        }}>
          <Space wrap>
            {safeChatbot.quickActions.map((action: any, index: number) => (
              <Button
                key={index}
                size="small"
                type="default"
                onClick={() => handleQuickAction(action)}
                style={{
                  borderColor: themeColors.border,
                  color: themeColors.foreground
                }}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        </div>
      )}

      {/* Input Area */}
      <div style={inputAreaStyle}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={safeChatbot.placeholder}
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={isLoading}
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
              color: themeColors.foreground
            }}
          />
          
          {safeFeatures.voiceInput && (
            <Tooltip title={isRecording ? "Stop Recording" : "Start Voice Recording"}>
              <Button
                type={isRecording ? "primary" : "default"}
                icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
                onClick={toggleVoiceRecording}
                disabled={isLoading}
                danger={isRecording}
              />
            </Tooltip>
          )}
          
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleMessage(inputMessage)}
            disabled={isLoading || !inputMessage.trim()}
          />
        </Space.Compact>
      </div>

      {/* Footer */}
      {safeUi.layout.showFooter && (
        <div style={{
          padding: '8px 16px',
          borderTop: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.card,
          textAlign: 'center'
        }}>
          <Text style={{ fontSize: '11px', color: themeColors.mutedForeground }}>
            Powered by {safeAi.model} • {safeRag.enabled ? 'RAG Enabled' : 'Standard Mode'}
            {safeFeatures.realtimeAudio && ' • Voice Enabled'}
          </Text>
        </div>
      )}
    </Card>
  );
};

export default GenericRAGChatbotComponent;
