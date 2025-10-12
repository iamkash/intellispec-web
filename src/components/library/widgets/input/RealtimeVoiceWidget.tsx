/**
 * RealtimeVoiceWidget - OpenAI Realtime API Voice Agent
 *
 * A sophisticated voice widget that integrates with OpenAI's Realtime API
 * for low-latency, multimodal voice interactions with GPT models.
 * Supports WebRTC connections and real-time audio processing.
 */

import {
  LoadingOutlined,
  PhoneFilled,
  PhoneOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Select, Space, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
const { Text, Paragraph } = Typography;
const { Option } = Select;

export interface RealtimeVoiceWidgetProps {
  id: string;
  label?: string;
  value?: {
    sessionId?: string;
    transcription?: string;
    audioData?: string;
    confidence?: number;
    realtimeEvents?: any[];
  };
  onChange?: (value: any) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  config?: {
    model?: string;
    voice?: string;
    language?: string;
    instructions?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export const RealtimeVoiceWidget: React.FC<RealtimeVoiceWidgetProps> = ({
  id,
  label = "Realtime Voice Agent",
  value = {},
  onChange,
  disabled = false,
  required = false,
  className,
  style,
  config = {}
}) => {
const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState(value.transcription || '');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [audioChunksSent, setAudioChunksSent] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bufferedSamplesRef = useRef<number>(0);
  const responseInProgressRef = useRef<boolean>(false);
  const pendingCommitRef = useRef<boolean>(false);
  const turnDetectionEnabledRef = useRef<boolean>(false);

  // Default configuration
  const defaultConfig = {
    model: 'gpt-realtime',
    voice: 'alloy',
    language: 'en-US',
    instructions: 'You are a helpful piping inspection assistant. Always respond in the same language that the user speaks. If the user speaks English, respond only in English. Wait for the user to completely finish speaking before responding. Do not switch languages or generate multiple responses.',
    temperature: 0.3,
    maxTokens: 150,
    ...config
  };
// Audio conversion functions
  const floatToPCM16 = useCallback((input: Float32Array): Int16Array => {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }, []);

  const toBase64 = useCallback((pcm16: Int16Array): string => {
    const u8 = new Uint8Array(pcm16.buffer);
    let bin = '';
    for (let i = 0; i < u8.byteLength; i++) bin += String.fromCharCode(u8[i]);
    return btoa(bin);
  }, []);

  const base64ToUint8 = useCallback((b64: string): Uint8Array => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }, []);

  const playPcm16Base64 = useCallback(async (b64: string, ctx: AudioContext) => {
    const u8 = base64ToUint8(b64);
    const pcm16 = new Int16Array(u8.buffer, u8.byteOffset, u8.byteLength / 2);
    const f32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 32768;

    const sr = 24000;
    const buf = ctx.createBuffer(1, f32.length, sr);
    buf.getChannelData(0).set(f32);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  }, []);

  const playPcm16ArrayBuffer = useCallback(async (buffer: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const pcm16 = new Int16Array(buffer);
      const f32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 32768;
      const sr = 24000;
      const buf = audioContextRef.current.createBuffer(1, f32.length, sr);
      buf.getChannelData(0).set(f32);
      const src = audioContextRef.current.createBufferSource();
      src.buffer = buf;
      src.connect(audioContextRef.current.destination);
      src.start();
} catch (err) {
      console.error('❌ [RealtimeVoiceWidget] Failed to play binary audio:', err);
    }
  }, []);

  const playAudioResponse = useCallback((audioData: string) => {
    try {
// Create audio context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Play using the new base64 function
      playPcm16Base64(audioData, audioContextRef.current);
} catch (error) {
      console.error('❌ [RealtimeVoiceWidget] Failed to play audio response:', error);
    }
  }, [playPcm16Base64]);

  const startAudioStreaming = useCallback(() => {
if (!streamRef.current || !websocketRef.current) {
      console.error('❌ [RealtimeVoiceWidget] No stream or websocket available');
      return;
    }

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      bufferedSamplesRef.current = 0;

      // Create audio processor for real-time streaming (smaller buffer for stability)
      processorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);

      // Create microphone input
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);

      // Connect source to processor
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // Track silence periods for better VAD
      let silenceFrames = 0;
      let isSpeaking = false;
      const SILENCE_THRESHOLD = 0.01; // Higher threshold for better noise filtering
      const SILENCE_FRAMES_REQUIRED = 10; // ~200ms of silence at 2048 samples/frame

      // Handle audio processing
      processorRef.current.onaudioprocess = (event) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer;
          const f32 = inputBuffer.getChannelData(0);

          // Calculate RMS (root mean square) for better volume detection
          let sum = 0;
          for (let i = 0; i < f32.length; i++) {
            sum += f32[i] * f32[i];
          }
          const rms = Math.sqrt(sum / f32.length);
          
          // Check if we have actual audio data (not just silence)
          const hasAudio = rms > SILENCE_THRESHOLD;
          
          if (!hasAudio) {
            silenceFrames++;
            // If we were speaking and now have enough silence, this might be end of utterance
            if (isSpeaking && silenceFrames >= SILENCE_FRAMES_REQUIRED) {
isSpeaking = false;
              // Don't auto-commit here since VAD will handle it
            }
            return; // Don't send silent chunks
          }

          // Don't send audio if a response is in progress
          if (responseInProgressRef.current) {
return;
          }

          // Reset silence counter and mark as speaking
          silenceFrames = 0;
          if (!isSpeaking) {
isSpeaking = true;
          }

          // Convert to PCM16 and base64
          const pcm16 = floatToPCM16(f32);
          const b64 = toBase64(pcm16);

          // Send audio data to Realtime API
          const audioMessage = JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: b64
          });
