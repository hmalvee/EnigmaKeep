import { AlertCircle, CheckCircle } from 'lucide-react';
import { calculatePasswordStrength, getPasswordStrengthBarColor } from '../utils/passwordStrength';

interface PasswordStrengthMeterProps {
  password: string;
  showFeedback?: boolean;
}

export function PasswordStrengthMeter({ password, showFeedback = true }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const barColor = getPasswordStrengthBarColor(strength.score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Password Strength:</span>
        <span className={`text-sm font-semibold ${strength.color}`}>
          {strength.label}
        </span>
      </div>

      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${(strength.score / 4) * 100}%` }}
        />
      </div>

      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1.5 mt-3">
          {strength.feedback.map((item, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-400">{item}</span>
            </div>
          ))}
        </div>
      )}

      {showFeedback && strength.meetsMinimum && (
        <div className="flex items-start gap-2 text-sm mt-3">
          <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-green-400">Meets recommended security requirements</span>
        </div>
      )}
    </div>
  );
}
