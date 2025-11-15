
import React from 'react';

interface SpeakerIconProps {
  speaker: 'A' | 'B';
}

const SpeakerIcon: React.FC<SpeakerIconProps> = ({ speaker }) => {
  const bgColor = speaker === 'A' ? 'bg-blue-500' : 'bg-teal-500';
  
  return (
    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-md ${bgColor}`}>
      {speaker}
    </div>
  );
};

export default SpeakerIcon;
