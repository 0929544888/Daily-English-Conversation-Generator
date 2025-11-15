
import React, { useState, useEffect } from 'react';
import { generateSpeech } from './services/geminiService';
import { playAudio } from '../utils/audioUtils';

interface PlayButtonProps {
  text: string;
  lang: 'en-US' | 'zh-TW';
}

// To ensure only one audio plays at a time
let currentAudioSource: AudioBufferSourceNode | null = null;
let stopCurrentAudio = () => {
    if (currentAudioSource) {
        try {
            currentAudioSource.stop();
            currentAudioSource.disconnect();
        } catch (e) {
            console.warn("Could not stop previous audio source", e);
        }
        currentAudioSource = null;
    }
}

const PlayButton: React.FC<PlayButtonProps> = ({ text, lang }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (isFetching) return;

    if (isPlaying) {
      stopCurrentAudio();
      setIsPlaying(false);
      return;
    }

    setIsFetching(true);
    stopCurrentAudio(); // Stop any other playing audio

    try {
      const base64Audio = await generateSpeech(text, lang);
      const source = await playAudio(base64Audio);

      currentAudioSource = source;
      
      source.onended = () => {
        setIsPlaying(false);
        if (currentAudioSource === source) {
           currentAudioSource = null;
        }
      };

      source.start();
      setIsPlaying(true);

    } catch (error) {
      console.error("Failed to play audio:", error);
      alert(error instanceof Error ? error.message : "An unknown audio error occurred.");
    } finally {
      setIsFetching(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopCurrentAudio();
      }
    };
  }, [isPlaying]);

  const renderIcon = () => {
    if (isFetching) {
      return (
        <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    if (isPlaying) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.683 3.667 11 3.879 11 4.293v15.414c0 .414-.317.626-.707.354L5.586 15z" />
        </svg>
    );
  }

  return (
    <button
      onClick={handlePlay}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
      aria-label={isPlaying ? "Stop audio" : "Play audio"}
      disabled={isFetching}
    >
      {renderIcon()}
    </button>
  );
};

export default PlayButton;
