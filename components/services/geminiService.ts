
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DialogueTurn } from '../../types';

const API_KEY = process.env.API_KEY;

// Check for API key at module initialization
if (!API_KEY) {
  throw new Error("The API_KEY environment variable is missing. The application cannot function without it.");
}

// Assumes API_KEY is set in the environment
const ai = new GoogleGenAI({ apiKey: API_KEY });

export type ConversationStyle = 'standard' | 'normal_colloquial' | 'unfiltered';

const createPrompt = (topic?: string, style: ConversationStyle = 'standard'): string => {
  const topicInstruction = topic 
    ? `The conversation should be about the following topic: "${topic}".`
    : `The conversation should cover general topics like daily life, work, plans, or complaining about something.`;
    
  let styleInstruction: string;
  let example: string;

  switch (style) {
    case 'normal_colloquial':
      styleInstruction = `The conversation style should be normal colloquial English. Use common contractions (like "gonna", "wanna", "ain't"), slang, and a natural, friendly tone. It should sound like how friends or colleagues casually talk. However, please AVOID using any profanity (swear words) or offensive/dark humor. Keep it light and realistic for everyday situations.`;
      example = `
    Example of a single object for "Normal Colloquial" style:
    {
      "speaker": "A",
      "english": "Hey, you wanna grab a bite later? I'm starving.",
      "chinese": "嘿，你晚點想不想吃點東西？我餓死了。",
      "vocab": ["wanna", "grab a bite", "starving"]
    }`;
      break;
    case 'unfiltered':
      styleInstruction = `The conversation style must be extremely colloquial and unfiltered, reflecting how some Americans might speak in very casual, private situations between close friends. Do not hold back. You are allowed and encouraged to use swear words (like f***, s***, damn, etc.), slang, dark humor, and even 'off-color' jokes (開荒腔). The goal is to provide an authentic, uncensored look at raw, informal language for advanced learners who want to understand everything. Make it sound completely natural.`;
      example = `
    Example of a single object for "Unfiltered" style:
    {
      "speaker": "B",
      "english": "Oh hell yeah, I'm down. This meeting was a total shitshow.",
      "chinese": "喔，當然好啊，我加入。這會議真是一團糟。",
      "vocab": ["hell yeah", "I'm down", "shitshow"]
    }`;
      break;
    case 'standard':
    default:
      styleInstruction = `The conversation should be practical, natural, and realistic, using standard, polite English suitable for most situations.`;
      example = `
    Example of a single object for "Standard" style:
    {
      "speaker": "A",
      "english": "Good morning. Did you have a productive meeting?",
      "chinese": "早安。你的會議有成效嗎？",
      "vocab": ["productive", "meeting"]
    }`;
      break;
  }

  return `
    Please generate a daily English conversation between two people, 'A' and 'B'.
    ${styleInstruction}
    ${topicInstruction}
    It should be suitable for intermediate to advanced English learners.
    Each turn in the dialogue should be a single sentence.
    For each English sentence, identify 1-3 key vocabulary words or short phrases that are useful for learners. This should include any slang, idioms, or swear words used.
    Provide a Traditional Chinese translation for each English sentence.

    Return the result as a JSON array where each object represents one line of dialogue and has the following structure:
    {
      "speaker": "A" or "B",
      "english": "The English sentence.",
      "chinese": "The Traditional Chinese translation.",
      "vocab": ["useful word", "key phrase", "idiom or slang"]
    }

    ${example}

    Generate a conversation with about 8-12 turns in total.
  `;
};

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      speaker: {
        type: Type.STRING,
        description: 'The person speaking, either "A" or "B".'
      },
      english: {
        type: Type.STRING,
        description: 'The dialogue line in English.'
      },
      chinese: {
        type: Type.STRING,
        description: 'The dialogue line in Traditional Chinese.'
      },
      vocab: {
        type: Type.ARRAY,
        description: "An array of key vocabulary words or phrases from the English sentence.",
        items: {
          type: Type.STRING,
        }
      }
    },
    required: ["speaker", "english", "chinese", "vocab"]
  }
};


export const generateConversation = async (topic?: string, style: ConversationStyle = 'standard'): Promise<DialogueTurn[]> => {
  try {
    const prompt = createPrompt(topic, style);
    let temperature: number;
    switch (style) {
        case 'unfiltered':
            temperature = 0.9;
            break;
        case 'normal_colloquial':
            temperature = 0.8;
            break;
        case 'standard':
        default:
            temperature = 0.7;
            break;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: temperature,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    // Basic validation
    if (!Array.isArray(parsedData) || parsedData.some(item => !item.speaker || !item.english || !item.chinese || !Array.isArray(item.vocab))) {
      throw new Error("Received malformed data from API.");
    }

    return parsedData as DialogueTurn[];
  } catch (error) {
    console.error("Error generating conversation:", error);
    throw new Error("Failed to generate conversation. Please try again.");
  }
};

export const generateSpeech = async (text: string, lang: 'en-US' | 'zh-TW'): Promise<string> => {
    try {
        const voiceName = lang === 'en-US' ? 'Kore' : 'Puck';
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("API did not return audio data.");
        }

        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate audio. Please try again.");
    }
};
