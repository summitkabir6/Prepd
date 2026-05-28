/**
 * ElevenLabs Speech-to-Text
 * Sends a recorded audio blob to ElevenLabs and returns the transcript.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY as string;

  if (!apiKey) {
    throw new Error('Missing VITE_ELEVENLABS_API_KEY in .env');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model_id', 'scribe_v1');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs STT error: ${response.status} — ${errorText}`);
  }

  const data = await response.json();

  // ElevenLabs returns { text: "..." }
  if (typeof data.text === 'string') return data.text;

  // Fallback for different response shapes
  if (data.transcription) return data.transcription;

  throw new Error('Unexpected ElevenLabs response shape');
}

/**
 * Check if MediaRecorder is available in this browser.
 */
export function isMicrophoneSupported(): boolean {
  return !!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices && 'MediaRecorder' in window);
}
