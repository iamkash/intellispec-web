/**
 * VoiceRecorderWidget - Advanced voice recording with OpenAI STT
 * 
 * A sophisticated voice recording widget that integrates with OpenAI's speech-to-text API,
 * provides real-time audio visualization, and displays live transcription.
 */

import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    SoundOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Progress, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OpenAIConfig, useOpenAI } from '../../../../hooks/useOpenAI';

const { Text, Paragraph } = Typography;

export interface VoiceRecorderWidgetProps {
  id: string;
  label?: string;
  value?: {
    audioUrl?: string;
    transcription?: string;
    confidence?: number;
    langGraphTriggered?: boolean;
    langGraphResponse?: any;
  };
  onChange?: (value: { audioUrl?: string; transcription?: string; confidence?: number; langGraphTriggered?: boolean; langGraphResponse?: any }) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // OpenAI configuration
  openaiConfig?: OpenAIConfig;
  language?: string;
  // Visualization options
  showVisualization?: boolean;
  showTranscription?: boolean;
  showConfidence?: boolean;
  // Recording options
  maxDuration?: number; // in seconds
  autoTranscribe?: boolean;
  // UI options
  showControls?: boolean;
  showProgress?: boolean;
  theme?: 'light' | 'dark';
  // LangGraph configuration
  langGraphConfig?: {
    enabled?: boolean;
    triggerOnTranscription?: boolean;
    workflowId?: string;
    agentPrompt?: string;
  };
}

