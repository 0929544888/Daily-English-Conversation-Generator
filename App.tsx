
import React, { useState, useCallback, useEffect } from 'react';
import { DialogueTurn } from './types';
import { generateConversation, ConversationStyle } from './components/services/geminiService';
import ConversationDisplay from './components/ConversationDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Record<ConversationStyle, DialogueTurn[]> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<ConversationStyle>('standard');

  const handleGenerateConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setConversations(null); // Clear previous conversations on new generation
    try {
      const styles: ConversationStyle[] = ['standard', 'normal_colloquial', 'unfiltered'];
      // Generate all three conversation styles in parallel
      const results = await Promise.all(
        styles.map(style => generateConversation(customTopic, style))
      );
      
      const newConversations: Record<ConversationStyle, DialogueTurn[]> = {
        standard: results[0],
        normal_colloquial: results[1],
        unfiltered: results[2],
      };
      
      setConversations(newConversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setConversations(null);
    } finally {
      setIsLoading(false);
    }
  }, [customTopic]);

  useEffect(() => {
    // Initial generation on component mount
    handleGenerateConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
            每日英語對話
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            為語言學習者設計的 AI 生成對話
          </p>
        </header>

        <section className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-shadow duration-300 hover:shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            客製化對話
          </h2>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="輸入一個主題，例如：計畫週末旅行..."
                  className="flex-grow w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleGenerateConversation(); }}
                  disabled={isLoading}
                />
                <button
                    onClick={handleGenerateConversation}
                    disabled={isLoading}
                    className="flex-shrink-0 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    aria-label="Generate conversation for the custom topic"
                    title="開始生成"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">對話風格</legend>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0">
                {(['standard', 'normal_colloquial', 'unfiltered'] as ConversationStyle[]).map((s) => (
                  <div key={s} className="flex items-center">
                    <input
                      id={`style-${s}`}
                      name="conversation-style"
                      type="radio"
                      checked={selectedStyle === s}
                      onChange={() => setSelectedStyle(s)}
                      disabled={isLoading || !conversations}
                      className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <label htmlFor={`style-${s}`} className={`ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 select-none ${(isLoading || !conversations) ? 'cursor-not-allowed text-gray-400 dark:text-gray-500' : 'cursor-pointer'}`}>
                      {s === 'standard' && '標準英語 (Standard)'}
                      {s === 'normal_colloquial' && '一般口語 (Normal)'}
                      {s === 'unfiltered' && '髒話模式 (Unfiltered)'}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            主題留白將生成隨機對話。點擊生成後，即可切換三種風格。
           </p>
        </section>

        <main className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} onRetry={handleGenerateConversation} />}
            {!isLoading && !error && conversations && (
              <ConversationDisplay conversation={conversations[selectedStyle]} topic={customTopic} />
            )}
          </div>
          <footer className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleGenerateConversation}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5M15 4h5v5M9 20H4v-5" />
              </svg>
              {isLoading ? '生成中...' : '生成新對話'}
            </button>
          </footer>
        </main>
        
        <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            由 Google Gemini API 驅動。僅供教育目的使用。
        </p>
      </div>
    </div>
  );
};

export default App;
