
import React, { useState } from 'react';
import { DialogueTurn } from '../types';
import { generateSpeech } from './services/geminiService';
import { decode, createWavBlobFromPcmBytes } from '../utils/audioUtils';

interface DownloadAllAudioButtonProps {
  conversation: DialogueTurn[];
}

const DownloadAllAudioButton: React.FC<DownloadAllAudioButtonProps> = ({ conversation }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleDownloadAll = async () => {
    if (status === 'loading') return;

    setStatus('loading');

    try {
      // 1. Fetch all audio data in parallel
      const audioPromises = conversation.map(turn => generateSpeech(turn.english, 'en-US'));
      const base64AudioArray = await Promise.all(audioPromises);

      // 2. Decode PCM data and prepare for concatenation with silence
      const pcmByteArrays = base64AudioArray.map(b64 => decode(b64));
      const silenceDurationMs = 250; // Pause between sentences
      const sampleRate = 24000;
      const bytesPerSample = 2; // 16-bit
      const silenceBytesLength = Math.round(sampleRate * (silenceDurationMs / 1000) * bytesPerSample);
      const silenceBytes = new Uint8Array(silenceBytesLength); // Initializes with zeros

      const totalLength = pcmByteArrays.reduce((acc, arr) => acc + arr.length, 0) + (pcmByteArrays.length > 1 ? silenceBytes.length * (pcmByteArrays.length - 1) : 0);
      const combinedPcmBytes = new Uint8Array(totalLength);

      let offset = 0;
      pcmByteArrays.forEach((pcmBytes, index) => {
        combinedPcmBytes.set(pcmBytes, offset);
        offset += pcmBytes.length;
        // Add silence after each clip except the last one
        if (index < pcmByteArrays.length - 1) {
          combinedPcmBytes.set(silenceBytes, offset);
          offset += silenceBytes.length;
        }
      });


      // 3. Create a single WAV blob from the combined data
      const wavBlob = createWavBlobFromPcmBytes(combinedPcmBytes);
      const url = URL.createObjectURL(wavBlob);

      // 4. Trigger the download for the single file
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.download = `conversation-audio-${date}.wav`;
      link.href = url;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus('success');
    } catch (error) {
      console.error("Failed to download combined audio:", error);
      alert(error instanceof Error ? error.message : "An unknown error occurred while generating the combined audio file.");
      setStatus('error');
    } finally {
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
       case 'error':
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
      case 'idle':
      default:
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    }
  };

  return (
    <button
      onClick={handleDownloadAll}
      disabled={status === 'loading'}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-wait"
      aria-label="Download all audio"
      title="Download entire conversation as a single .wav file"
    >
      {renderContent()}
    </button>
  );
};

export default DownloadAllAudioButton;
