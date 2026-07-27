import { useState, useEffect } from 'react';
import { Key, Shield, Clock, Download, AlertTriangle, Check, Info, FileDown, Lock, Zap } from 'lucide-react';
import type { VaultData, VaultSettings as VaultSettingsType } from '../types/vault';
import { generateRecoveryPhrase, deriveKeyFromRecoveryPhrase } from '../crypto/recoveryPhrase';
import { RegenerateRecoveryFlow } from './RegenerateRecoveryFlow';
import { exportToCSV, exportToJSON } from '../utils/importExport';
import { BiometricSetup } from './BiometricSetup';
import { calculateSecurityMetrics, getDeviceInfo } from '../crypto/deviceBinding';

interface Props {
  vault: VaultData;
  settings: VaultSettingsType;
  masterPassword: string;
  onClose: () => void;
  onChangeMasterPassword: (oldPassword: string, newPassword: string) => Promise<void>;
  onRegenerateRecoveryPhrase: (newPhraseHash: string, newPhrase: string) => Promise<void>;
  onUpdateSettings: (settings: VaultSettingsType) => void;
  onExportBackup: () => void;
  onBiometricSetupComplete?: () => Promise<void>;
}

export function VaultSettings({
  vault,
  settings,
  masterPassword: _masterPassword,
  onClose: _onClose,
  onChangeMasterPassword,
  onRegenerateRecoveryPhrase,
  onUpdateSettings,
  onExportBackup,
  onBiometricSetupComplete
}: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'backup'>('general');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false);
  const [pendingRecoveryPhrase, setPendingRecoveryPhrase] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localSettings, setLocalSettings] = useState(settings);
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const deviceInfo = getDeviceInfo();

  useEffect(() => {
    const loadSecurityMetrics = async () => {
      try {
        const vaultJson = JSON.stringify(vault);
        const metrics = await calculateSecurityMetrics(vaultJson, vault.kdfIterations || 600000);
        setSecurityMetrics(metrics);
      } catch (err) {
        console.error('Failed to calculate security metrics:', err);
      }
    };
    loadSecurityMetrics();
  }, [vault]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (newPassword.length < 12) {
      setError('New password must be at least 12 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await onChangeMasterPassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Master password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRegenerateRecoveryPhrase = () => {
    const newPhrase = generateRecoveryPhrase();
    setPendingRecoveryPhrase(newPhrase);
    setShowRecoveryFlow(true);
  };

  const handleRecoveryPhraseVerified = async () => {
    try {
      const phraseHash = await deriveKeyFromRecoveryPhrase(pendingRecoveryPhrase);
      await onRegenerateRecoveryPhrase(phraseHash, pendingRecoveryPhrase);
      setShowRecoveryFlow(false);
      setPendingRecoveryPhrase('');
      setSuccess('Recovery phrase regenerated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to regenerate recovery phrase');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    setSuccess('Settings saved successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(vault.entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enigmakeep-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('CSV exported successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportJSON = () => {
    const json = exportToJSON(vault.entries);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enigmakeep-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('JSON exported successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="animate-fadeIn">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl w-full overflow-hidden">
        <div className="bg-surface2 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <Shield className="text-accent" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink">Vault Settings</h2>
              <p className="text-muted text-sm mt-0.5">Configure your vault preferences</p>
            </div>
          </div>
        </div>

          {(error || success) && (
            <div className="px-6 pt-4">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm animate-slideIn">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-success text-sm animate-slideIn">
                  {success}
                </div>
              )}
            </div>
          )}

          <div className="flex border-b border-line px-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'general'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'security'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'backup'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Backup
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <Info size={20} className="text-accent" />
                    Vault Information
                  </h3>
                  <div className="bg-surface2 rounded-xl p-4 space-y-3 border border-line">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted">Created:</span>
                      <span className="text-sm text-ink">{new Date(vault.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted">Last Modified:</span>
                      <span className="text-sm text-ink">{new Date(vault.updatedAt).toLocaleString()}</span>
                    </div>
                    {vault.lastBackup && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-muted">Last Backup:</span>
                        <span className="text-sm text-ink">{new Date(vault.lastBackup).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted">Encryption:</span>
                      <span className="text-sm text-ink font-mono">{vault.encryptionType || 'AES-256-GCM'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted">KDF Iterations:</span>
                      <span className="text-sm text-ink font-mono">{vault.kdfIterations || '100,000'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted">Total Entries:</span>
                      <span className="text-sm text-ink">{vault.entries.length}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-accent" />
                    Timeout Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Auto-lock after idle (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={localSettings.idleTimeout / 60000}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          idleTimeout: parseInt(e.target.value) * 60000
                        })}
                        className="ai-input"
                      />
                      <p className="text-xs text-muted mt-1">Vault will lock automatically after this period of inactivity</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Clear clipboard after (seconds)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={localSettings.clipboardTimeout / 1000}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          clipboardTimeout: parseInt(e.target.value) * 1000
                        })}
                        className="ai-input"
                      />
                      <p className="text-xs text-muted mt-1">Copied passwords will be cleared from clipboard after this time</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-accent" />
                    Security Options
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface2 rounded-xl border border-line">
                      <div>
                        <label className="text-sm font-medium text-ink">
                          Lock on Tab Close
                        </label>
                        <p className="text-xs text-muted mt-1">Automatically lock vault when browser tab is closed</p>
                      </div>
                      <button
                        onClick={() => setLocalSettings({
                          ...localSettings,
                          lockOnTabClose: !localSettings.lockOnTabClose
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          localSettings.lockOnTabClose ? 'bg-accent' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localSettings.lockOnTabClose ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface2 rounded-xl border border-line">
                      <div>
                        <label className="text-sm font-medium text-ink">
                          Lock on Minimize
                        </label>
                        <p className="text-xs text-muted mt-1">Lock vault when window is minimized or hidden</p>
                      </div>
                      <button
                        onClick={() => setLocalSettings({
                          ...localSettings,
                          autoLockOnMinimize: !localSettings.autoLockOnMinimize
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          localSettings.autoLockOnMinimize ? 'bg-accent' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localSettings.autoLockOnMinimize ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface2 rounded-xl border border-line">
                      <div>
                        <label className="text-sm font-medium text-ink">
                          Clear Clipboard on Lock
                        </label>
                        <p className="text-xs text-muted mt-1">Clear clipboard immediately when vault is locked</p>
                      </div>
                      <button
                        onClick={() => setLocalSettings({
                          ...localSettings,
                          clearClipboardOnLock: !localSettings.clearClipboardOnLock
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          localSettings.clearClipboardOnLock ? 'bg-accent' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localSettings.clearClipboardOnLock ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface2 rounded-xl border border-line">
                      <div>
                        <label className="text-sm font-medium text-ink">
                          Allow Screenshots
                        </label>
                        <p className="text-xs text-muted mt-1">When disabled, prevents screenshots on supported devices</p>
                      </div>
                      <button
                        onClick={() => setLocalSettings({
                          ...localSettings,
                          allowScreenshots: !localSettings.allowScreenshots
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          localSettings.allowScreenshots ? 'bg-accent' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localSettings.allowScreenshots ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="btn-primary w-full"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && !showRecoveryFlow && (
              <div className="space-y-6">
                {securityMetrics && (
                  <div className="bg-surface2 border border-line rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                      <Lock size={20} className="text-accent" />
                      Vault Security Analysis
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-surface rounded-lg p-4">
                        <div className="text-sm text-muted mb-1">Security Level</div>
                        <div className="text-lg font-bold text-success">{securityMetrics.securityLevel}</div>
                      </div>
                      <div className="bg-surface rounded-lg p-4">
                        <div className="text-sm text-muted mb-1">Key Strength</div>
                        <div className="text-lg font-bold text-accent">{securityMetrics.keyStrength}-bit AES</div>
                      </div>
                    </div>

                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Zap className="text-accent mt-0.5 flex-shrink-0" size={20} />
                        <div>
                          <div className="text-sm font-semibold text-accent mb-1">
                            Estimated Brute-Force Time
                          </div>
                          <div className="text-2xl font-bold text-ink mb-2">
                            {securityMetrics.estimatedDecryptionTime}
                          </div>
                          <div className="text-xs text-muted">
                            Time required to break encryption using modern hardware (1 billion attempts/second)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface rounded-lg p-4">
                      <div className="text-sm font-semibold text-ink mb-3">Active Protections</div>
                      <div className="grid grid-cols-1 gap-2">
                        {securityMetrics.protections.map((protection: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted">
                            <Check size={16} className="text-success flex-shrink-0" />
                            <span>{protection}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 bg-surface border border-line rounded-lg p-4">
                      <div className="text-sm font-semibold text-ink mb-2">Device Binding Active</div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="text-muted mb-1">Browser</div>
                          <div className="text-ink font-medium">{deviceInfo.browser}</div>
                        </div>
                        <div>
                          <div className="text-muted mb-1">OS</div>
                          <div className="text-ink font-medium">{deviceInfo.os}</div>
                        </div>
                        <div>
                          <div className="text-muted mb-1">Device Type</div>
                          <div className="text-ink font-medium">{deviceInfo.deviceType}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-muted">
                        <Shield size={14} className="inline mr-1" />
                        This vault is cryptographically bound to your device. Even with the master password, it cannot be opened on a different system without additional verification.
                      </div>
                    </div>
                  </div>
                )}

                <BiometricSetup username="vault-user" onComplete={onBiometricSetupComplete} />

                <div className="border-t border-line pt-6">
                  <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <Key size={20} className="text-accent" />
                    Change Master Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="ai-input"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="ai-input"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="ai-input"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={!oldPassword || !newPassword || !confirmPassword}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="border-t border-line pt-6">
                  <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-accent" />
                    Recovery Phrase
                  </h3>
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="text-accent flex-shrink-0" size={20} />
                      <div className="text-sm text-muted">
                        <p className="font-semibold mb-1 text-ink">Warning</p>
                        <p>Regenerating your recovery phrase will invalidate the old one. Make sure to save the new phrase securely.</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRegenerateRecoveryPhrase}
                    className="w-full px-4 py-3 border-2 border-accent/40 text-accent hover:bg-accent/10 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Key size={18} />
                    Regenerate Recovery Phrase
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <Download size={20} className="text-accent" />
                    Export Encrypted Backup
                  </h3>
                  <div className="bg-surface2 border border-line rounded-xl p-4 mb-4">
                    <p className="text-sm text-muted mb-2">
                      Export your vault as an encrypted backup file. This file can be stored on USB drives, cloud storage, or anywhere safe.
                    </p>
                    <ul className="text-sm text-muted space-y-1 list-disc list-inside">
                      <li>Fully encrypted with your master password</li>
                      <li>Can be restored on any device</li>
                      <li>Includes all passwords and settings</li>
                    </ul>
                  </div>
                  <button
                    onClick={onExportBackup}
                    className="btn-primary w-full gap-2"
                  >
                    <Download size={18} />
                    Export Encrypted Backup
                  </button>
                </div>

                <div className="border-t border-line pt-6">
                  <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <FileDown size={20} className="text-accent" />
                    Export Unencrypted Data
                  </h3>
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-accent flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm text-muted">
                        <p className="font-semibold mb-1 text-ink">Security Warning</p>
                        <p>These exports contain unencrypted passwords. Store them securely and delete after use.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleExportCSV}
                      className="btn-ghost gap-2"
                    >
                      <FileDown size={18} />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="btn-ghost gap-2"
                    >
                      <FileDown size={18} />
                      Export JSON
                    </button>
                  </div>
                </div>

                <div className="border-t border-line pt-6">
                  <h3 className="text-lg font-semibold text-ink mb-4">Backup Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                      <span className="text-sm text-muted">Last backup:</span>
                      <span className="text-sm font-medium text-ink">
                        {vault.lastBackup ? new Date(vault.lastBackup).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    {!vault.lastBackup && (
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                        <p className="text-sm text-muted">
                          <strong className="text-ink">Tip:</strong> Regular backups are recommended. Export your vault to a USB drive or secure location.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && showRecoveryFlow && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-accent" />
                    Regenerate Recovery Phrase
                  </h3>
                  <RegenerateRecoveryFlow
                    recoveryPhrase={pendingRecoveryPhrase}
                    onVerified={handleRecoveryPhraseVerified}
                    onCancel={() => {
                      setShowRecoveryFlow(false);
                      setPendingRecoveryPhrase('');
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
