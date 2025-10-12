/**
 * AudioRecorderWidget - Voice recording component
 * 
 * A form input widget for recording audio using device microphone.
 * Basic recording functionality with play/pause controls.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button, Space, Typography, Progress } from 'antd';
import { AudioOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface AudioRecorderWidgetProps {
  id: string;
  label?: string;
  value?: string; // base64 audio
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AudioRecorderWidget: React.FC<AudioRecorderWidgetProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  className,
  style,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(value);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          onChange?.(base64);
        };
        reader.readAsDataURL(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [onChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const playAudio = useCallback(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <div className={className} style={style}>
      {label && (
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          {!isRecording ? (
            <Button
              icon={<AudioOutlined />}
              onClick={startRecording}
              disabled={disabled}
              type="primary"
            >
              Record
            </Button>
          ) : (
            <Button
              icon={<StopOutlined />}
              onClick={stopRecording}
              danger
            >
              Stop
            </Button>
          )}
          
          {audioUrl && (
            <Button
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={isPlaying ? pauseAudio : playAudio}
              disabled={disabled}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          )}
        </Space>
        
        {isRecording && (
          <Text type="secondary">Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</Text>
        )}
        
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
        )}
      </Space>
    </div>
  );
};

export default AudioRecorderWidget; 