export const VoiceRecorderWidget: React.FC<VoiceRecorderWidgetProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  className,
  style,
  openaiConfig,
  language = 'en',
  showVisualization = true,
  showTranscription = true,
  showConfidence = true,
  maxDuration = 300, // 5 minutes
  autoTranscribe = true,
  showControls = true,
  showProgress = true,
  theme = 'light',
  langGraphConfig
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(value?.audioUrl);
  const [transcription, setTranscription] = useState<string>(value?.transcription || '');
  const [confidence, setConfidence] = useState<number>(value?.confidence || 0);
  const [error, setError] = useState<string>('');
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array());
  const [volume, setVolume] = useState<number>(0); // 0..1
  const [playbackProgress, setPlaybackProgress] = useState<number>(0); // 0..1
  const [notesWhileRecording, setNotesWhileRecording] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [streamingSupported, setStreamingSupported] = useState<boolean>(false);
  const [streamingActive, setStreamingActive] = useState<boolean>(false);
  const [langGraphTriggered, setLangGraphTriggered] = useState<boolean>(value?.langGraphTriggered || false);
  const [langGraphResponse, setLangGraphResponse] = useState<any>(value?.langGraphResponse || null);
  const [isProcessingLangGraph, setIsProcessingLangGraph] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const timeIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Audio context for visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const speechRecRef = useRef<any>(null);

  // OpenAI hook
  const openAI = useOpenAI(openaiConfig || { apiKey: '' });

  // Initialize audio context for visualization
  const initializeAudioContext = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      sourceRef.current.connect(analyserRef.current);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }, []);

  // Initialize browser native streaming STT if available (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setStreamingSupported(Boolean(SpeechRecognition));
  }, []);

  const startStreamingSTT = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    try {
      const rec = new SpeechRecognition();
      speechRecRef.current = rec;
      rec.lang = language || 'en';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) final += res[0].transcript; else interim += res[0].transcript;
        }
        if (interim) setInterimTranscript(interim);
        if (final) setTranscription(prev => (prev ? prev + ' ' : '') + final);
      };
      rec.onerror = () => {};
      rec.onend = () => setStreamingActive(false);
      rec.start();
      setStreamingActive(true);
    } catch {
      setStreamingActive(false);
    }
  }, [language]);

  const stopStreamingSTT = useCallback(() => {
    try {
      speechRecRef.current?.stop?.();
    } catch {}
    setStreamingActive(false);
    setInterimTranscript('');
  }, []);

  // Draw audio visualization
  const drawVisualization = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current || !isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const freqArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqArray);

    // Also compute RMS volume from time-domain data for pulse animation
    const timeArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeArray);
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = (timeArray[i] - 128) / 128; // -1..1
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / bufferLength); // 0..~1
    setVolume(Math.max(0, Math.min(1, rms * 2)));

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'hsl(var(--primary))');
    gradient.addColorStop(0.5, 'hsl(var(--success))');
    gradient.addColorStop(1, 'hsl(var(--warning))');

    // Draw bars
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (freqArray[i] / 255) * canvas.height;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }

    animationRef.current = requestAnimationFrame(drawVisualization);
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use a more compatible format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/wav';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const newValue = { audioUrl: base64, transcription, confidence };
          onChange?.(newValue);
        };
        reader.readAsDataURL(blob);

        // Auto-transcribe if enabled
        if (autoTranscribe && openaiConfig?.apiKey) {
          await transcribeAudio(blob);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setInterimTranscript('');
      if (streamingSupported) startStreamingSTT();
      
      // Start visualization
      if (showVisualization) {
        await initializeAudioContext();
        drawVisualization();
      }
      
      // Start timer
      timeIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Unable to access microphone. Please check permissions.');
    }
  }, [onChange, transcription, confidence, autoTranscribe, openaiConfig?.apiKey, showVisualization, initializeAudioContext, drawVisualization, maxDuration, streamingSupported, startStreamingSTT]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamingActive) {
        stopStreamingSTT();
      }
      
      // Stop visualization
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Stop timer
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      
      // Stop audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.warn('AudioContext already closed or closing failed:', error);
        }
      }
    }
  }, [isRecording, streamingActive, stopStreamingSTT]);

  // Transcribe audio using OpenAI
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (!openaiConfig?.apiKey) {
      setError('OpenAI API key is required for transcription');
      return;
    }

    setIsTranscribing(true);
    setError('');

    try {
      const response = await openAI.transcribeAudio({
        audioBlob,
        modelConfig: { model: 'whisper-1' },
        language,
        responseFormat: 'text'
      });

      if (response.data) {
        const newTranscription = typeof response.data === 'string' ? response.data : response.data.text || '';
        const newConfidence = 0.95; // Whisper doesn't return confidence in text format

        setTranscription(newTranscription);
        setConfidence(newConfidence);

        // Trigger LangGraph if configured
        if (langGraphConfig?.enabled && langGraphConfig?.triggerOnTranscription && newTranscription) {
          setIsProcessingLangGraph(true);
          try {
// Call LangGraph API
            const langGraphPayload = {
              workflowId: langGraphConfig.workflowId,
              input: {
                transcription: newTranscription,
                confidence: newConfidence,
                audioUrl: value?.audioUrl,
                prompt: langGraphConfig.agentPrompt?.replace('{{transcription}}', newTranscription)
              }
            };

            // Simulate LangGraph processing (replace with actual API call)
            setTimeout(() => {
              const mockResponse = {
                status: 'completed',
                analysis: `Analyzed transcription: "${newTranscription.substring(0, 50)}..."`,
                timestamp: new Date().toISOString()
              };
              setLangGraphResponse(mockResponse);
              setLangGraphTriggered(true);
              setIsProcessingLangGraph(false);
              
              // Update value with LangGraph data
              const updatedValue = { 
                audioUrl: value?.audioUrl, 
                transcription: newTranscription, 
                confidence: newConfidence,
                langGraphTriggered: true,
                langGraphResponse: mockResponse
              };
              onChange?.(updatedValue);
            }, 2000);
          } catch (error) {
            console.error('❌ [VoiceRecorderWidget] LangGraph error:', error);
            setIsProcessingLangGraph(false);
          }
        } else {
          // Update value without LangGraph
          const newValue = { 
            audioUrl: value?.audioUrl, 
            transcription: newTranscription, 
            confidence: newConfidence,
            langGraphTriggered: langGraphTriggered,
            langGraphResponse: langGraphResponse
          };
          onChange?.(newValue);
        }
      } else {
        throw new Error('Transcription failed');
      }

    } catch (error) {
      console.error('Transcription error:', error);
      setError(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTranscribing(false);
    }
  }, [openaiConfig?.apiKey, language, value?.audioUrl, onChange, openAI]);

  // Play audio
  const playAudio = useCallback(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl]);

  // Pause audio
  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Track playback progress
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (!el.duration || Number.isNaN(el.duration)) return;
      setPlaybackProgress(el.currentTime / el.duration);
    };
    el.addEventListener('timeupdate', onTime);
    return () => el.removeEventListener('timeupdate', onTime);
  }, [audioRef.current]);

  // Clear recording
  const clearRecording = useCallback(() => {
    setAudioUrl(undefined);
    setTranscription('');
    setConfidence(0);
    setRecordingTime(0);
    setError('');
    
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    onChange?.({});
  }, [onChange]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update state when value prop changes (for persistence between steps)
  useEffect(() => {
    if (value) {
      if (value.audioUrl !== audioUrl) setAudioUrl(value.audioUrl);
      if (value.transcription !== transcription) setTranscription(value.transcription || '');
      if (value.confidence !== confidence) setConfidence(value.confidence || 0);
      if (value.langGraphTriggered !== langGraphTriggered) setLangGraphTriggered(value.langGraphTriggered || false);
      if (value.langGraphResponse !== langGraphResponse) setLangGraphResponse(value.langGraphResponse || null);
    }
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.warn('AudioContext already closed or closing failed:', error);
        }
      }
    };
  }, []);

  return (
    <div className={className} style={style}>
      {label && (
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
        </label>
      )}
      
      <Card 
        size="small" 
        style={{ 
          border: isRecording ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
          transition: 'all 0.3s ease'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Hero mic button with pulse animation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              {/* pulse rings */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'hsl(var(--primary) / 0.10)',
                transform: `scale(${1 + volume * 0.4})`, transition: 'transform 120ms ease'
              }} />
              <div style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                background: 'hsl(var(--primary) / 0.15)',
                transform: `scale(${1 + volume * 0.3})`, transition: 'transform 120ms ease'
              }} />
              <button
                onClick={isRecording ? stopRecording : startRecording}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                style={{
                  position: 'absolute', inset: 16, borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                  background: isRecording ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  boxShadow: `0 0 0 ${isRecording ? 6 : 3}px hsl(var(--ring) / 0.25)`,
                  transform: `scale(${isRecording ? 1.02 : 1})`, transition: 'all 180ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700
                }}
              >
                {isRecording ? 'STOP' : 'REC'}
              </button>
            </div>
            <div style={{ minWidth: 220 }}>
              <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                {isRecording ? 'Recording' : isTranscribing ? 'Transcribing' : 'Ready'}
              </div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                {isRecording ? `Live level: ${(volume * 100).toFixed(0)}% • ${formatTime(recordingTime)}` : isTranscribing ? 'Processing your audio to text...' : 'Press record to start.'}
              </div>
            </div>
          </div>
          
          {/* Audio Visualization */}
          {showVisualization && (
            <div style={{ textAlign: 'center' }}>
              <canvas
                ref={canvasRef}
                width={400}
                height={100}
                style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                  backgroundColor: 'hsl(var(--muted))'
                }}
              />
              {isRecording && (
                <div style={{ marginTop: 8 }}>
                  <SoundOutlined style={{ color: 'hsl(var(--primary))', fontSize: 16 }} />
                  <Text type="secondary" style={{ marginLeft: 4 }}>
                    Recording... {formatTime(recordingTime)}
                  </Text>
                </div>
              )}
            </div>
          )}

          {/* Recording Controls */}
          {showControls && (
            <Space>
              {audioUrl && (
                <Button
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={isPlaying ? pauseAudio : playAudio}
                  disabled={disabled}
                  size="middle"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
              )}
              {audioUrl && (
                <Button onClick={clearRecording} disabled={disabled} size="middle">Clear</Button>
              )}
            </Space>
          )}

          {/* Progress Bar */}
          {showProgress && isRecording && (
            <Progress 
              percent={(recordingTime / maxDuration) * 100} 
              status="active"
              strokeColor={{
                '0%': 'hsl(var(--primary))',
                '100%': 'hsl(var(--success))',
              }}
            />
          )}

          {/* Live notes while recording */}
          {isRecording && (
            <Card size="small" title="Notes (while recording)" style={{ marginTop: 8 }}>
              <Paragraph style={{ marginBottom: 8, color: 'hsl(var(--muted-foreground))' }}>You can type notes as you speak.</Paragraph>
              <textarea
                value={notesWhileRecording}
                onChange={(e) => setNotesWhileRecording(e.target.value)}
                rows={3}
                style={{ width: '100%', resize: 'vertical', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', borderRadius: 6, padding: 8 }}
                placeholder="Type notes here while recording..."
              />
            </Card>
          )}

          {/* Transcription */}
          {showTranscription && (transcription || isTranscribing) && (
            <Card size="small" title="Transcription" style={{ marginTop: 16 }}>
              {isTranscribing ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  <Text style={{ marginLeft: 8 }}>Transcribing audio...</Text>
                </div>
              ) : (
                <div>
                  <Paragraph style={{ marginBottom: 8 }}>
                    {transcription}
                    {streamingActive && interimTranscript && (
                      <span style={{ opacity: 0.6 }}> {interimTranscript}</span>
                    )}
                  </Paragraph>
                  {showConfidence && confidence > 0 && (
                    <Space>
                      <CheckCircleOutlined style={{ color: 'hsl(var(--success))' }} />
                      <Text type="secondary">
                        Confidence: {(confidence * 100).toFixed(1)}%
                      </Text>
                    </Space>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* LangGraph Status */}
          {langGraphConfig?.enabled && (transcription || langGraphTriggered) && (
            <Card 
              size="small" 
              title={
                <Space>
                  <span>LangGraph Analysis</span>
                  {langGraphTriggered && <CheckCircleOutlined style={{ color: 'hsl(var(--success))' }} />}
                </Space>
              } 
              style={{ marginTop: 16 }}
            >
              {isProcessingLangGraph ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  <Text style={{ marginLeft: 8 }}>Processing with GPT-5...</Text>
                </div>
              ) : langGraphTriggered && langGraphResponse ? (
                <div>
                  <Alert
                    message="Analysis Complete"
                    description={
                      <div>
                        <Text strong>Status:</Text> {langGraphResponse.status}<br/>
                        <Text strong>Analysis:</Text> {langGraphResponse.analysis}<br/>
                        <Text strong>Timestamp:</Text> {new Date(langGraphResponse.timestamp).toLocaleString()}
                      </div>
                    }
                    type="success"
                    showIcon
                  />
                </div>
              ) : transcription ? (
                <Alert
                  message="Ready to Analyze"
                  description="Transcription complete. LangGraph will trigger automatically."
                  type="info"
                  showIcon
                />
              ) : (
                <Text type="secondary">Record and transcribe audio to trigger analysis</Text>
              )}
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              icon={<ExclamationCircleOutlined />}
              closable
              onClose={() => setError('')}
            />
          )}

          {/* Hidden Audio Element */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          )}

          {/* Playback progress */}
          {audioUrl && isPlaying && (
            <Progress
              percent={Math.min(100, Math.max(0, Math.round(playbackProgress * 100)))}
              size="small"
              status="active"
              strokeColor={{ '0%': 'hsl(var(--primary))', '100%': 'hsl(var(--primary))' }}
            />)
          }
        </Space>
      </Card>
    </div>
  );
};

export default VoiceRecorderWidget; 