import { useEffect, useMemo, useState } from 'react';
import { getSessionPassword } from '../utils/sessionSecrets';
import { Check, AlertTriangle, Download, FileDown, KeyRound, ShieldCheck, LifeBuoy, SlidersHorizontal, Archive } from 'lucide-react';
import type { VaultData, VaultSettings as VaultSettingsType } from '../types/vault';
import { generateRecoveryPhrase, deriveKeyFromRecoveryPhrase } from '../crypto/recoveryPhrase';
import { RegenerateRecoveryFlow } from './RegenerateRecoveryFlow';
import { exportToCSV, exportToJSON } from '../utils/importExport';
import { BiometricSetup } from './BiometricSetup';
import { SecretKeyKit } from './SecretKeyKit';
import { GuardianRecoverySettings } from './GuardianRecoverySettings';
import type { SocialRecoveryConfig } from '../crypto/socialRecovery';
import { generateSecretKey } from '../crypto/secretKey';
import { calculateSecurityMetrics, type SecurityMetrics } from '../utils/securityMetrics';
import { calculatePasswordStrength } from '../utils/passwordStrength';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { SettingsCard, SettingRow, Toggle, Select, StatusToast } from './ui';

const LEVEL_TONE_CLASS: Record<SecurityMetrics['levelTone'], string> = {
  success: 'text-success',
  warning: 'text-warn',
  danger: 'text-danger'
};

type Tab = 'general' | 'security' | 'recovery' | 'backup';

const TABS: { id: Tab; label: string; icon: typeof KeyRound }[] = [
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'recovery', label: 'Recovery', icon: LifeBuoy },
  { id: 'backup', label: 'Backup & export', icon: Archive }
];

const MINUTE = 60_000;
const IDLE_OPTIONS = [1, 5, 10, 15, 30, 60].map(m => ({ value: m * MINUTE, label: m === 1 ? '1 minute' : m === 60 ? '1 hour' : `${m} minutes` }));
const CLIPBOARD_OPTIONS = [10, 15, 30, 60, 90, 120].map(s => ({ value: s * 1000, label: s < 60 ? `${s} seconds` : s === 60 ? '1 minute' : `${s / 60} minutes` }));

/** Keeps a saved value selectable even if it isn't one of the presets. */
function withCurrent(options: { value: number; label: string }[], current: number, unit: (v: number) => string) {
  return options.some(o => o.value === current) ? options : [...options, { value: current, label: unit(current) }].sort((a, b) => a.value - b.value);
}

