import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  text: string;
}

const FORBIDDEN_WORDS = [
  'delve',
  'tapestry',
  'testament',
  'beacon',
  'game-changer',
  'fostering synergy',
  'paradigm shift',
  'in today\'s rapidly changing world',
  'holistic framework',
  'I hope this email finds you well',
  'reach out to check in',
  'synergy'
];

export const BannedWordBadge: React.FC<Props> = ({ text }) => {
  if (!text) return null;

  const lowerText = text.toLowerCase();
  const flagged = FORBIDDEN_WORDS.filter((word) => lowerText.includes(word.toLowerCase()));

  if (flagged.length === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Executive Tone Compliant (0 AI Clichés)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      <span>
        Flagged Banned Phrase{flagged.length > 1 ? 's' : ''}: {flagged.join(', ')}
      </span>
    </div>
  );
};