websocketRef.current.send(audioMessage);

          // Track buffered samples
          bufferedSamplesRef.current += pcm16.length;
          const bufferedMs = (bufferedSamplesRef.current / 24000) * 1000;
// Don't auto-commit when VAD is enabled - let the server handle turn detection
          // The server VAD will automatically detect end of speech and generate response
        }
      };
setIsRecording(true);

    } catch (error) {
      console.error('❌ [RealtimeVoiceWidget] Failed to start audio streaming:', error);
      setError('Failed to start audio streaming');
    }
  }, []);

  const safeCommitAndRequestResponse = useCallback(() => {
    if (turnDetectionEnabledRef.current) {
return;
    }
    if (websocketRef.current?.readyState !== WebSocket.OPEN) return;
    const minSamples = 2400; // 100ms @ 24kHz
    if (bufferedSamplesRef.current < minSamples) {
      const ms = (bufferedSamplesRef.current / 24000) * 1000;
      console.warn('⏳ [RealtimeVoiceWidget] Commit skipped: buffered', ms.toFixed(0), 'ms < 100ms');
      setError(`Need at least 100ms of audio before sending (have ${ms.toFixed(0)}ms).`);
      return;
    }
    websocketRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    bufferedSamplesRef.current = 0;
    setAudioChunksSent(0);
}, []);

  const requestResponseNow = useCallback(() => {
    if (responseInProgressRef.current) {
      pendingCommitRef.current = true;
setError('Model is responding. Your next request will be sent when it finishes.');
      return;
    }
    safeCommitAndRequestResponse();
  }, [safeCommitAndRequestResponse]);

  const handleConnect = useCallback(async () => {
    try {
setConnectionStatus('connecting');
      setError(null);
// Request microphone access at 24kHz
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000
        }
      });