const formatDateTime = (ts?: number) => (ts ? new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

interface Props {
  vault: VaultData;
  settings: VaultSettingsType;
  onClose: () => void;
  onChangeMasterPassword: (oldPassword: string, newPassword: string) => Promise<void>;
  onRegenerateRecoveryPhrase: (newPhraseHash: string, newPhrase: string) => Promise<void>;
  onUpdateSettings: (settings: VaultSettingsType) => void;
  onExportBackup: () => void;
  onEnableBiometric: () => Promise<void>;
  onAddSecretKey: (secretKey: string) => Promise<void>;
  onSaveGuardianRecovery: (config: SocialRecoveryConfig | undefined) => Promise<void>;
  /** Creates the decoy and returns its recovery phrase (shown once). */
  onCreateDecoy: (duressPassword: string, entryIds: string[]) => Promise<string>;
  onRemoveDecoy: () => Promise<void>;
  onChangeDuressPassword: (newPassword: string) => Promise<void>;
  /** 'hidden' when this session is a real vault living behind a decoy. */
  sessionKind: 'visible' | 'hidden';
}

export function VaultSettings({
  vault,
  settings,
  onClose: _onClose,
  onChangeMasterPassword,
  onRegenerateRecoveryPhrase,
  onUpdateSettings,
  onExportBackup,
  onEnableBiometric,
  onAddSecretKey,
  onSaveGuardianRecovery,
  onCreateDecoy,
  onRemoveDecoy,
  onChangeDuressPassword,
  sessionKind
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false);
  const [pendingRecoveryPhrase, setPendingRecoveryPhrase] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSecretKeyKit, setShowSecretKeyKit] = useState(false);
  const [pendingSecretKey, setPendingSecretKey] = useState('');
  const [pendingSecretKeySaved, setPendingSecretKeySaved] = useState(false);
  const [duressPassword, setDuressPassword] = useState('');
  const [duressConfirm, setDuressConfirm] = useState('');
  const [decoyEntryIds, setDecoyEntryIds] = useState<string[]>([]);
  const [decoyAck, setDecoyAck] = useState(false);
  const [decoyBusy, setDecoyBusy] = useState(false);
  const [decoyPhrase, setDecoyPhrase] = useState('');
  const [showChangeDuress, setShowChangeDuress] = useState(false);
  const [newDuress, setNewDuress] = useState('');
  const [newDuressConfirm, setNewDuressConfirm] = useState('');

  const duressStrength = duressPassword ? calculatePasswordStrength(duressPassword) : null;
  const canCreateDecoy =
    !!vault.recoveryEncKey && !!duressStrength && duressStrength.meetsMinimum && !duressStrength.isCommon &&
    duressPassword === duressConfirm && decoyAck && !decoyBusy;
  const newDuressStrength = newDuress ? calculatePasswordStrength(newDuress) : null;
  const canChangeDuress =
    !!newDuressStrength && newDuressStrength.meetsMinimum && !newDuressStrength.isCommon && newDuress === newDuressConfirm && !decoyBusy;

  const handleCreateDecoy = async () => {
    setDecoyBusy(true);
    try {
      const phrase = await onCreateDecoy(duressPassword, decoyEntryIds);
      setDecoyPhrase(phrase);
      setDuressPassword('');
      setDuressConfirm('');
      setDecoyEntryIds([]);
      setDecoyAck(false);
      setSuccess('Decoy vault created. Your real vault is now hidden in the file.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the decoy vault');
    } finally {
      setDecoyBusy(false);
    }
  };

  const handleRemoveDecoy = async () => {
    if (!window.confirm('Turn off the decoy vault? The decoy and its contents are discarded; this vault becomes the only one in the file.')) return;
    setDecoyBusy(true);
    try {
      await onRemoveDecoy();
      setDecoyPhrase('');
      setSuccess('Decoy vault removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove the decoy vault');
    } finally {
      setDecoyBusy(false);
    }
  };

  const handleChangeDuress = async () => {
    setDecoyBusy(true);
    try {
      await onChangeDuressPassword(newDuress);
      setNewDuress('');
      setNewDuressConfirm('');
      setShowChangeDuress(false);
      setSuccess('Duress password changed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change the duress password');
    } finally {
      setDecoyBusy(false);
    }
  };

  // Read the password straight from the session store instead of taking it as
  // a prop, so it never sits in a component tree (DevTools, error reports).
  const securityMetrics: SecurityMetrics | null = useMemo(() => {
    const masterPassword = getSessionPassword();
    return masterPassword
      ? calculateSecurityMetrics(masterPassword, vault.kdfIterations || 600000, !!vault.recoveryEncKey)
      : null;
  }, [vault.kdfIterations, vault.recoveryEncKey, vault.updatedAt]);

  // Vaults created before the recovery key was stored keep an old recovery copy.
  const recoveryCopyStale = !!vault.recoveryPhraseHash && !vault.recoveryEncKey;

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => {
      setSuccess('');
      setError('');
    }, success ? 2500 : 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const updateSetting = (patch: Partial<VaultSettingsType>) => {
    onUpdateSettings({ ...settings, ...patch });
    setSuccess('Settings saved');
  };

  const handleStartAddSecretKey = async () => {
    setPendingSecretKey(await generateSecretKey());
    setPendingSecretKeySaved(false);
  };

  const handleConfirmAddSecretKey = async () => {
    try {
      await onAddSecretKey(pendingSecretKey);
      setPendingSecretKey('');
      setSuccess('Secret Key added. Your vault now needs your password and Secret Key.');
    } catch {
      setError('Failed to add Secret Key');
    }
  };

  const newPasswordStrength = newPassword ? calculatePasswordStrength(newPassword) : null;
  const canChangePassword =
    !!oldPassword && !!newPasswordStrength?.meetsMinimum && !newPasswordStrength.isCommon && newPassword === confirmPassword;

  const handleChangePassword = async () => {
    if (!canChangePassword) return;
    setChangingPassword(true);
    try {
      await onChangeMasterPassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Master password changed');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRegenerateRecoveryPhrase = () => {
    setPendingRecoveryPhrase(generateRecoveryPhrase());
    setShowRecoveryFlow(true);
  };

  const handleRecoveryPhraseVerified = async () => {
    try {
      const phraseHash = await deriveKeyFromRecoveryPhrase(pendingRecoveryPhrase);
      await onRegenerateRecoveryPhrase(phraseHash, pendingRecoveryPhrase);
      setShowRecoveryFlow(false);
      setPendingRecoveryPhrase('');
      setSuccess('New recovery phrase saved');
    } catch {
      setError('Failed to regenerate recovery phrase');
    }
  };

  const download = (content: string, type: string, ext: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `enigmakeep-export-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess(`${ext.toUpperCase()} exported`);
  };

  const itemCount =
    vault.entries.length + (vault.notes?.length || 0) + (vault.totpEntries?.length || 0) + (vault.files?.length || 0);

  return (
    <div className="mx-auto max-w-3xl animate-fadeIn">
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Settings sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'general' && (
        <div className="space-y-5">
          <SettingsCard title="Auto-lock" description="Lock the vault automatically so an unattended screen doesn't expose it.">
            <SettingRow title="Lock after inactivity" description="Time without keyboard or mouse activity.">
              <Select
                label="Lock after inactivity"
                value={settings.idleTimeout}
                options={withCurrent(IDLE_OPTIONS, settings.idleTimeout, v => `${Math.round(v / MINUTE)} minutes`)}
                onChange={(v) => updateSetting({ idleTimeout: v })}
              />
            </SettingRow>
            <SettingRow title="Lock when the window is hidden" description="Switching apps or minimizing the browser locks the vault.">
              <Toggle label="Lock when the window is hidden" checked={!!settings.autoLockOnMinimize} onChange={(v) => updateSetting({ autoLockOnMinimize: v })} />
            </SettingRow>
            <SettingRow title="Lock when the tab closes" description="Clears the session from memory when you close this tab.">
              <Toggle label="Lock when the tab closes" checked={!!settings.lockOnTabClose} onChange={(v) => updateSetting({ lockOnTabClose: v })} />
            </SettingRow>
          </SettingsCard>

          <SettingsCard title="Clipboard" description="Copied passwords are removed from the clipboard after a short time.">
            <SettingRow title="Clear copied passwords after">
              <Select
                label="Clear copied passwords after"
                value={settings.clipboardTimeout}
                options={withCurrent(CLIPBOARD_OPTIONS, settings.clipboardTimeout, v => `${Math.round(v / 1000)} seconds`)}
                onChange={(v) => updateSetting({ clipboardTimeout: v })}
              />
            </SettingRow>
            <SettingRow title="Clear the clipboard when locking">
              <Toggle label="Clear the clipboard when locking" checked={!!settings.clearClipboardOnLock} onChange={(v) => updateSetting({ clearClipboardOnLock: v })} />
            </SettingRow>
            <SettingRow title="Allow text selection" description="When off, vault text cannot be selected or long-pressed, which makes casual copying harder. A web page cannot block screenshots.">
              <Toggle label="Allow text selection" checked={!!settings.allowScreenshots} onChange={(v) => updateSetting({ allowScreenshots: v })} />
            </SettingRow>
          </SettingsCard>

          <SettingsCard title="About this vault">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
              {[
                ['Items', String(itemCount)],
                ['Encryption', vault.encryptionType || 'AES-256-GCM'],
                ['Key derivation', `PBKDF2-SHA256, ${(vault.kdfIterations || 600000).toLocaleString()} rounds`],
                ['Secret Key', vault.secretKey ? 'On' : 'Off'],
                ['Created', formatDateTime(vault.createdAt)],
                ['Last changed', formatDateTime(vault.updatedAt)]
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 sm:block">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-ink sm:mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </SettingsCard>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-5">
          {securityMetrics && (
            <SettingsCard title="Security overview" description="How well a stolen copy of your vault file would hold up.">
              <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="px-5 py-4">
                  <div className="text-xs text-muted">Protection level</div>
                  <div className={`mt-1 text-lg font-semibold ${LEVEL_TONE_CLASS[securityMetrics.levelTone]}`}>{securityMetrics.securityLevel}</div>
                </div>
                <div className="px-5 py-4">
                  <div className="text-xs text-muted">Master password</div>
                  <div className="mt-1 text-lg font-semibold text-ink">~{securityMetrics.passwordEntropyBits} bits</div>
                </div>
                <div className="px-5 py-4">
                  <div className="text-xs text-muted">Time to crack a stolen file</div>
                  <div className="mt-1 text-lg font-semibold text-ink">{securityMetrics.estimatedCrackTime}</div>
                </div>
              </div>
              <div className="px-5 py-4">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {securityMetrics.protections.map((protection) => (
                    <li key={protection} className="flex items-start gap-2 text-[13px] text-muted">
                      <Check size={15} className="mt-0.5 shrink-0 text-success" />
                      <span>{protection}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted/80">
                  Estimate for an attacker with 100 high-end GPUs guessing your master password. A longer, random password raises it the most.
                </p>
              </div>
            </SettingsCard>
          )}

          <SettingsCard
            title="Secret Key"
            description={
              vault.secretKey
                ? 'On. Opening this vault needs your master password and your Secret Key, so a stolen file cannot be brute-forced.'
                : 'Off. Anyone with a copy of your vault file can try to guess your master password. A Secret Key adds 128 random bits that stay on your devices.'
            }
            action={
              vault.secretKey ? (
                <button onClick={() => setShowSecretKeyKit(v => !v)} className="btn-ghost !px-3.5 !py-2 text-sm">
                  {showSecretKeyKit ? 'Hide kit' : 'Emergency Kit'}
                </button>
              ) : !pendingSecretKey ? (
                <button onClick={handleStartAddSecretKey} className="btn-primary !px-3.5 !py-2 text-sm">Turn on</button>
              ) : undefined
            }
          >
            {vault.secretKey && showSecretKeyKit && (
              <div className="px-5 py-4">
                <SecretKeyKit secretKey={vault.secretKey} />
              </div>
            )}
            {!vault.secretKey && pendingSecretKey && (
              <div className="space-y-4 px-5 py-4">
                <p className="text-sm text-muted">
                  Save this Emergency Kit first. Once it's on, opening the vault on a new device needs this key (or your recovery phrase).
                </p>
                <SecretKeyKit secretKey={pendingSecretKey} onSaved={() => setPendingSecretKeySaved(true)} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setPendingSecretKey('')} className="btn-ghost !px-4 !py-2 text-sm">Cancel</button>
                  <button onClick={handleConfirmAddSecretKey} disabled={!pendingSecretKeySaved} className="btn-primary !px-4 !py-2 text-sm">
                    I've saved it, turn on
                  </button>
                </div>
              </div>
            )}
          </SettingsCard>

          <BiometricSetup onEnable={onEnableBiometric} />

          <SettingsCard title="Master password" description="Changing it re-encrypts the vault. Biometric unlock turns off until you enable it again.">
            <div className="grid gap-4 px-5 py-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">Current password</label>
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="ai-input !py-2.5" autoComplete="current-password" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/80">New password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="ai-input !py-2.5" autoComplete="new-password" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/80">Confirm new password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="ai-input !py-2.5" autoComplete="new-password" />
                  {confirmPassword && newPassword !== confirmPassword && <p className="mt-1 text-xs text-danger">Passwords do not match</p>}
                </div>
              </div>
              {newPassword && <PasswordStrengthMeter password={newPassword} />}
              <div className="flex justify-end">
                <button onClick={handleChangePassword} disabled={!canChangePassword || changingPassword} className="btn-primary !px-4 !py-2 text-sm">
                  {changingPassword ? 'Changing...' : 'Change password'}
                </button>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Decoy vault"
            description={
              vault.decoy
                ? 'On. A duress password opens a harmless decoy from this same file. In a single copy of the file, this vault cannot be told apart from random padding.'
                : 'Off. A duress password would open a harmless decoy vault from the same file, so you can hand over a password under pressure without revealing this vault.'
            }
          >
            {decoyPhrase ? (
              <div className="space-y-3 px-5 py-4">
                <p className="text-sm text-ink">The decoy has its own recovery phrase, like any vault. Keeping it is optional; it only opens the decoy.</p>
                <p className="rounded-lg border border-line bg-surface2 p-3 font-mono text-sm text-ink">{decoyPhrase}</p>
                <div className="flex justify-end">
                  <button onClick={() => setDecoyPhrase('')} className="btn-ghost !px-4 !py-2 text-sm">Done</button>
                </div>
              </div>
            ) : vault.decoy ? (
              <div className="space-y-4 px-5 py-4">
                <p className="text-sm text-muted">
                  Created {formatDateTime(vault.decoy.createdAt)}. To change what the decoy contains, lock and unlock with the duress password; edits made there never touch this vault.
                  Someone who compares several versions of the file over time can notice that the padding changes when this vault is saved, so keep old copies out of reach.
                </p>
                {showChangeDuress ? (
                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink/80">New duress password</label>
                        <input type="password" value={newDuress} onChange={(e) => setNewDuress(e.target.value)} className="ai-input !py-2.5" autoComplete="new-password" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink/80">Confirm duress password</label>
                        <input type="password" value={newDuressConfirm} onChange={(e) => setNewDuressConfirm(e.target.value)} className="ai-input !py-2.5" autoComplete="new-password" />
                        {newDuressConfirm && newDuress !== newDuressConfirm && <p className="mt-1 text-xs text-danger">Passwords do not match</p>}
                      </div>
                    </div>
                    {newDuress && <PasswordStrengthMeter password={newDuress} />}
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowChangeDuress(false)} className="btn-ghost !px-4 !py-2 text-sm">Cancel</button>
                      <button onClick={handleChangeDuress} disabled={!canChangeDuress} className="btn-primary !px-4 !py-2 text-sm">
                        {decoyBusy ? 'Saving…' : 'Change duress password'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowChangeDuress(true)} disabled={decoyBusy} className="btn-ghost !px-3.5 !py-2 text-sm">Change duress password</button>
                    <button onClick={handleRemoveDecoy} disabled={decoyBusy} className="btn-ghost !px-3.5 !py-2 text-sm text-danger">Turn off</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 px-5 py-4">
                {!vault.recoveryEncKey && (
                  <p className="text-sm text-warn">Set a recovery phrase (Recovery tab) before creating a decoy; the hidden vault must stay recoverable.</p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink/80">Duress password</label>
                    <input type="password" value={duressPassword} onChange={(e) => setDuressPassword(e.target.value)} className="ai-input !py-2.5" autoComplete="new-password" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink/80">Confirm duress password</label>
                    <input type="password" value={duressConfirm} onChange={(e) => setDuressConfirm(e.target.value)} className="ai-input !py-2.5" autoComplete="new-password" />
                    {duressConfirm && duressPassword !== duressConfirm && <p className="mt-1 text-xs text-danger">Passwords do not match</p>}
                  </div>
                </div>
                {duressPassword && <PasswordStrengthMeter password={duressPassword} />}
                <div>
                  <div className="mb-1.5 text-sm font-medium text-ink/80">Entries to copy into the decoy</div>
                  {vault.entries.length === 0 ? (
                    <p className="text-sm text-muted">No entries yet; the decoy will start empty. You can fill it later by unlocking with the duress password.</p>
                  ) : (
                    <div className="max-h-48 space-y-1 overflow-auto rounded-lg border border-line p-2">
                      {vault.entries.map((entry) => (
                        <label key={entry.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-ink hover:bg-ink/[0.03]">
                          <input
                            type="checkbox"
                            checked={decoyEntryIds.includes(entry.id)}
                            onChange={(e) => setDecoyEntryIds(e.target.checked ? [...decoyEntryIds, entry.id] : decoyEntryIds.filter(id => id !== entry.id))}
                            className="h-4 w-4 accent-accent"
                          />
                          <span className="truncate">{entry.title}</span>
                          {entry.username && <span className="truncate text-muted">· {entry.username}</span>}
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted">Copy a few harmless logins so the decoy looks lived-in. Nothing else from this vault goes into it.</p>
                </div>
                <label className="flex items-start gap-3 rounded-lg border border-line bg-surface2 p-3 text-sm text-ink">
                  <input type="checkbox" checked={decoyAck} onChange={(e) => setDecoyAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" />
                  <span>
                    I am in my real vault, not inside a decoy.
                    {sessionKind === 'visible' && ' Creating a decoy from inside a decoy would overwrite the hidden vault behind it.'}
                  </span>
                </label>
                <div className="flex justify-end">
                  <button onClick={handleCreateDecoy} disabled={!canCreateDecoy} className="btn-primary !px-4 !py-2 text-sm">
                    {decoyBusy ? 'Creating…' : 'Create decoy vault'}
                  </button>
                </div>
              </div>
            )}
          </SettingsCard>
        </div>
      )}

      {activeTab === 'recovery' && (
        <div className="space-y-5">
          {recoveryCopyStale && (
            <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-ink">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
              <span>
                Your recovery copy was made by an older version and isn't updated when you save, so recovering would restore old data.
                Generate a new recovery phrase once to fix this.
              </span>
            </div>
          )}

          <SettingsCard
            title="Recovery phrase"
            description="Your 12 words reset a forgotten master password. Generating a new phrase makes the old one stop working."
            action={
              !showRecoveryFlow && (
                <button onClick={handleRegenerateRecoveryPhrase} className="btn-ghost !px-3.5 !py-2 text-sm gap-2">
                  <KeyRound size={15} />
                  New phrase
                </button>
              )
            }
          >
            {showRecoveryFlow && (
              <div className="px-5 py-4">
                <RegenerateRecoveryFlow
                  recoveryPhrase={pendingRecoveryPhrase}
                  onVerified={handleRecoveryPhraseVerified}
                  onCancel={() => {
                    setShowRecoveryFlow(false);
                    setPendingRecoveryPhrase('');
                  }}
                />
              </div>
            )}
          </SettingsCard>

          <GuardianRecoverySettings vault={vault} onSave={onSaveGuardianRecovery} />
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-5">
          <SettingsCard title="Encrypted backup" description="A copy of the whole vault, locked with your master password and Secret Key. Safe to keep on a USB drive or cloud storage.">
            <SettingRow title="Download backup" description={`Last backup: ${formatDateTime(vault.lastBackup)}`}>
              <button onClick={onExportBackup} className="btn-primary !px-4 !py-2 text-sm gap-2">
                <Download size={15} />
                Download
              </button>
            </SettingRow>
          </SettingsCard>

          <SettingsCard
            title="Export unencrypted"
            tone="danger"
            description="These files contain your passwords in plain text. Use them to move to another manager, then delete them."
          >
            <SettingRow title="CSV" description="Works with most password managers and spreadsheets.">
              <button onClick={() => download(exportToCSV(vault.entries), 'text/csv', 'csv')} className="btn-ghost !px-4 !py-2 text-sm gap-2">
                <FileDown size={15} />
                Export CSV
              </button>
            </SettingRow>
            <SettingRow title="JSON" description="Keeps every field, for scripts and re-import.">
              <button onClick={() => download(exportToJSON(vault.entries), 'application/json', 'json')} className="btn-ghost !px-4 !py-2 text-sm gap-2">
                <FileDown size={15} />
                Export JSON
              </button>
            </SettingRow>
          </SettingsCard>
        </div>
      )}

      <StatusToast kind="success" message={success} />
      <StatusToast kind="error" message={error} />
    </div>
  );
}
