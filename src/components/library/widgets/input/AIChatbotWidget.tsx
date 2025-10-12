/**
 * AIChatbotWidget - AI-powered chatbot for form assistance
 * 
 * Provides intelligent assistance for form filling, schema understanding,
 * voice input processing, and image analysis for findings documentation.
 * Designed to integrate seamlessly with the existing wizard gadget system.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Avatar, 
  List, 
  message, 
  Tooltip, 
  Popover,
  Divider,
  Tag,
  Spin,
  Badge,
  Collapse,
  Alert,
  Drawer,
  FloatButton
} from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined, 
  AudioOutlined,
  PictureOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  UploadOutlined,
  EyeOutlined,
  MessageOutlined,
  CloseOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useOpenAI, OpenAIModelConfig, OpenAIPromptConfig } from '../../../../hooks/useOpenAI';
import { VoiceRecorderWidget } from './VoiceRecorderWidget';
import { ImageUploadWithDrawingWidget } from './ImageUploadWithDrawingWidget';
import { DocumentUploadWidget } from './DocumentUploadWidget';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  metadata?: {
    fieldId?: string;
    fieldType?: string;
    suggestions?: string[];
    confidence?: number;
    imageUrl?: string;
    audioUrl?: string;
    formData?: Record<string, any>;
    sectionId?: string;
    isRecording?: boolean;
  };
}

export interface FormField {
  id: string;
  type?: string;
  title: string;
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  dependencies?: {
    watchField?: string;
    showWhen?: any;
  };
  sectionId?: string;
  groupId?: string;
}

export interface AIChatbotWidgetProps {
  // Widget configuration
  id: string;
  title?: string;
  description?: string;
  placeholder?: string;
  
  // Form context
  formSchema?: FormField[];
  currentFormData?: Record<string, any>;
  currentSection?: string;
  currentField?: string;
  
  // AI Configuration
  openaiConfig?: {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
  };
  modelConfig?: OpenAIModelConfig;
  promptConfig?: OpenAIPromptConfig;
  
  // Features
  enableVoice?: boolean;
  enableImageUpload?: boolean;
  enableDocumentUpload?: boolean;
  enableSuggestions?: boolean;
  enableAutoFill?: boolean;
  
  // UI Configuration
  position?: 'drawer' | 'float' | 'inline';
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  
  // Callbacks
  onFieldUpdate?: (fieldId: string, value: any) => void;
  onFieldFocus?: (fieldId: string) => void;
  onSectionChange?: (sectionId: string) => void;
  onFormComplete?: (formData: Record<string, any>) => void;
  
  // Widget standard props
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AIChatbotWidget: React.FC<AIChatbotWidgetProps> = ({
  id,
  title = 'AI Assistant',
  description = 'Get help with form filling and inspection documentation',
  placeholder = 'Ask me anything about this form...',
  
  formSchema = [],
  currentFormData = {},
  currentSection,
  currentField,
  
  openaiConfig,
  modelConfig = { model: 'gpt-4o-mini', temperature: 0.7 },
  promptConfig = {},
  
  enableVoice = true,
  enableImageUpload = true,
  enableDocumentUpload = true,
  enableSuggestions = true,
  enableAutoFill = true,
  
  position = 'drawer',
  theme = 'light',
  size = 'medium',
  
  onFieldUpdate,
  onFieldFocus,
  onSectionChange,
  onFormComplete,
  
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  style = {}
}) => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Refs
  const inputRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // OpenAI hook
  const openai = useOpenAI({
    apiKey: openaiConfig?.apiKey || '',
    baseUrl: openaiConfig?.baseUrl,
    timeout: openaiConfig?.timeout
  });

  // Load complete form schema
  const [completeFormSchema, setCompleteFormSchema] = useState<any>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  // Load complete form schema on mount
  useEffect(() => {
    const loadCompleteSchema = async () => {
      try {
        setIsLoadingSchema(true);
        const response = await fetch('/data/workspaces/inspection/api-510-complete-schema.json');
        if (response.ok) {
          const schema = await response.json();
          setCompleteFormSchema(schema);
} else {
          console.warn('Failed to load complete form schema, using provided schema');
          setCompleteFormSchema({ formSchema, sections: [] });
        }
      } catch (error) {
        console.warn('Error loading complete form schema:', error);
        setCompleteFormSchema({ formSchema, sections: [] });
      } finally {
        setIsLoadingSchema(false);
      }
    };

    loadCompleteSchema();
  }, [formSchema]);

  // System prompt generation
  const systemPrompt = useMemo(() => {
    const schemaToUse = completeFormSchema?.formSchema || formSchema;
    const sections = completeFormSchema?.sections || [];
    
    const formFields = schemaToUse.map((field: any) => ({
      id: field.id,
      type: field.type || 'text',
      title: field.title,
      label: field.label,
      description: field.description,
      required: field.required,
      options: field.options,
      sectionId: field.sectionId,
      groupId: field.groupId
    }));

    const metadata = completeFormSchema?.metadata;
    const aiInstructions = metadata?.aiInstructions;
    
    return `You are an AI assistant helping with form completion. 

Current Context:
- Current Section: ${currentSection || 'General'}
- Current Field: ${currentField || 'None'}
- Available Sections: ${sections.map((s: any) => `${s.id}: ${s.title}`).join(', ')}
- Form Fields: ${JSON.stringify(formFields, null, 2)}
- Current Form Data: ${JSON.stringify(currentFormData, null, 2)}

${aiInstructions ? `
AI Instructions from Schema:
- Purpose: ${aiInstructions.purpose}
- Response Format: ${aiInstructions.responseFormat}
- Special Handling: ${JSON.stringify(aiInstructions.specialHandling, null, 2)}
- Examples: ${JSON.stringify(aiInstructions.examples, null, 2)}
` : ''}

Available form fields: ${formFields.map((f: any) => `${f.id} (${f.type}): ${f.title}`).join(', ')}`;
  }, [completeFormSchema, formSchema, currentSection, currentField, currentFormData]);

  // Add message helper
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Send message to OpenAI
  const sendMessage = useCallback(async (content: string, metadata?: any) => {
    if (!content.trim()) return;
    
    // Check if OpenAI API key is available
    if (!openaiConfig?.apiKey || openaiConfig.apiKey === '') {
      addMessage({
        type: 'error',
        content: 'OpenAI API key is not configured. Please set REACT_APP_OPENAI_API_KEY in your environment variables.'
      });
      return;
    }
    
    // Add user message
    addMessage({
      type: 'user',
      content,
      metadata
    });
    
    setInputValue('');
    setIsAnalyzing(true);
    
    try {
      // Prepare context with form data and schema
      const context = {
        formSchema,
        currentFormData,
        currentSection,
        currentField,
        uploadedImages,
        uploadedDocuments,
        chatHistory: messages.slice(-5), // Last 5 messages for context
        isVoiceInput: metadata?.source === 'voice'
      };
      
      const response = await openai.analyzeText({
        text: content,
        modelConfig,
        promptConfig: {
          ...promptConfig,
          systemPrompt: systemPrompt + (metadata?.source === 'voice' ? '\n\nThis is a voice input. Be extra conversational and proactive in helping the user complete the form. After processing their voice input, ask what else they would like to complete.' : ''),
          context: JSON.stringify(context)
        },
        outputFormat: 'text'
      });
      
      // Check if response and response.data exist
      if (!response || !response.data) {
        throw new Error('No response received from OpenAI API');
      }
      
      // Parse response for field updates
      const fieldUpdates = parseFieldUpdates(response.data);
console.log('Available form fields:', formSchema.map(f => `${f.id} (${f.type})`));
// Add assistant response
      addMessage({
        type: 'assistant',
        content: response.data,
        metadata: {
          suggestions: generateSuggestions(response.data),
          formData: fieldUpdates || undefined
        }
      });
      
      // Apply field updates
      if (fieldUpdates && typeof fieldUpdates === 'object') {
const schemaToUse = completeFormSchema?.formSchema || formSchema;
        
        Object.entries(fieldUpdates).forEach(([fieldId, value]) => {
// Find the field definition to understand its type
          const fieldDef = schemaToUse.find((f: any) => f.id === fieldId);
          
          if (fieldDef?.type === 'inspection-findings' && Array.isArray(value)) {
            // Convert string array to proper finding objects for inspection-findings type
            const findings = value.map((findingText: string, index: number) => ({
              id: `finding-${Date.now()}-${index}`,
              title: `Finding ${index + 1}`,
              description: findingText,
              location: fieldDef.location || 'Inspection area',
              severity: fieldDef.defaultSeverity || 'medium',
              measurements: {},
              images: [],
              timestamp: new Date().toISOString(),
              inspector: fieldDef.defaultInspector || 'AI Assistant'
            }));
onFieldUpdate?.(fieldId, findings);
          } else if (fieldDef?.type === 'textarea' && typeof value === 'string') {
            // For textarea fields, use the AI-generated text directly
onFieldUpdate?.(fieldId, value);
          } else {
            // Regular field update
            onFieldUpdate?.(fieldId, value);
          }
        });
      } else {
}
      
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        type: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [openai, systemPrompt, modelConfig, promptConfig, formSchema, currentFormData, currentSection, currentField, uploadedImages, uploadedDocuments, messages, addMessage, onFieldUpdate, openaiConfig?.apiKey]);
  
  // Parse field updates from AI response
  const parseFieldUpdates = useCallback((response: string): Record<string, any> | null => {
    try {
      // Check if response exists and is a string
      if (!response || typeof response !== 'string') {
        return null;
      }
// Look for JSON patterns in the response - try multiple patterns
      const jsonPatterns = [
        /\{[\s\S]*?\}/g,  // Any JSON object
        /```json\s*(\{[\s\S]*?\})\s*```/g,  // JSON in code blocks
        /```\s*(\{[\s\S]*?\})\s*```/g  // JSON in generic code blocks
      ];
      
      for (const pattern of jsonPatterns) {
        const matches = response.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              // Clean up the match (remove markdown formatting if present)
              let jsonStr = match;
              if (match.includes('```json')) {
                jsonStr = match.replace(/```json\s*/, '').replace(/\s*```/, '');
              } else if (match.includes('```')) {
                jsonStr = match.replace(/```\s*/, '').replace(/\s*```/, '');
              }
              
              const parsed = JSON.parse(jsonStr);