streamRef.current = stream;

      // Connect to backend WebSocket proxy (which handles OpenAI authentication)
      const backendHost = window.location.host.replace(/:\d+$/, ':4000');
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${backendHost}/api/realtime/connect?model=${defaultConfig.model}`;
console.log('🔑 [RealtimeVoiceWidget] Backend handles OpenAI authentication');

      websocketRef.current = new WebSocket(wsUrl, 'realtime');

      // Configure session for Realtime API
      const originalOnOpen = () => {
websocketRef.current?.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: defaultConfig.instructions,
            voice: 'alloy',
            input_audio_format: { type: 'pcm16', sample_rate_hz: 24000 },
            output_audio_format: { type: 'pcm16', sample_rate_hz: 24000 },
            turn_detection: { 
              type: 'semantic_vad', 
              create_response: true,
              threshold: 0.8,  // Higher threshold = less sensitive, requires clearer end of speech
              silence_duration_ms: 1000  // Wait for 1 second of silence before responding
            }
          }
        }));
        turnDetectionEnabledRef.current = true;
};

      websocketRef.current.onopen = () => {
        originalOnOpen();
        // Call the original onopen handler
clearTimeout(connectionTimeout);
        setIsConnected(true);
        setConnectionStatus('connected');

        // Start audio streaming after session is configured
        setTimeout(() => {
startAudioStreaming();
        }, 2000);
      };

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        console.error('⏰ [RealtimeVoiceWidget] Connection timeout after 10 seconds');
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.CONNECTING) {
websocketRef.current.close();
          setError('Connection timeout. Please check your network and try again.');
          setConnectionStatus('error');
        }
      }, 10000); // 10 second timeout


      websocketRef.current.onmessage = (event) => {
        try {
          // Handle both text (JSON) and binary (audio) messages
          if (typeof event.data === 'string') {
            const message = JSON.parse(event.data);
handleRealtimeMessage(message);
          } else if (event.data instanceof Blob) {
            // Binary audio (PCM16) from backend → play at 24kHz
event.data.arrayBuffer().then(buffer => {
playPcm16ArrayBuffer(buffer);
            });
          } else if (event.data instanceof ArrayBuffer) {
            // Binary audio (PCM16) from backend → play at 24kHz
playPcm16ArrayBuffer(event.data);
          } else {
}
        } catch (error) {
          console.error('❌ [RealtimeVoiceWidget] Failed to process message:', event.data, error);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('❌ [RealtimeVoiceWidget] WebSocket error:', error);
        clearTimeout(connectionTimeout);
        setError('Failed to connect to realtime service. Please check your connection and try again.');
        setConnectionStatus('error');
      };

      websocketRef.current.onclose = (event) => {
        console.log('🔌 [RealtimeVoiceWidget] WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setIsRecording(false);
      };

    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to access microphone or connect to Realtime API');
      setConnectionStatus('error');
    }
  }, [defaultConfig]);

  const handleRealtimeMessage = useCallback((message: any) => {
switch (message.type) {
      case 'response.created':
        // If a response is already in progress, cancel this new one
        if (responseInProgressRef.current) {
if (websocketRef.current?.readyState === WebSocket.OPEN && message.response?.id) {
            websocketRef.current.send(JSON.stringify({ 
              type: 'response.cancel',
              response_id: message.response.id 
            }));
          }
          return; // Don't process this duplicate response
        }
        
        responseInProgressRef.current = true;
// Clear the input buffer immediately to prevent additional responses
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
          bufferedSamplesRef.current = 0;
}
        break;

      case 'conversation.item.input_audio_transcription.completed':
        const newTranscription = message.transcript;
setTranscription(prev => prev + ' ' + newTranscription);
        break;

      case 'response.output_audio.delta':
// Handle audio output - base64 PCM16 from OpenAI
        if (message.delta) {
playAudioResponse(message.delta);
        }
        break;

      case 'response.output_text.delta':
// Handle text output
        break;

      case 'response.done':
        responseInProgressRef.current = false;
// Implement a cooldown period to prevent immediate new responses
        setTimeout(() => {
if (pendingCommitRef.current) {
            const minSamples = 2400; // 100ms
            if (bufferedSamplesRef.current >= minSamples) {
safeCommitAndRequestResponse();
            } else {
}
            pendingCommitRef.current = false;
          }
        }, 2000); // 2 second cooldown before accepting new input
        break;

      case 'error':
        console.error('❌ [RealtimeVoiceWidget] Realtime API error:', message.error);
        setError(message.error.message);
        break;

      case 'session.created':
break;

      case 'session.updated':
break;

      default:
}
  }, []);

  const handleDisconnect = useCallback(() => {
// Clear heartbeat interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Stop audio streaming
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsRecording(false);
}, []);

  const handleValueChange = useCallback((newValue: any) => {
    const updatedValue = {
      ...value,
      ...newValue,
      transcription,
      sessionId: websocketRef.current ? 'active' : undefined
    };
    onChange?.(updatedValue);
  }, [value, transcription, onChange]);

  useEffect(() => {
    return () => {
handleDisconnect();
    };
  }, [handleDisconnect]);

  return (
    <Card
      className={className}
      style={style}
      title={
        <Space>
          <SoundOutlined />
          {label}
          {required && <span style={{ color: 'red' }}>*</span>}
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Connection Status */}
        <Space>
          <Button
            type={isConnected ? "default" : "primary"}
            icon={isConnected ? <PhoneFilled /> : <PhoneOutlined />}
            onClick={() => {
if (isConnected) {
handleDisconnect();
              } else {
handleConnect();
              }
            }}
            disabled={disabled || connectionStatus === 'connecting'}
            loading={connectionStatus === 'connecting'}
          >
            {connectionStatus === 'connecting' ? 'Connecting...' :
             isConnected ? 'Disconnect' : 'Connect Realtime'}
          </Button>

          {isConnected && isRecording && (
            <Button
              type="primary"
              onClick={() => {
if (websocketRef.current?.readyState === WebSocket.OPEN) {
                  requestResponseNow();
                }
              }}
              size="small"
              style={{ marginLeft: 8 }}
            >
              Send Message
            </Button>
          )}

          <Text type={
            connectionStatus === 'connected' ? 'success' :
            connectionStatus === 'error' ? 'danger' : 'secondary'
          }>
            {connectionStatus === 'connected' ? '🟢 Connected' :
             connectionStatus === 'connecting' ? '🟡 Connecting...' :
             connectionStatus === 'error' ? '🔴 Error' : '⚪ Disconnected'}
          </Text>
        </Space>

        {/* Voice Configuration */}
        {isConnected && (
          <Space>
            <Text strong>Voice:</Text>
            <Select
              value={defaultConfig.voice}
              style={{ width: 100 }}
              disabled
              size="small"
            >
              <Option value="alloy">Alloy</Option>
              <Option value="echo">Echo</Option>
              <Option value="fable">Fable</Option>
              <Option value="onyx">Onyx</Option>
              <Option value="nova">Nova</Option>
              <Option value="shimmer">Shimmer</Option>
            </Select>
          </Space>
        )}

        {/* Recording Status */}
        {isRecording && (
          <Alert
            message="Listening..."
            description="Speak naturally. The AI will respond in real-time."
            type="info"
            showIcon
            icon={<LoadingOutlined spin />}
          />
        )}

        {/* Transcription */}
        {transcription && (
          <Card size="small" title="Transcription">
            <Paragraph
              ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
              copyable
            >
              {transcription}
            </Paragraph>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert
            message="Realtime Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {/* Instructions */}
        <Alert
          message="Realtime Voice Agent"
          description="Connect to start a real-time voice conversation with AI. The AI will respond with both voice and text."
          type="info"
          showIcon={false}
        />
      </Space>
    </Card>
  );
};

export default RealtimeVoiceWidget;
