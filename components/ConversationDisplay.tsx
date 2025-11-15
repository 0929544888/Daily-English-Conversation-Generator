import React from 'react';
import { DialogueTurn } from '../types';
import SpeakerIcon from './SpeakerIcon';
import PlayButton from './PlayButton';
import SaveConversationButton from './SaveConversationButton';
import DownloadAllAudioButton from './DownloadAllAudioButton';

interface ConversationDisplayProps {
  conversation: DialogueTurn[];
  topic: string;
}

const HighlightedText: React.FC<{ text: string, highlights: string[] }> = ({ text, highlights }) => {
    if (!highlights || highlights.length === 0) {
        return <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{text}</p>;
    }

    // Escape special characters for regex and join with '|'
    const escapedHighlights = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedHighlights.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {parts.map((part, index) => {
                const isHighlight = highlights.some(h => h.toLowerCase() === part.toLowerCase());
                return isHighlight ? (
                    <strong key={index} className="font-bold text-blue-600 dark:text-blue-400 underline decoration-wavy decoration-blue-500/50 underline-offset-2">
                        {part}
                    </strong>
                ) : (
                    <React.Fragment key={index}>{part}</React.Fragment>
                );
            })}
        </p>
    );
};


const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ conversation, topic }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold border-b-2 border-blue-400 dark:border-blue-500 pb-2 text-gray-800 dark:text-gray-100">
            English Conversation
          </h2>
          <div className="flex items-center space-x-2">
            <SaveConversationButton conversation={conversation} topic={topic} />
            <DownloadAllAudioButton conversation={conversation} />
          </div>
        </div>
        <div className="space-y-4">
          {conversation.map((turn, index) => (
            <div key={`en-${index}`} className="flex items-start gap-3">
              <SpeakerIcon speaker={turn.speaker} />
              <div className="flex-1 flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <HighlightedText text={turn.english} highlights={turn.vocab} />
                <PlayButton text={turn.english} lang="en-US" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-600 my-6"></div>

      <div>
        <h2 className="text-2xl font-bold mb-4 border-b-2 border-teal-400 dark:border-teal-500 pb-2 text-gray-800 dark:text-gray-100">
          中文翻譯 (Traditional Chinese)
        </h2>
        <div className="space-y-4">
          {conversation.map((turn, index) => (
            <div key={`zh-${index}`} className="flex items-start gap-3">
              <SpeakerIcon speaker={turn.speaker} />
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-gray-800 dark:text-gray-200">{turn.chinese}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationDisplay;