return parsed;
            } catch (parseError) {
              console.warn('Failed to parse JSON match:', match, parseError);
              continue;
            }
          }
        }
      }
return null;
    } catch (error) {
      console.warn('Failed to parse field updates from response:', error);
      return null;
    }
  }, []);
  
  // Generate suggestions based on response
  const generateSuggestions = useCallback((response: string): string[] => {
    const suggestions: string[] = [];
    
    // Check if response exists and is a string
    if (!response || typeof response !== 'string') {
      suggestions.push('Show me form progress', 'Help me complete this section');
      return suggestions.slice(0, 4);
    }
    
    // Add context-aware suggestions
    if (response.includes('field') || response.includes('form')) {
      suggestions.push('What other fields need attention?');
    }
    
    if (response.includes('image') || response.includes('photo')) {
      suggestions.push('Upload another image for analysis');
    }
    
    if (response.includes('voice') || response.includes('audio')) {
      suggestions.push('Use voice input for this field');
    }
    
    if (currentSection) {
      suggestions.push(`Help me with ${currentSection} section`);
    }
    
    suggestions.push('Show me form progress', 'Help me complete this section');
    
    return suggestions.slice(0, 4);
  }, [currentSection]);
  
  // Convert image to supported format for OpenAI Vision API
  const convertImageToSupportedFormat = useCallback(async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0);
          
          // Convert to PNG (supported by OpenAI)
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve(pngDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  }, []);
  
  // Handle image upload and analysis
  const handleImageUpload = useCallback(async (imageUrl: string, drawingData?: string) => {
    setUploadedImages(prev => [...prev, imageUrl]);
    
    try {
      setIsAnalyzing(true);
      
      // Convert image to supported format
      const supportedImageUrl = await convertImageToSupportedFormat(imageUrl);
      
      const analysisPrompt = `Analyze this inspection image and extract relevant information for the form. 
      Focus on: equipment condition, visible defects, measurements, safety concerns, and any findings that should be documented.
      If there are drawings or annotations on the image, include those in your analysis.
      Current section: ${currentSection || 'General'}`;
      
      const response = await openai.analyzeVision({
        imageUrls: [supportedImageUrl],
        text: analysisPrompt,
        modelConfig,
        promptConfig: {
          ...promptConfig,
          systemPrompt: systemPrompt + '\n\nYou are analyzing an image. Provide detailed findings and suggest form field updates.'
        },
        outputFormat: 'text'
      });
      
      // Check if response and response.data exist
      if (!response || !response.data) {
        throw new Error('No response received from OpenAI Vision API');
      }
      
      addMessage({
        type: 'assistant',
        content: `I've analyzed the uploaded image. Here are my findings:\n\n${response.data}`,
        metadata: { 
          imageUrl,
          suggestions: ['Upload another image', 'Add voice notes', 'Complete current section']
        }
      });
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Sorry, I couldn\'t analyze the image. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('unsupported image') || error.message.includes('invalid_image_format')) {
          errorMessage = 'The image format is not supported by OpenAI Vision API. I\'ve converted it to PNG format, but please try uploading a PNG, JPEG, GIF, or WebP image directly.';
        } else if (error.message.includes('Failed to load image')) {
          errorMessage = 'Failed to load the image. Please check the file and try again.';
        } else if (error.message.includes('HTTP 400')) {
          errorMessage = 'The image could not be processed. Please ensure it\'s a valid image file in PNG, JPEG, GIF, or WebP format.';
        }
      }
      
      addMessage({
        type: 'error',
        content: errorMessage
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [openai, modelConfig, promptConfig, systemPrompt, currentSection, addMessage, convertImageToSupportedFormat]);
  
  // Handle document upload
  const handleDocumentUpload = useCallback(async (documentUrl: string, metadata: any) => {
    setUploadedDocuments(prev => [...prev, documentUrl]);
    
    addMessage({
      type: 'user',
      content: `I've uploaded a document: ${metadata.name || 'Document'}`,
      metadata: { documentUrl, ...metadata }
    });
    
    // For now, acknowledge the upload
    addMessage({
      type: 'assistant',
      content: `I've received your document. I can help you reference it when filling out the form. What would you like to do with this document?`,
      metadata: {
        suggestions: ['Extract information from document', 'Use as reference', 'Attach to specific field']
      }
    });
  }, [addMessage]);
  
  // Handle voice input directly (no popup)
  const handleVoiceInput = useCallback(async (audioBlob: Blob) => {
    try {
      setIsAnalyzing(true);
      
      console.log('Processing voice input:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        timestamp: new Date().toISOString()
      });
      
      const transcription = await openai.transcribeAudio({
        audioBlob,
        modelConfig: { model: 'whisper-1' }, // Use Whisper model for audio transcription
        language: 'en'
      });
// Check if transcription and transcription.data exist
      if (!transcription || !transcription.data) {
        throw new Error('No transcription received from OpenAI API');
      }
      
      const transcribedText = transcription.data;
// Check if transcription is empty or too short
      if (!transcribedText || transcribedText.trim().length < 2) {
        throw new Error('Transcription is empty or too short. Please speak more clearly.');
      }
      
      addMessage({
        type: 'user',
        content: transcribedText,
        metadata: { audioUrl: URL.createObjectURL(audioBlob) }
      });
      
      // Send transcribed text for processing with voice context
      await sendMessage(transcribedText, { source: 'voice' });
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      
      let errorMessage = 'Sorry, I couldn\'t process your voice input. Please try again or type your message.';
      
      if (error instanceof Error) {
        if (error.message.includes('No transcription received')) {
          errorMessage = 'No audio was detected. Please speak more clearly and try again.';
        } else if (error.message.includes('empty or too short')) {
          errorMessage = 'I couldn\'t hear you clearly. Please speak louder and try again.';
        } else if (error.message.includes('HTTP 404')) {
          errorMessage = 'Audio transcription service is not available. Please type your message instead.';
        } else if (error.message.includes('HTTP 400')) {
          errorMessage = 'Audio format not supported. Please try recording again.';
        }
      }
      
      addMessage({
        type: 'error',
        content: errorMessage
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [openai, addMessage, sendMessage]);
  
  // Start direct voice recording
  const startVoiceRecording = useCallback(async () => {
    try {
      // Request microphone permission with better audio quality
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
// Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
if (audioChunks.length === 0) {
          addMessage({
            type: 'error',
            content: 'No audio was recorded. Please try again and speak clearly.'
          });
          return;
        }
        
        // Create audio blob
        const audioBlob = new Blob(audioChunks, { type: mimeType });
// Process the audio
        await handleVoiceInput(audioBlob);
      };
      
      // Show recording indicator
      addMessage({
        type: 'assistant',
        content: '🎤 Recording... Please speak clearly now. Recording will stop automatically in 10 seconds.',
        metadata: { isRecording: true }
      });
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      
      // Stop recording after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
mediaRecorder.stop();
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      addMessage({
        type: 'error',
        content: 'Could not access microphone. Please check your browser permissions and try again.'
      });
    }
  }, [handleVoiceInput, addMessage]);
  
  // Quick actions
  const quickActions = [
    ...(enableVoice ? [{
      label: 'Voice Conversation',
      icon: <AudioOutlined />,
      action: () => {
        // Start voice conversation
        addMessage({
          type: 'assistant',
          content: `I'm ready to help you with the form! Please speak clearly and tell me what information you'd like to add. I'll fill the form fields and guide you through completing each section.`,
          metadata: {
            suggestions: ['Start with basic information', 'Describe findings', 'Add measurements']
          }
        });
        
        // Start direct voice recording
        startVoiceRecording();
      }
    }] : []),
    ...(enableImageUpload ? [{
      label: 'Upload Image',
      icon: <PictureOutlined />,
      action: () => document.getElementById(`image-upload-${id}`)?.click()
    }] : []),
    ...(enableDocumentUpload ? [{
      label: 'Upload Document',
      icon: <UploadOutlined />,
      action: () => document.getElementById(`document-upload-${id}`)?.click()
    }] : []),
    {
      label: 'Form Help',
      icon: <QuestionCircleOutlined />,
      action: () => sendMessage('Show me help for the current form section')
    }
  ];
  
  // Render message
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';
    
    return (
      <div key={message.id} style={{
        display: 'flex',
        marginBottom: 12,
        gap: 8,
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        <Avatar 
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          style={{ 
            backgroundColor: isUser ? 'hsl(var(--primary))' : 'hsl(var(--success))',
            color: 'hsl(var(--primary-foreground))'
          }}
        />
        <div style={{
          maxWidth: '70%',
          backgroundColor: isError ? 'hsl(var(--destructive) / 0.1)' : (isUser ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--success) / 0.1)'),
          border: `1px solid ${isError ? 'hsl(var(--destructive) / 0.3)' : (isUser ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--success) / 0.3)')}`,
          borderRadius: 8,
          padding: 12,
          position: 'relative'
        }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </div>
          
          {/* Suggestions */}
          {message.metadata?.suggestions && enableSuggestions && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
                Quick actions:
              </div>
              <Space size={4} wrap>
                {message.metadata.suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    size="small"
                    type="link"
                    style={{ padding: 0, height: 'auto', fontSize: 12 }}
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </Space>
            </div>
          )}
          
          {/* Timestamp */}
          <div style={{
            fontSize: 10,
            color: 'hsl(var(--muted-foreground))',
            marginTop: 4,
            textAlign: isUser ? 'right' : 'left'
          }}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Main chat interface
  const chatInterface = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: 12,
        borderBottom: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--muted) / 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <RobotOutlined style={{ color: 'hsl(var(--success))' }} />
        <div>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{description}</div>
          {isLoadingSchema && (
            <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
              Loading form schema...
            </div>
          )}
        </div>
      </div>
      
      {/* Messages */}
      <div style={{
        flex: 1,
        padding: 12,
        overflowY: 'auto',
        maxHeight: 400
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'hsl(var(--muted-foreground))',
            padding: 20
          }}>
            <RobotOutlined style={{ fontSize: 24, marginBottom: 8 }} />
            <div>Ask me anything about the form!</div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div style={{
          padding: 8,
          borderTop: '1px solid hsl(var(--border))',
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap'
        }}>
          {quickActions.map((action, index) => (
            <Tooltip key={index} title={action.label}>
              <Button
                type="text"
                size="small"
                icon={action.icon}
                onClick={action.action}
                disabled={isAnalyzing || disabled}
              />
            </Tooltip>
          ))}
        </div>
      )}
      
      {/* Input */}
      <div style={{ padding: 12, borderTop: '1px solid hsl(var(--border))' }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            autoSize={{ minRows: 1, maxRows: 3 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                sendMessage(inputValue);
              }
            }}
            disabled={isAnalyzing || disabled}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isAnalyzing || disabled}
          />
        </Space.Compact>
      </div>
    </div>
  );
  
  // Hidden file inputs
  const hiddenInputs = (
    <>
      <input
        id={`image-upload-${id}`}
        type="file"
        accept=".png,.jpg,.jpeg,.gif,.webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            // Validate file type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
              addMessage({
                type: 'error',
                content: 'Please select a supported image format: PNG, JPEG, GIF, or WebP.'
              });
              return;
            }
            
            const url = URL.createObjectURL(file);
            handleImageUpload(url);
          }
        }}
      />
      <input
        id={`document-upload-${id}`}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            handleDocumentUpload(url, { name: file.name, size: file.size, type: file.type });
          }
        }}
      />
    </>
  );

  // Render based on position
  if (position === 'drawer') {
    return (
      <>
        <FloatButton
          icon={<RobotOutlined />}
          type="primary"
          onClick={() => setIsOpen(true)}
          tooltip={title}
          style={{ right: 24, bottom: 24 }}
        />
        <Drawer
          title={title}
          placement="right"
          width={400}
          onClose={() => setIsOpen(false)}
          open={isOpen}
          bodyStyle={{ padding: 0 }}
        >
          {chatInterface}
        </Drawer>
        {hiddenInputs}
      </>
    );
  }

  if (position === 'float') {
    return (
      <>
        <div style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 350,
          height: 500,
          zIndex: 1000,
          ...style
        }}>
          {chatInterface}
        </div>
        {hiddenInputs}
      </>
    );
  }

  // Inline position (default)
  return (
    <div className={className} style={style}>
      {chatInterface}
      {hiddenInputs}
    </div>
  );
}; 