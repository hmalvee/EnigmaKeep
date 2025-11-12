import { Shield, AlertTriangle, Copy, RefreshCw, Clock, TrendingUp } from 'lucide-react';
import { PasswordEntry } from '../types/vault';
import { calculatePasswordStrength } from '../utils/passwordStrength';

interface PasswordHealthDashboardProps {
  entries: PasswordEntry[];
  onClose: () => void;
}

interface HealthMetrics {
  totalPasswords: number;
  weakPasswords: PasswordEntry[];
  duplicatePasswords: { password: string; entries: PasswordEntry[] }[];
  oldPasswords: PasswordEntry[];
  strongPasswords: number;
  overallScore: number;
}

export function PasswordHealthDashboard({ entries, onClose }: PasswordHealthDashboardProps) {
  const calculateHealthMetrics = (): HealthMetrics => {
    const passwordEntries = entries.filter(e => e.type === 'password' || !e.type);
    const weakPasswords: PasswordEntry[] = [];
    const oldPasswords: PasswordEntry[] = [];
    let strongPasswords = 0;

    const passwordMap = new Map<string, PasswordEntry[]>();

    const now = Date.now();
    const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;

    passwordEntries.forEach(entry => {
      if (!entry.password) return;

      const strength = calculatePasswordStrength(entry.password);

      if (strength.score < 2.5 || entry.password.length < 12) {
        weakPasswords.push(entry);
      }

      if (strength.score >= 3.5) {
        strongPasswords++;
      }

      if (now - entry.updatedAt > ninetyDaysInMs) {
        oldPasswords.push(entry);
      }

      const existing = passwordMap.get(entry.password) || [];
      existing.push(entry);
      passwordMap.set(entry.password, existing);
    });

    const duplicatePasswords = Array.from(passwordMap.entries())
      .filter(([_, entries]) => entries.length > 1)
      .map(([password, entries]) => ({ password, entries }));

    const totalIssues = weakPasswords.length + duplicatePasswords.length + oldPasswords.length;
    const maxIssues = passwordEntries.length * 3;
    const overallScore = Math.max(0, 100 - (totalIssues / maxIssues) * 100);

    return {
      totalPasswords: passwordEntries.length,
      weakPasswords,
      duplicatePasswords,
      oldPasswords,
      strongPasswords,
      overallScore: Math.round(overallScore)
    };
  };

  const metrics = calculateHealthMetrics();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Password Health</h2>
                <p className="text-gray-400 text-sm">Security analysis of your vault</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Overall Security Score</h3>
                <p className="text-gray-400 text-sm">Based on password strength, uniqueness, and age</p>
              </div>
              <div className="text-right">
                <div className={`text-5xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}
                </div>
                <div className="text-gray-400 text-sm mt-1">{getScoreLabel(metrics.overallScore)}</div>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getScoreBgColor(metrics.overallScore)} transition-all duration-500`}
                style={{ width: `${metrics.overallScore}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="text-cyan-400" size={18} />
                <span className="text-gray-400 text-sm">Total</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.totalPasswords}</div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-500" size={18} />
                <span className="text-gray-400 text-sm">Strong</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{metrics.strongPasswords}</div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-orange-500" size={18} />
                <span className="text-gray-400 text-sm">Weak</span>
              </div>
              <div className="text-2xl font-bold text-orange-500">{metrics.weakPasswords.length}</div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Copy className="text-red-500" size={18} />
                <span className="text-gray-400 text-sm">Reused</span>
              </div>
              <div className="text-2xl font-bold text-red-500">{metrics.duplicatePasswords.length}</div>
            </div>
          </div>

          {/* Weak Passwords */}
          {metrics.weakPasswords.length > 0 && (
            <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Weak Passwords</h3>
                  <p className="text-gray-400 text-sm">
                    {metrics.weakPasswords.length} password{metrics.weakPasswords.length !== 1 ? 's' : ''} need strengthening
                  </p>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.weakPasswords.slice(0, 10).map(entry => {
                  const strength = calculatePasswordStrength(entry.password);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{entry.title}</div>
                        <div className="text-sm text-gray-400 truncate">{entry.username}</div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${strength.color}`}>{strength.label}</div>
                          <div className="text-xs text-gray-500">{entry.password.length} chars</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {metrics.weakPasswords.length > 10 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    ... and {metrics.weakPasswords.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Duplicate Passwords */}
          {metrics.duplicatePasswords.length > 0 && (
            <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Copy className="text-red-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Reused Passwords</h3>
                  <p className="text-gray-400 text-sm">
                    {metrics.duplicatePasswords.length} password{metrics.duplicatePasswords.length !== 1 ? 's are' : ' is'} used multiple times
                  </p>
                </div>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {metrics.duplicatePasswords.slice(0, 5).map((dup, idx) => (
                  <div key={idx} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="text-red-400" size={16} />
                      <span className="text-sm text-red-400 font-medium">
                        Used in {dup.entries.length} places
                      </span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {dup.entries.map(entry => (
                        <div key={entry.id} className="text-sm text-gray-300 truncate">
                          • {entry.title} ({entry.username})
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {metrics.duplicatePasswords.length > 5 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    ... and {metrics.duplicatePasswords.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Old Passwords */}
          {metrics.oldPasswords.length > 0 && (
            <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Old Passwords</h3>
                  <p className="text-gray-400 text-sm">
                    {metrics.oldPasswords.length} password{metrics.oldPasswords.length !== 1 ? 's' : ''} not updated in 90+ days
                  </p>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.oldPasswords.slice(0, 10).map(entry => {
                  const daysOld = Math.floor((Date.now() - entry.updatedAt) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{entry.title}</div>
                        <div className="text-sm text-gray-400 truncate">{entry.username}</div>
                      </div>
                      <div className="text-sm text-yellow-500 ml-4">
                        {daysOld} days old
                      </div>
                    </div>
                  );
                })}
                {metrics.oldPasswords.length > 10 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    ... and {metrics.oldPasswords.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-cyan-400" size={20} />
              Recommendations
            </h3>
            <ul className="space-y-3">
              {metrics.weakPasswords.length > 0 && (
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2"></div>
                  <span>Update {metrics.weakPasswords.length} weak password{metrics.weakPasswords.length !== 1 ? 's' : ''} to be at least 12 characters with mixed character types</span>
                </li>
              )}
              {metrics.duplicatePasswords.length > 0 && (
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2"></div>
                  <span>Create unique passwords for {metrics.duplicatePasswords.reduce((sum, d) => sum + d.entries.length, 0)} entries currently sharing passwords</span>
                </li>
              )}
              {metrics.oldPasswords.length > 0 && (
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2"></div>
                  <span>Refresh {metrics.oldPasswords.length} password{metrics.oldPasswords.length !== 1 ? 's' : ''} that haven't been updated in over 90 days</span>
                </li>
              )}
              {metrics.weakPasswords.length === 0 && metrics.duplicatePasswords.length === 0 && metrics.oldPasswords.length === 0 && (
                <li className="flex items-start gap-3 text-green-400">
                  <Check size={20} className="mt-0.5 flex-shrink-0" />
                  <span>Great job! Your vault is in excellent shape. Keep monitoring regularly.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Check({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
