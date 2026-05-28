import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { transcribeAudio, isMicrophoneSupported } from '@/lib/elevenlabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type RecordState = 'idle' | 'recording' | 'transcribing' | 'error';

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordState>('idle');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const supported = isMicrophoneSupported();

  const startRecording = useCallback(async () => {
    if (disabled || state !== 'idle') return;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState('transcribing');

        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const text = await transcribeAudio(blob);
          onTranscript(text);
          setState('idle');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Transcription failed');
          setState('error');
        }
      };

      mediaRecorder.start();
      setState('recording');
    } catch (err) {
      setError('Microphone access denied. Check your browser permissions.');
      setState('error');
    }
  }, [disabled, state, onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  if (!supported) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={disabled || state === 'transcribing'}
        className={cn(
          'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-ring',
          state === 'recording'
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-200'
            : 'bg-primary hover:bg-primary/90 shadow-md',
          (disabled || state === 'transcribing') && 'opacity-50 cursor-not-allowed'
        )}
      >
        {state === 'transcribing' ? (
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        ) : state === 'recording' ? (
          <MicOff className="h-8 w-8 text-white" />
        ) : (
          <Mic className="h-8 w-8 text-white" />
        )}

        {state === 'recording' && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
        )}
      </button>

      <p className="text-sm text-muted-foreground select-none">
        {state === 'idle' && 'Hold to record'}
        {state === 'recording' && 'Recording… release to stop'}
        {state === 'transcribing' && 'Transcribing…'}
        {state === 'error' && (
          <span className="text-destructive">{error}</span>
        )}
      </p>
    </div>
  );
}
