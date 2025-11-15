import React, { useState } from 'react';
import { DialogueTurn } from '../types';

interface SaveConversationButtonProps {
  conversation: DialogueTurn[];
  topic: string;
}

const SaveConversationButton: React.FC<SaveConversationButtonProps> = ({ conversation, topic }) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!conversation || conversation.length === 0) return;

    // 1. Format the content
    const topicText = topic.trim() ? topic.trim() : 'Random';
    let content = `Topic: ${topicText}\n\n`;
    content += '--- Conversation ---\n\n';

    conversation.forEach(turn => {
      content += `${turn.speaker}: ${turn.english}\n`;
      if (turn.vocab && turn.vocab.length > 0) {
        content += `  (Key Vocabulary: ${turn.vocab.join(', ')})\n`;
      }
      content += `(中文: ${turn.chinese})\n\n`;
    });
    
    // Add UTF-8 BOM for better compatibility with text editors like Notepad
    const contentWithBom = '\uFEFF' + content.trim();

    // 2. Create a blob and URL
    const blob = new Blob([contentWithBom], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // 3. Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    link.download = `english-conversation-${date}.txt`;
    
    // 4. Trigger download and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 5. Provide user feedback
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <button
      onClick={handleSave}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all"
      aria-label={isSaved ? "Conversation saved" : "Save conversation"}
      title={isSaved ? "Conversation saved!" : "Save conversation"}
    >
      {isSaved ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
    </button>
  );
};

export default SaveConversationButton;
