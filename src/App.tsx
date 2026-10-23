import { useState, useEffect, lazy, Suspense } from 'react';
import { Lock, Plus, Search, Upload, Download, AlertTriangle, Menu, KeyRound } from 'lucide-react';
import { verifyCrypto } from './crypto/encryption';
import {
  createNewVault,
  encryptVault,
  encryptVaultWithLayout,
  defaultLayout,
  openVaultFile,
  saveVaultToFile,
  stampSave,
  prepareForSave,
  createDecoyVault,
  removeDecoyVault,
  changeDuressPassword,
  addEntry,
  updateEntry,
  deleteEntry,
  searchEntries,
  updateVaultMetadata,
  getVaultMetadata,
  withRecoveryKey
} from './utils/vaultManager';
import { getSessionLayout, setSessionLayout, clearSessionLayout, type FileLayout } from './utils/sessionFile';
import { checkVaultVersion, recordVaultVersion, type VersionCheck } from './utils/vaultVersions';
import { clearVaultSnapshots, saveVaultSnapshot } from './utils/vaultSnapshots';
import { rotatePuzzle } from './crypto/socialRecovery';
import { validateSecret } from './utils/totp';
import { parseSecretKey, normalizeSecretKey, rememberSecretKey, getDeviceSecretKeys } from './crypto/secretKey';
import type { SocialRecoveryConfig } from './crypto/socialRecovery';
import type { VaultData, PasswordEntry as PasswordEntryType, VaultSettings as VaultSettingsType, Note, TotpEntry } from './types/vault';
import { PasswordEntry } from './components/PasswordEntry';
import { EntryModal } from './components/EntryModal';
import { CategoryFilter } from './components/CategoryFilter';
import { VaultSettings } from './components/VaultSettings';
import { ImportModal } from './components/ImportModal';
import { ThemeToggle } from './components/ThemeToggle';
import { Toast } from './components/Toast';
import { StatusToast, EmptyState } from './components/ui';
import { InstallPrompt } from './components/InstallPrompt';
import { LoginScreen } from './components/LoginScreen';
import { CreateVaultFlow } from './components/CreateVaultFlow';
import { ConfirmModal } from './components/ConfirmModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { FileExplorer } from './components/FileExplorer';
import {
  fileToStoredFile,
  downloadStoredFile,
  buildFolderUpload,
  descendantFolderIds,
  textToStoredData,
  MAX_FILE_BYTES,
  formatBytes
} from './utils/fileStorage';
import type { StoredFile, VaultFolder } from './types/vault';
import { NoteModal } from './components/NoteModal';
import { TotpModal } from './components/TotpModal';
import { TotpList } from './components/TotpList';
import { TotpExportModal } from './components/TotpExportModal';
import { useAutoLock } from './hooks/useAutoLock';
import { deriveKeyFromRecoveryPhrase } from './crypto/recoveryPhrase';
import { saveLastVaultPath, getLastVaultPath, saveLastVaultHandle, getLastVaultHandle, verifyHandleAccess } from './utils/vaultStorage';
import { isBiometricEnabled, enableBiometric, disableBiometric, clearLegacyBiometricData } from './utils/biometric';
import {
  setSessionPassword,
  getSessionPassword,
  setSessionRecoveryPhrase,
  clearSessionSecrets
} from './utils/sessionSecrets';
import { secureCopy, clearSecureClipboard } from './utils/secureClipboard';
import { waitForUnlockBackoff, recordUnlockFailure, clearUnlockFailures } from './utils/unlockBackoff';
import { LoadingScreen } from './components/LoadingScreen';
import { VaultShell } from './components/VaultShell';

const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));
const Details = lazy(() => import('./pages/Details').then(module => ({ default: module.Details })));
const Bench = lazy(() => import('./pages/Bench').then(module => ({ default: module.Bench })));
const DetailArticle = lazy(() => import('./pages/DetailArticle').then(module => ({ default: module.DetailArticle })));

const DEFAULT_SETTINGS: VaultSettingsType = {
  idleTimeout: 5 * 60 * 1000,
  clipboardTimeout: 15 * 1000,
  lockOnTabClose: true,
  autoLockOnMinimize: false,
  clearClipboardOnLock: true,
  allowScreenshots: false
};

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Route handling - Check EARLY before vault logic
  console.log('Current path:', currentPath);

  // Landing page
  if (currentPath === '/' || currentPath === '' || currentPath === '/index.html') {
    console.log('Rendering LandingPage');
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LandingPage />
      </Suspense>
    );
  }

  // Privacy policy
  if (currentPath === '/privacy' || currentPath === '/privacy.html') {
    console.log('Rendering PrivacyPolicy');
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  // Terms of service
  if (currentPath === '/terms' || currentPath === '/terms.html') {
    console.log('Rendering TermsOfService');
    return (
      <Suspense fallback={<LoadingScreen />}>
        <TermsOfService />
      </Suspense>
    );
  }

  // Blog
  if (currentPath === '/blog' || currentPath === '/blog.html') {
    console.log('Rendering Blog');
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Blog />
      </Suspense>
    );
  }

  // Blog post
  if (currentPath.startsWith('/blog/')) {
    const slug = currentPath.replace('/blog/', '').replace('.html', '');
    console.log('Rendering BlogPost:', slug);
    return (
      <Suspense fallback={<LoadingScreen />}>
        <BlogPost slug={slug} />
      </Suspense>
    );
  }

  // SEO guides hub (linked only from the footer)
  if (currentPath === '/details' || currentPath === '/details/' || currentPath === '/details.html') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Details />
      </Suspense>
    );
  }

  // Individual SEO guide article
  // Public device benchmark for the research dataset.
  if (currentPath === '/bench' || currentPath === '/bench/') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Bench />
      </Suspense>
    );
  }

  if (currentPath.startsWith('/details/')) {
    const slug = currentPath.replace('/details/', '').replace('.html', '').replace(/\/$/, '');
    return (
      <Suspense fallback={<LoadingScreen />}>
        <DetailArticle slug={slug} />
      </Suspense>
    );
  }

  // Vault app - check if path is /app or starts with /app
  if (!currentPath.startsWith('/app')) {
    // If not on an app route, redirect to landing
    console.log('Unknown route, redirecting to landing');
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LandingPage />
      </Suspense>
    );
  }

  // If we get here, render the vault app
  return <VaultApp />;
}

/** The vault itself. Kept as its own component so its hooks never run after App's route early-returns. */
function VaultApp() {
  const [cryptoReady, setCryptoReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [mode, setMode] = useState<'welcome' | 'create' | 'open' | 'vault' | 'settings'>('welcome');
  const [lastVaultPath, setLastVaultPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<PasswordEntryType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [vaultSettings, setVaultSettings] = useState<VaultSettingsType>(DEFAULT_SETTINGS);
  const [existingRecoveryData, setExistingRecoveryData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copyNotification, setCopyNotification] = useState<{ message: string; countdown: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; entryId: string | null }>({ show: false, entryId: null });
  const [currentView, setCurrentView] = useState<'passwords' | 'notes' | 'totp' | 'files' | 'settings'>('passwords');
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<{ show: boolean; fileId: string | null }>({ show: false, fileId: null });
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<{ show: boolean; folderId: string | null }>({ show: false, folderId: null });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<{ show: boolean; noteId: string | null }>({ show: false, noteId: null });
  const [editingTotp, setEditingTotp] = useState<TotpEntry | null>(null);
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [confirmDeleteTotp, setConfirmDeleteTotp] = useState<{ show: boolean; totpId: string | null }>({ show: false, totpId: null });
  const [selectedTotpIds, setSelectedTotpIds] = useState<string[]>([]);
  const [showTotpExportModal, setShowTotpExportModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Download mode (no writable file handle): edits live in memory and a local
  // snapshot until the user downloads a fresh copy.
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // An unlock that is waiting for the user to accept a rollback warning.
  const [pendingUnlock, setPendingUnlock] = useState<{ check: VersionCheck; vault: VaultData; proceed: () => Promise<void> } | null>(null);

  useEffect(() => {
    verifyCrypto().then(ready => {
      if (!ready) {
        setError('Crypto self-test failed. The application cannot run safely.');
      }
      setCryptoReady(ready);
    });

    const savedPath = getLastVaultPath();
    setLastVaultPath(savedPath);

    // Old biometric data could be unwrapped without any biometric check — purge it.
    clearLegacyBiometricData();
  }, []);

  const handleLock = () => {
    if (vaultSettings.clearClipboardOnLock) {
      void clearSecureClipboard();
    }
    clearSessionSecrets();
    clearSessionLayout();
    setPendingUnlock(null);
    setCurrentView('passwords');
    setVault(null);
    setExistingRecoveryData(null);
    setSearchQuery('');
    setEditingEntry(null);
    setEditingNote(null);
    setEditingTotp(null);
    setShowModal(false);
    setShowNoteModal(false);
    setShowTotpModal(false);
    setHasUnsavedChanges(false);
    // Don't let one vault's settings or file leak into the next one opened.
    setVaultSettings(DEFAULT_SETTINGS);
    setFileHandle(null);
    setIsLocked(true);
    setMode('welcome');
  };

  useAutoLock(handleLock, isLocked, {
    idleTimeout: vaultSettings.idleTimeout,
    lockOnHide: !!vaultSettings.autoLockOnMinimize
  });

  useEffect(() => {
    if (vaultSettings.lockOnTabClose || hasUnsavedChanges) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue = '';
        }
        if (vaultSettings.lockOnTabClose) {
          clearSessionSecrets();
          if (vaultSettings.clearClipboardOnLock) {
            void clearSecureClipboard();
          }
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [vaultSettings.lockOnTabClose, vaultSettings.clearClipboardOnLock, hasUnsavedChanges]);

  useEffect(() => {
    if (!vaultSettings.allowScreenshots && !isLocked && vault) {
      document.body.style.setProperty('-webkit-user-select', 'none');
      document.body.style.setProperty('user-select', 'none');

      const style = document.createElement('style');
      style.id = 'screenshot-protection';
      style.textContent = `
        * {
          -webkit-touch-callout: none !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.body.style.removeProperty('-webkit-user-select');
        document.body.style.removeProperty('user-select');
        const existingStyle = document.getElementById('screenshot-protection');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [vaultSettings.allowScreenshots, isLocked, vault]);

  const applyVaultSettings = (loaded: VaultData) => {
    setVaultSettings({ ...DEFAULT_SETTINGS, ...(loaded.settings || {}) });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // Attach before clicking and revoke later: some browsers abort a download
    // whose URL is revoked synchronously.
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  /**
   * Stamp the save, write to the open file when the browser allows it or
   * (Firefox, Safari) download a copy, and remember the version on this
   * device. Returns the vault as written, which callers adopt as state.
   */
  const writeVault = async (handle: FileSystemFileHandle | null, data: VaultData, password: string): Promise<VaultData> => {
    const stamped = stampSave(await prepareForSave(data));
    if (handle) {
      const written = await saveVaultToFile(handle, stamped, password);
      await recordVaultVersion(written);
      return written;
    }
    const encrypted = await encryptVaultWithLayout(stamped, password, getSessionLayout() ?? defaultLayout());
    setSessionLayout(encrypted.layout);
    // Keep an encrypted local copy too: the app cannot tell whether the
    // download actually completed.
    await saveVaultSnapshot(lastVaultPath || 'vault.dat', await encrypted.blob.arrayBuffer());
    downloadBlob(encrypted.blob, `notes-${Date.now()}.dat`);
    setHasUnsavedChanges(false);
    await recordVaultVersion(stamped);
    return stamped;
  };

  const handleCreateVaultComplete = async (
    password: string,
    recoveryPhraseHash: string,
    handle: FileSystemFileHandle | null,
    phrase: string,
    secretKey: string
  ) => {
    try {
      const newVault = await withRecoveryKey(
        { ...(await createNewVault(recoveryPhraseHash)), settings: { ...vaultSettings }, secretKey },
        phrase
      );
      clearSessionLayout();
      const written = await writeVault(handle, newVault, password);
      rememberSecretKey(secretKey);

      setSessionPassword(password);
      // Phrase only needed while rewriting recovery; drop after first save.
      setSessionRecoveryPhrase(null);
      setVault(written);
      setFileHandle(handle);
      setExistingRecoveryData(null);
      setIsLocked(false);
      setMode('vault');
      clearUnlockFailures();

      if (handle) {
        saveLastVaultPath(handle.name);
        setLastVaultPath(handle.name);
        await saveLastVaultHandle(handle);
        setSuccess('Vault created successfully');
      } else {
        setSuccess('Vault created and downloaded. Click Save after changes to download an updated copy.');
      }
      setTimeout(() => setSuccess(''), handle ? 3000 : 6000);
    } catch (err) {
      console.error('Vault creation failed:', err);
      throw err;
    }
  };

  const handleBiometricLoginSuccess = async (password: string) => {
    try {
      await waitForUnlockBackoff();
      const handle = await getLastVaultHandle();
      if (!handle) {
        setError('Vault file not linked. Open with your master password once to re-enable biometric unlock.');
        setTimeout(() => setError(''), 4000);
        return;
      }

      const hasAccess = await verifyHandleAccess(handle, 'readwrite');
      if (!hasAccess) {
        setError('Cannot access vault file. Please grant permission or open with master password.');
        setTimeout(() => setError(''), 4000);
        return;
      }

      const file = await handle.getFile();
      await handleLoginWithPassword(password, file, handle);
    } catch (err: any) {
      recordUnlockFailure();
      if (err.message?.includes('decrypt') || err.name === 'OperationError') {
        setError('Biometric credential decryption failed. Please login with master password.');
      } else {
        setError('Biometric login failed. Please use master password.');
      }
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLoginWithPassword = async (
    password: string,
    file: File,
    handle: FileSystemFileHandle | null,
    secretKeyInput?: string
  ) => {
    try {
      await waitForUnlockBackoff();
      const candidates = await getDeviceSecretKeys();
      if (secretKeyInput) {
        const entered = await parseSecretKey(secretKeyInput);
        if (!entered) {
          setError("That Secret Key isn't valid. Check it for typos, or scan the QR code.");
          setTimeout(() => setError(''), 4000);
          throw new Error('Invalid Secret Key format');
        }
        candidates.unshift(entered);
      }
      // Tries the visible vault, then a hidden one behind the same password.
      const opened = await openVaultFile(file, { kind: 'password', password, secretKeys: candidates });
      const finish = async () => {
        const loadedVault = opened.vault;
        if (loadedVault.secretKey) {
          // Remember it so this device only needs the password from now on.
          rememberSecretKey(loadedVault.secretKey);
        }
        setSessionLayout(opened.layout);
        setExistingRecoveryData(opened.container?.recovery ?? null);

        setSessionPassword(password);
        setSessionRecoveryPhrase(null);
        setVault(loadedVault);
        applyVaultSettings(loadedVault);
        setFileHandle(handle);
        setIsLocked(false);
        setMode('vault');
        clearUnlockFailures();

        saveLastVaultPath(file.name);
        setLastVaultPath(file.name);
        if (handle) {
          await saveLastVaultHandle(handle);
        }
        await recordVaultVersion(loadedVault);

        setSuccess('Vault unlocked successfully');
        setTimeout(() => setSuccess(''), 3000);
      };

      // Rollback check: is this file older than one this device already opened?
      const check = await checkVaultVersion(opened.vault);
      if (check.status !== 'ok' && check.record) {
        setPendingUnlock({ check, vault: opened.vault, proceed: finish });
        return;
      }
      await finish();
    } catch (err: any) {
      recordUnlockFailure();
      if (err.message?.includes('Invalid Secret Key')) {
        // Message already shown.
      } else if (err.message?.includes('password') || err.message?.includes('Decryption')) {
        setError('Incorrect password or Secret Key');
      } else {
        setError('Failed to load vault');
      }
      setTimeout(() => setError(''), 3000);
      throw err;
    }
  };

  const handleRecoverWithSeedPhrase = async (
    seedPhrase: string,
    newPassword: string,
    file: File,
    handle: FileSystemFileHandle | null
  ) => {
    try {
      await waitForUnlockBackoff();
      const phraseHash = await deriveKeyFromRecoveryPhrase(seedPhrase);
      const metadata = await getVaultMetadata(file);

      if (metadata?.recoveryPhraseHash) {
        if (metadata.recoveryPhraseHash !== phraseHash) {
          throw new Error('Recovery phrase does not match');
        }
      }

      const opened = await openVaultFile(file, { kind: 'phrase', phrase: seedPhrase });
      const decryptedVault = opened.vault;

      if (decryptedVault.recoveryPhraseHash && decryptedVault.recoveryPhraseHash !== phraseHash) {
        throw new Error('Recovery phrase does not match');
      }

      // Re-encrypt under the new master password; the stored recovery key keeps
      // the recovery block current on later saves.
      const loadedVault = await withRecoveryKey(decryptedVault, seedPhrase);
      if (loadedVault.secretKey) {
        rememberSecretKey(loadedVault.secretKey);
      }
      // Keep the file's layout: a hidden vault stays hidden behind its decoy.
      setSessionLayout(opened.layout);
      await clearVaultSnapshots();
      const written = await writeVault(handle, loadedVault, newPassword);

      setSessionPassword(newPassword);
      setSessionRecoveryPhrase(null);
      setVault(written);
      applyVaultSettings(loadedVault);
      setFileHandle(handle);
      setExistingRecoveryData(null);
      setIsLocked(false);
      setMode('vault');
      clearUnlockFailures();

      saveLastVaultPath(file.name);
      setLastVaultPath(file.name);
      if (handle) {
        await saveLastVaultHandle(handle);
      }

      if (isBiometricEnabled()) {
        // The wrapped password is now wrong; it must be re-enrolled.
        await disableBiometric();
      }

      setSuccess(handle
        ? 'Vault recovered and password reset successfully'
        : 'Password reset. The updated vault was downloaded; use that file from now on.');
      setTimeout(() => setSuccess(''), handle ? 3000 : 6000);
    } catch (err: any) {
      recordUnlockFailure();
      if (err.message?.includes('does not match')) {
        setError('Recovery phrase does not match');
      } else if (err.message?.includes('recovery phrase')) {
        setError('Invalid recovery phrase');
      } else if (err.message?.includes('decrypt') || err.message?.includes('Decryption')) {
        setError('Recovery phrase does not match');
      } else {
        setError('Failed to recover vault');
      }
      setTimeout(() => setError(''), 3000);
      throw err;
    }
  };

  const handleSaveVault = async () => {
    const masterPassword = getSessionPassword();
    if (!vault || !masterPassword) return;

    try {
      const written = await writeVault(fileHandle, { ...vault, lastBackup: Date.now() }, masterPassword);
      setVault(written);
      setSuccess('Vault saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save vault');
      setTimeout(() => setError(''), 4000);
    }
  };

  /**
   * Write first, then update the screen, so what the user sees is never ahead
   * of what is on disk. Without a file handle the change is kept in memory
   * plus an encrypted local snapshot until the user downloads a copy.
   */
  const persistVault = async (updatedVault: VaultData) => {
    const masterPassword = getSessionPassword();
    if (!masterPassword) {
      throw new Error('Vault is locked');
    }
    const stamped = stampSave(await prepareForSave(updatedVault));
    try {
      if (fileHandle) {
        await saveVaultToFile(fileHandle, stamped, masterPassword, existingRecoveryData);
      } else {
        const encrypted = await encryptVaultWithLayout(stamped, masterPassword, getSessionLayout() ?? defaultLayout());
        setSessionLayout(encrypted.layout);
        await saveVaultSnapshot(lastVaultPath || 'vault.dat', await encrypted.blob.arrayBuffer());
        setHasUnsavedChanges(true);
      }
    } catch (err) {
      console.error('Failed to save vault:', err);
      setError('Could not save the vault file. Your last change was not saved.');
      setTimeout(() => setError(''), 5000);
      throw err;
    }
    await recordVaultVersion(stamped);
    setVault(stamped);
  };

  const handleAddEntry = async (entry: Omit<PasswordEntryType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!vault) return;
    await persistVault(addEntry(vault, entry));
  };

  const handleImportEntries = async (entries: Omit<PasswordEntryType, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (!vault) return;

    let updatedVault = vault;
    for (const entry of entries) {
      updatedVault = addEntry(updatedVault, entry);
    }

    await persistVault(updatedVault);

    setSuccess(`Imported ${entries.length} entries successfully`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpdateEntry = async (entry: Omit<PasswordEntryType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!vault || !editingEntry) return;
    await persistVault(updateEntry(vault, editingEntry.id, entry));
    setEditingEntry(null);
  };

  const handleDuplicateEntry = async (entry: PasswordEntryType) => {
    if (!vault) return;
    const duplicatedEntry = {
      type: 'password' as const,
      title: `${entry.title} (Copy)`,
      username: entry.username,
      password: entry.password,
      url: entry.url,
      notes: entry.notes
    };
    await persistVault(addEntry(vault, duplicatedEntry));

    setSuccess('Entry duplicated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteEntry = async (id: string) => {
    setConfirmDelete({ show: true, entryId: id });
  };

  const confirmDeleteEntry = async () => {
    if (!vault || !confirmDelete.entryId) return;

    await persistVault(deleteEntry(vault, confirmDelete.entryId));

    setConfirmDelete({ show: false, entryId: null });
    setSuccess('Entry deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Note handlers
  const handleAddNote = async (noteData: Partial<Note>) => {
    if (!vault) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: noteData.title || '',
      content: noteData.content || '',
      tags: noteData.tags || [],
      favorite: noteData.favorite || false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await persistVault({
      ...vault,
      notes: [...(vault.notes || []), newNote],
      updatedAt: Date.now()
    });
    setShowNoteModal(false);
    setEditingNote(null);

    setSuccess('Note saved successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpdateNote = async (noteData: Partial<Note>) => {
    if (!vault || !editingNote) return;
    const updatedNotes = (vault.notes || []).map(note =>
      note.id === editingNote.id
        ? { ...note, ...noteData, updatedAt: Date.now() }
        : note
    );
    await persistVault({
      ...vault,
      notes: updatedNotes,
      updatedAt: Date.now()
    });
    setShowNoteModal(false);
    setEditingNote(null);

    setSuccess('Note updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteNote = (noteId: string) => {
    setConfirmDeleteNote({ show: true, noteId });
  };

  const handleConfirmDeleteNote = async () => {
    if (!vault || !confirmDeleteNote.noteId) return;
    const updatedNotes = (vault.notes || []).filter(note => note.id !== confirmDeleteNote.noteId);
    await persistVault({
      ...vault,
      notes: updatedNotes,
      updatedAt: Date.now()
    });

    setConfirmDeleteNote({ show: false, noteId: null });
    setSuccess('Note deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleFavoriteNote = async (noteId: string) => {
    if (!vault) return;
    const updatedNotes = (vault.notes || []).map(note =>
      note.id === noteId
        ? { ...note, favorite: !note.favorite, updatedAt: Date.now() }
        : note
    );
    await persistVault({
      ...vault,
      notes: updatedNotes,
      updatedAt: Date.now()
    });
  };

  const handleAddTotp = async (totpData: Omit<TotpEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!vault) return;
    const newTotp: TotpEntry = {
      ...totpData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await persistVault({
      ...vault,
      totpEntries: [...(vault.totpEntries || []), newTotp],
      updatedAt: Date.now()
    });
    setShowTotpModal(false);
    setEditingTotp(null);

    setSuccess('2FA code saved successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpdateTotp = async (totpData: Omit<TotpEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!vault || !editingTotp) return;
    const updatedTotpEntries = (vault.totpEntries || []).map(totp =>
      totp.id === editingTotp.id
        ? { ...totp, ...totpData, updatedAt: Date.now() }
        : totp
    );
    await persistVault({
      ...vault,
      totpEntries: updatedTotpEntries,
      updatedAt: Date.now()
    });
    setShowTotpModal(false);
    setEditingTotp(null);

    setSuccess('2FA code updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteTotp = (totpId: string) => {
    setConfirmDeleteTotp({ show: true, totpId });
  };

  const handleConfirmDeleteTotp = async () => {
    if (!vault || !confirmDeleteTotp.totpId) return;
    const updatedTotpEntries = (vault.totpEntries || []).filter(totp => totp.id !== confirmDeleteTotp.totpId);
    await persistVault({
      ...vault,
      totpEntries: updatedTotpEntries,
      updatedAt: Date.now()
    });

    setConfirmDeleteTotp({ show: false, totpId: null });
    setSuccess('2FA code deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleFavoriteTotp = async (totpId: string) => {
    if (!vault) return;
    const updatedTotpEntries = (vault.totpEntries || []).map(totp =>
      totp.id === totpId
        ? { ...totp, favorite: !totp.favorite, updatedAt: Date.now() }
        : totp
    );
    await persistVault({
      ...vault,
      totpEntries: updatedTotpEntries,
      updatedAt: Date.now()
    });
  };

  const handleCopyTotpCode = async (code: string, title: string) => {
    await secureCopy(code, vaultSettings.clipboardTimeout);
    setSuccess(`${title} code copied to clipboard`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChangeMasterPassword = async (oldPassword: string, newPassword: string) => {
    if (!vault) return;
    const current = getSessionPassword();

    if (!current || oldPassword !== current) {
      throw new Error('Current password is incorrect');
    }

    // Someone who learned the old password and opened the vault once may have
    // copied the guardian puzzle answer; a fresh puzzle (same guardian cards)
    // takes that away from them for every file written from now on.
    const updatedVault: VaultData = {
      ...vault,
      socialRecovery: vault.socialRecovery && vault.socialRecovery.rotateOnSave === false
        ? await rotatePuzzle(vault.socialRecovery)
        : vault.socialRecovery, // otherwise writeVault rotates on this save anyway
      updatedAt: Date.now()
    };

    // Local snapshots are encrypted under the old password; don't leave them
    // around for someone who may have learned it.
    await clearVaultSnapshots();
    // Write before switching the session password, so a failed write leaves
    // memory and disk under the same password.
    const written = await writeVault(fileHandle, updatedVault, newPassword);
    setSessionPassword(newPassword);
    setVault(written);

    if (isBiometricEnabled()) {
      // The wrapped password is now wrong; it must be re-enrolled.
      await disableBiometric();
    }
  };

  const handleAddSecretKey = async (secretKey: string) => {
    if (!vault) return;
    const normalized = await normalizeSecretKey(secretKey);
    if (!normalized) throw new Error('Invalid Secret Key');
    rememberSecretKey(normalized);
    await persistVault({ ...vault, secretKey: normalized, updatedAt: Date.now() });
  };

  const handleSaveGuardianRecovery = async (config: SocialRecoveryConfig | undefined) => {
    if (!vault) return;
    await persistVault({ ...vault, socialRecovery: config, updatedAt: Date.now() });
  };

  /** Switch the file to a hidden layout: the decoy becomes visible, this vault moves into the padding. */
  const handleCreateDecoy = async (duressPassword: string, entryIds: string[]): Promise<string> => {
    const masterPassword = getSessionPassword();
    if (!vault || !masterPassword) throw new Error('Vault is locked');
    const setup = await createDecoyVault(vault, masterPassword, duressPassword, vault.entries.filter(e => entryIds.includes(e.id)));
    const previous = getSessionLayout();
    setSessionLayout(setup.layout);
    try {
      const written = await writeVault(fileHandle, setup.vault, masterPassword);
      setVault(written);
    } catch (err) {
      setSessionLayout(previous);
      throw err;
    }
    return setup.decoyPhrase;
  };

  const handleRemoveDecoy = async () => {
    const masterPassword = getSessionPassword();
    if (!vault || !masterPassword) throw new Error('Vault is locked');
    const { vault: plain, layout } = removeDecoyVault(vault);
    const previous = getSessionLayout();
    setSessionLayout(layout);
    try {
      const written = await writeVault(fileHandle, plain, masterPassword);
      setVault(written);
    } catch (err) {
      setSessionLayout(previous);
      throw err;
    }
  };

  const handleChangeDuressPassword = async (newPassword: string) => {
    const masterPassword = getSessionPassword();
    if (!vault?.decoy || !masterPassword) throw new Error('No decoy vault');
    if (newPassword === masterPassword) throw new Error('The duress password must differ from your master password');
    const previous = getSessionLayout();
    if (!previous) throw new Error('Vault file layout unknown');
    setSessionLayout(await changeDuressPassword(previous, vault.decoy.password, newPassword, await getDeviceSecretKeys()));
    try {
      const written = await writeVault(fileHandle, { ...vault, decoy: { ...vault.decoy, password: newPassword } }, masterPassword);
      setVault(written);
    } catch (err) {
      setSessionLayout(previous);
      throw err;
    }
  };

  const handleRecoverWithGuardians = async (
    recoveredVault: VaultData,
    newPassword: string,
    file: File,
    handle: FileSystemFileHandle | null,
    layout: FileLayout
  ) => {
    try {
      setSessionLayout(layout);
      await clearVaultSnapshots();
      const written = await writeVault(handle, recoveredVault, newPassword);
      if (recoveredVault.secretKey) {
        rememberSecretKey(recoveredVault.secretKey);
      }
      if (isBiometricEnabled()) {
        await disableBiometric();
      }

      setSessionPassword(newPassword);
      setSessionRecoveryPhrase(null);
      setVault(written);
      applyVaultSettings(recoveredVault);
      setFileHandle(handle);
      setExistingRecoveryData(null);
      setIsLocked(false);
      setMode('vault');
      clearUnlockFailures();
      saveLastVaultPath(file.name);
      setLastVaultPath(file.name);
      if (handle) {
        await saveLastVaultHandle(handle);
      }

      setSuccess(handle
        ? 'Vault recovered with guardians. Set up guardian recovery again in Settings.'
        : 'Vault recovered with guardians and downloaded as a new file. Set up guardian recovery again in Settings.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save recovered vault');
      setTimeout(() => setError(''), 4000);
      throw err;
    }
  };

  const handleEnableBiometric = async () => {
    await enableBiometric(getSessionPassword() || '');
  };

  const handleRegenerateRecoveryPhrase = async (newPhraseHash: string, newPhrase: string) => {
    if (!vault) return;
    const masterPassword = getSessionPassword();
    if (!masterPassword) return;

    const updatedVault = await withRecoveryKey(
      updateVaultMetadata(vault, { recoveryPhraseHash: newPhraseHash }),
      newPhrase
    );
    // The user is told the old phrase stops working, so the new one must be
    // on disk (or downloaded) before we report success.
    const written = await writeVault(fileHandle, updatedVault, masterPassword);
    setVault(written);
    setExistingRecoveryData(null);
  };

  const handleUpdateSettings = async (newSettings: VaultSettingsType) => {
    setVaultSettings(newSettings);
    if (!vault) return;
    await persistVault({
      ...vault,
      settings: newSettings,
      updatedAt: Date.now()
    });
  };

  const handleExportBackup = async () => {
    const masterPassword = getSessionPassword();
    if (!vault || !masterPassword) return;

    try {
      const updatedVault = { ...vault, lastBackup: Date.now() };
      const blob = await encryptVault(updatedVault, masterPassword);
      downloadBlob(blob, `notes-backup-${new Date().toISOString().split('T')[0]}.dat`);
      setVault(updatedVault);
      setSuccess('Backup exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export backup');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUploadFiles = async (fileList: FileList, folderId: string | null) => {
    if (!vault) return;

    const incoming = Array.from(fileList);
    const tooBig = incoming.filter(f => f.size > MAX_FILE_BYTES);
    if (tooBig.length > 0) {
      setError(`Some files exceed the ${formatBytes(MAX_FILE_BYTES)} limit and were skipped`);
      setTimeout(() => setError(''), 3000);
    }

    const accepted = incoming.filter(f => f.size <= MAX_FILE_BYTES);
    if (accepted.length === 0) return;

    try {
      const stored: StoredFile[] = [];
      for (const f of accepted) {
        stored.push(await fileToStoredFile(f, folderId));
      }
      await persistVault({
        ...vault,
        files: [...(vault.files || []), ...stored],
        updatedAt: Date.now()
      });
      setSuccess(`Secured ${stored.length} file${stored.length === 1 ? '' : 's'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to store files');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUploadFolder = async (fileList: FileList, parentId: string | null) => {
    if (!vault) return;

    const incoming = Array.from(fileList).filter(f => f.size <= MAX_FILE_BYTES);
    if (incoming.length === 0) {
      setError(`Folder was empty or all files exceeded the ${formatBytes(MAX_FILE_BYTES)} limit`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const { folders, files } = await buildFolderUpload(incoming, parentId);
      await persistVault({
        ...vault,
        folders: [...(vault.folders || []), ...folders],
        files: [...(vault.files || []), ...files],
        updatedAt: Date.now()
      });
      setSuccess(`Uploaded ${files.length} file${files.length === 1 ? '' : 's'} in ${folders.length} folder${folders.length === 1 ? '' : 's'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload folder');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    if (!vault) return;
    const folder: VaultFolder = {
      id: crypto.randomUUID(),
      name,
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await persistVault({
      ...vault,
      folders: [...(vault.folders || []), folder],
      updatedAt: Date.now()
    });
  };

  const handleRenameFile = async (fileId: string, name: string) => {
    if (!vault) return;
    await persistVault({
      ...vault,
      files: (vault.files || []).map(f => f.id === fileId ? { ...f, name, updatedAt: Date.now() } : f),
      updatedAt: Date.now()
    });
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    if (!vault) return;
    await persistVault({
      ...vault,
      folders: (vault.folders || []).map(f => f.id === folderId ? { ...f, name, updatedAt: Date.now() } : f),
      updatedAt: Date.now()
    });
  };

  const handleSaveFileText = async (fileId: string, text: string) => {
    if (!vault) return;
    const { data, size } = textToStoredData(text);
    await persistVault({
      ...vault,
      files: (vault.files || []).map(f => f.id === fileId ? { ...f, data, size, updatedAt: Date.now() } : f),
      updatedAt: Date.now()
    });
    setSuccess('File saved');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleDownloadFile = (file: StoredFile) => {
    downloadStoredFile(file);
  };

  const handleDeleteFile = (fileId: string) => {
    setConfirmDeleteFile({ show: true, fileId });
  };

  const confirmDeleteFileAction = async () => {
    if (!vault || !confirmDeleteFile.fileId) return;
    await persistVault({
      ...vault,
      files: (vault.files || []).filter(f => f.id !== confirmDeleteFile.fileId),
      updatedAt: Date.now()
    });
    setConfirmDeleteFile({ show: false, fileId: null });
    setSuccess('File deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteFolder = (folderId: string) => {
    setConfirmDeleteFolder({ show: true, folderId });
  };

  const confirmDeleteFolderAction = async () => {
    if (!vault || !confirmDeleteFolder.folderId) return;
    const doomed = descendantFolderIds(vault.folders || [], confirmDeleteFolder.folderId);
    await persistVault({
      ...vault,
      folders: (vault.folders || []).filter(f => !doomed.has(f.id)),
      files: (vault.files || []).filter(f => !doomed.has(f.folderId ?? '')),
      updatedAt: Date.now()
    });
    setConfirmDeleteFolder({ show: false, folderId: null });
    setSuccess('Folder deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleFavoriteEntry = async (id: string) => {
    if (!vault) return;
    const target = vault.entries.find(e => e.id === id);
    if (!target) return;
    await persistVault(
      updateEntry(vault, id, { favorite: !target.favorite })
    );
  };

  const filteredEntries = (() => {
    if (!vault) return [];
    let list = searchQuery ? searchEntries(vault, searchQuery) : [...vault.entries];
    if (selectedCategory) {
      list = list.filter(e => e.category === selectedCategory);
    }
    return list.sort((a, b) => {
      if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  })();

  const entryCategories = vault
    ? [...new Set(vault.entries.map(e => e.category).filter(Boolean) as string[])].sort()
    : [];

  if (!cryptoReady) {
    return (
      <VaultShell>
        <div className="glass-card p-8 max-w-md w-full text-center animate-scaleIn">
          <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-danger/25">
            <AlertTriangle className="text-danger" size={26} strokeWidth={1.6} />
          </div>
          <h1 className="text-2xl font-normal text-ink mb-2 tracking-[-0.025em]">Security error</h1>
          <p className="text-muted">
            Cryptographic verification failed. The application cannot run safely.
          </p>
        </div>
        <OfflineIndicator />
      </VaultShell>
    );
  }

  if (isLocked || !vault) {
    if (mode === 'welcome') {
      return (
        <VaultShell
          footer={
            <p className="text-[11px] text-muted/80 font-mono tracking-[0.12em] text-center animate-fadeIn" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
              AES-256-GCM · PBKDF2 600K · ZERO KNOWLEDGE
            </p>
          }
        >
          <div className="flex flex-col items-center text-center w-full max-w-xl">
            <h1 className="text-[clamp(34px,7.4vw,64px)] font-normal leading-[0.9559] tracking-[-0.0279em] text-ink">
              <span className="mask-line"><span style={{ animationDelay: '0.2s' }}>Your vault, sealed</span></span>
              <span className="mask-line"><span style={{ animationDelay: '0.29s' }}>on this device.</span></span>
            </h1>
            <p
              className="mt-5 text-[clamp(16px,2.2vw,20px)] text-muted tracking-[-0.005em] [text-wrap:balance] animate-fadeIn"
              style={{ animationDelay: '0.7s', animationFillMode: 'both' }}
            >
              Open your encrypted vault file, or create a new one in under a minute.
            </p>

            <div
              className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto animate-fadeIn"
              style={{ animationDelay: '0.86s', animationFillMode: 'both' }}
            >
              <button onClick={() => setMode('open')} className="btn-primary h-12 sm:w-[216px] gap-2 text-[16px]">
                <Upload size={17} strokeWidth={1.8} />
                Open vault
              </button>
              <button onClick={() => setMode('create')} className="btn-ghost h-12 sm:w-[216px] gap-2 text-[16px]">
                <Plus size={17} strokeWidth={1.8} />
                Create a new vault
              </button>
            </div>
          </div>
          <OfflineIndicator />
        </VaultShell>
      );
    }

    if (mode === 'create') {
      return (
        <VaultShell>
          <div className="glass-card p-6 sm:p-8 animate-scaleIn w-full max-w-lg">
            <CreateVaultFlow
              onComplete={handleCreateVaultComplete}
              onCancel={() => setMode('welcome')}
              error={error}
            />
          </div>
          <OfflineIndicator />
        </VaultShell>
      );
    }

    if (mode === 'open') {
      return (
        <VaultShell>
          <div className="glass-card p-6 sm:p-8 animate-scaleIn w-full max-w-md">
            <LoginScreen
              onLogin={handleLoginWithPassword}
              onRecoverWithSeedPhrase={handleRecoverWithSeedPhrase}
              onBiometricLogin={handleBiometricLoginSuccess}
              onRecoverWithGuardians={handleRecoverWithGuardians}
              lastVaultPath={lastVaultPath}
              error={error}
            />
          </div>
          <button
            onClick={() => setMode('welcome')}
            className="mt-6 text-sm text-muted hover:text-ink transition-colors"
          >
            ← Back
          </button>
          {pendingUnlock && (
            <ConfirmModal
              title={pendingUnlock.check.status === 'older' ? 'This vault file is older than expected' : 'This vault file does not match'}
              message={
                pendingUnlock.check.status === 'older'
                  ? `This device last opened version ${pendingUnlock.check.record?.saveCount} of this vault on ${new Date(pendingUnlock.check.record?.at ?? 0).toLocaleString()}, but this file is version ${pendingUnlock.vault.saveCount}. Someone, or a sync service, may have replaced it with an old copy, or you may be restoring an older backup on purpose. Passwords you changed since then would be exposed again.`
                  : `This file claims to be version ${pendingUnlock.vault.saveCount}, the same as the one this device last opened, but it is a different file. It may have been tampered with or forked by a sync conflict.`
              }
              confirmText="Open anyway"
              cancelText="Don't open"
              variant="warning"
              onConfirm={() => {
                const proceed = pendingUnlock.proceed;
                setPendingUnlock(null);
                void proceed();
              }}
              onCancel={() => setPendingUnlock(null)}
            />
          )}
          <OfflineIndicator />
        </VaultShell>
      );
    }

    return null;
  }

  const handleImportTotp = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File too large');
        }
        const parsed: unknown = JSON.parse(await file.text());
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid format');
        }
        // Rebuild every entry from validated fields: a malformed object
        // persisted into the vault would crash the 2FA view on every unlock.
        const importedTotpEntries: TotpEntry[] = [];
        for (const raw of parsed) {
          if (!raw || typeof raw !== 'object') continue;
          const r = raw as Record<string, unknown>;
          if (typeof r.title !== 'string' || typeof r.secret !== 'string' || !validateSecret(r.secret)) continue;
          const algorithm = r.algorithm === 'SHA256' || r.algorithm === 'SHA512' ? r.algorithm : 'SHA1';
          const digits = r.digits === 7 || r.digits === 8 ? r.digits : 6;
          const period = typeof r.period === 'number' && r.period >= 15 && r.period <= 120 ? Math.floor(r.period) : 30;
          const now = Date.now();
          importedTotpEntries.push({
            id: crypto.randomUUID(),
            title: r.title.slice(0, 200),
            issuer: typeof r.issuer === 'string' ? r.issuer.slice(0, 200) : undefined,
            accountName: typeof r.accountName === 'string' ? r.accountName.slice(0, 200) : undefined,
            secret: r.secret.replace(/\s/g, '').toUpperCase(),
            algorithm,
            digits,
            period,
            favorite: r.favorite === true,
            createdAt: now,
            updatedAt: now
          });
        }
        if (importedTotpEntries.length === 0) {
          throw new Error('No valid entries');
        }
        await persistVault({
          ...vault,
          totpEntries: [...(vault.totpEntries || []), ...importedTotpEntries],
          updatedAt: Date.now()
        });
        setSuccess(`Imported ${importedTotpEntries.length} of ${parsed.length} 2FA code(s)`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to import 2FA codes. Please check the file format.');
        setTimeout(() => setError(''), 3000);
      }
    };
    input.click();
  };

  const openNewEntry = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  const viewTitles = { passwords: 'Passwords', totp: '2FA codes', notes: 'Notes', files: 'Files', settings: 'Settings' } as const;
  const viewCounts: Partial<Record<keyof typeof viewTitles, [number, string, string]>> = {
    passwords: [vault.entries.length, 'item', 'items'],
    totp: [(vault.totpEntries || []).length, 'code', 'codes'],
    notes: [(vault.notes || []).length, 'note', 'notes'],
    files: [(vault.files || []).length, 'file', 'files']
  };
  const countLine = viewCounts[currentView];

  // Vault app main UI
  return (
    <div className="h-screen overflow-hidden bg-bg bg-sky flex">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        passwordCount={vault.entries.length}
        noteCount={(vault.notes || []).length}
        totpCount={(vault.totpEntries || []).length}
        fileCount={(vault.files || []).length}
        vaultName={fileHandle?.name ?? lastVaultPath ?? undefined}
        onLock={handleLock}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-bg/75 backdrop-blur-xl border-b border-line z-30">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden icon-btn -ml-1.5"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-ink tracking-[-0.015em] truncate leading-tight">
                  {viewTitles[currentView]}
                </h1>
                {countLine && (
                  <p className="text-xs text-muted leading-tight">
                    {countLine[0]} {countLine[0] === 1 ? countLine[1] : countLine[2]}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <button
                onClick={handleSaveVault}
                className={`${hasUnsavedChanges ? 'btn-primary' : 'btn-ghost'} !px-3 !py-2 text-sm gap-1.5`}
                title={fileHandle ? 'Save to vault file' : 'Download an updated vault file'}
              >
                {hasUnsavedChanges ? <AlertTriangle size={15} /> : <Download size={15} />}
                <span className="hidden sm:inline">
                  {fileHandle ? 'Save' : hasUnsavedChanges ? 'Download unsaved changes' : 'Download'}
                </span>
              </button>
              <button
                onClick={handleLock}
                className="btn-primary !px-3 !py-2 text-sm gap-1.5"
              >
                <Lock size={15} />
                <span className="hidden sm:inline">Lock</span>
              </button>
            </div>
          </div>
        </header>

        {currentView === 'files' ? (
          <FileExplorer
            folders={vault.folders || []}
            files={vault.files || []}
            onUploadFiles={handleUploadFiles}
            onUploadFolder={handleUploadFolder}
            onCreateFolder={handleCreateFolder}
            onRenameFile={handleRenameFile}
            onRenameFolder={handleRenameFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
            onDownloadFile={handleDownloadFile}
            onSaveFileText={handleSaveFileText}
          />
        ) : (
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
              {currentView === 'settings' ? (
                <VaultSettings
                  vault={vault}
                  settings={vaultSettings}
                  onClose={() => setCurrentView('passwords')}
                  onChangeMasterPassword={handleChangeMasterPassword}
                  onRegenerateRecoveryPhrase={handleRegenerateRecoveryPhrase}
                  onUpdateSettings={handleUpdateSettings}
                  onExportBackup={handleExportBackup}
                  onEnableBiometric={handleEnableBiometric}
                  onAddSecretKey={handleAddSecretKey}
                  onSaveGuardianRecovery={handleSaveGuardianRecovery}
                  onCreateDecoy={handleCreateDecoy}
                  onRemoveDecoy={handleRemoveDecoy}
                  onChangeDuressPassword={handleChangeDuressPassword}
                  sessionKind={getSessionLayout()?.kind ?? 'visible'}
                />
              ) : currentView === 'totp' ? (
                <>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      {selectedTotpIds.length > 0 && (
                        <button onClick={() => setShowTotpExportModal(true)} className="btn-ghost !px-3.5 !py-2 text-sm gap-2">
                          <Download size={16} />
                          Export {selectedTotpIds.length}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleImportTotp} className="btn-ghost !px-3.5 !py-2 text-sm gap-2">
                        <Upload size={16} />
                        <span className="hidden sm:inline">Import</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingTotp(null);
                          setShowTotpModal(true);
                        }}
                        className="btn-primary !px-3.5 !py-2 text-sm gap-2"
                      >
                        <Plus size={16} />
                        Add code
                      </button>
                    </div>
                  </div>
                  <TotpList
                    entries={vault.totpEntries || []}
                    onEdit={(totp) => {
                      setEditingTotp(totp);
                      setShowTotpModal(true);
                    }}
                    onDelete={handleDeleteTotp}
                    onToggleFavorite={handleToggleFavoriteTotp}
                    onCopy={handleCopyTotpCode}
                    selectedIds={selectedTotpIds}
                    onSelectionChange={setSelectedTotpIds}
                  />
                </>
              ) : currentView === 'notes' ? (
                <>
                  {(vault.notes || []).length > 0 && (
                    <div className="mb-4 flex justify-end">
                      <button
                        onClick={() => {
                          setEditingNote(null);
                          setShowNoteModal(true);
                        }}
                        className="btn-primary !px-3.5 !py-2 text-sm gap-2"
                      >
                        <Plus size={16} />
                        New note
                      </button>
                    </div>
                  )}
                  <NotesList
                    notes={vault.notes || []}
                    onAddNote={() => {
                      setEditingNote(null);
                      setShowNoteModal(true);
                    }}
                    onEditNote={(note) => {
                      setEditingNote(note);
                      setShowNoteModal(true);
                    }}
                    onDeleteNote={handleDeleteNote}
                    onToggleFavorite={handleToggleFavoriteNote}
                  />
                </>
              ) : (
                <>
                  <div className="mb-3 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search passwords"
                        aria-label="Search passwords"
                        className="ai-input !py-2 !pl-9 text-sm h-10"
                      />
                    </div>
                    <button onClick={() => setShowImportModal(true)} className="btn-ghost !px-3.5 !py-2 text-sm gap-2 h-10" title="Import from another password manager">
                      <Upload size={16} />
                      <span className="hidden sm:inline">Import</span>
                    </button>
                    <button onClick={openNewEntry} className="btn-primary !px-3.5 !py-2 text-sm gap-2 h-10">
                      <Plus size={16} />
                      <span className="hidden sm:inline">New item</span>
                    </button>
                  </div>

                  {entryCategories.length > 0 && (
                    <div className="mb-3">
                      <CategoryFilter
                        categories={entryCategories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                      />
                    </div>
                  )}

                  {filteredEntries.length === 0 ? (
                    searchQuery || selectedCategory ? (
                      <EmptyState
                        icon={<Search size={22} strokeWidth={1.7} />}
                        title="No matches"
                        description="Try a different search, or clear the category filter."
                      />
                    ) : (
                      <EmptyState
                        icon={<KeyRound size={22} strokeWidth={1.7} />}
                        title="No passwords yet"
                        description="Add your first login, or import from another password manager. A title and a password are enough."
                        action={
                          <div className="flex gap-2">
                            <button onClick={() => setShowImportModal(true)} className="btn-ghost gap-2">
                              <Upload size={16} />
                              Import
                            </button>
                            <button onClick={openNewEntry} className="btn-primary gap-2">
                              <Plus size={16} />
                              Add password
                            </button>
                          </div>
                        }
                      />
                    )
                  ) : (
                    <div className="list-panel">
                      <div className="hidden md:flex items-center gap-3 bg-surface2/50 px-4 py-2 text-xs font-medium text-muted">
                        <span className="w-9 shrink-0" />
                        <span className="flex-1">Name</span>
                        <span className="hidden w-48 lg:block">Website</span>
                        <span className="w-28">Category</span>
                        <span className="w-[104px]" />
                      </div>
                      {filteredEntries.map((entry) => (
                        <PasswordEntry
                          key={entry.id}
                          entry={entry}
                          onEdit={(entry) => {
                            setEditingEntry(entry);
                            setShowModal(true);
                          }}
                          onDelete={handleDeleteEntry}
                          onDuplicate={handleDuplicateEntry}
                          onToggleFavorite={handleToggleFavoriteEntry}
                          onCopyNotification={(message, countdown) => setCopyNotification({ message, countdown })}
                          clipboardTimeout={vaultSettings.clipboardTimeout}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        )}
      </div>

      <StatusToast kind="success" message={success} />
      <StatusToast kind="error" message={error} />

      {showModal && (
        <EntryModal
          entry={editingEntry || undefined}
          onSave={editingEntry ? handleUpdateEntry : handleAddEntry}
          onClose={() => {
            setShowModal(false);
            setEditingEntry(null);
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImport={handleImportEntries}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {copyNotification && (
        <Toast
          message={copyNotification.message}
          countdown={copyNotification.countdown}
          onClose={() => setCopyNotification(null)}
        />
      )}

      {confirmDelete.show && (
        <ConfirmModal
          title="Delete Entry?"
          message="Are you sure you want to delete this password entry? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteEntry}
          onCancel={() => setConfirmDelete({ show: false, entryId: null })}
        />
      )}

      {showNoteModal && (
        <NoteModal
          note={editingNote || undefined}
          onSave={editingNote ? handleUpdateNote : handleAddNote}
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(null);
          }}
        />
      )}

      {confirmDeleteNote.show && (
        <ConfirmModal
          title="Delete Note?"
          message="Are you sure you want to delete this note? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDeleteNote}
          onCancel={() => setConfirmDeleteNote({ show: false, noteId: null })}
        />
      )}

      {showTotpModal && (
        <TotpModal
          entry={editingTotp || null}
          onSave={editingTotp ? handleUpdateTotp : handleAddTotp}
          onClose={() => {
            setShowTotpModal(false);
            setEditingTotp(null);
          }}
        />
      )}

      {confirmDeleteTotp.show && (
        <ConfirmModal
          title="Delete 2FA Code?"
          message="Are you sure you want to delete this 2FA code? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDeleteTotp}
          onCancel={() => setConfirmDeleteTotp({ show: false, totpId: null })}
        />
      )}

      {confirmDeleteFile.show && (
        <ConfirmModal
          title="Delete File?"
          message="Are you sure you want to delete this file from your vault? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteFileAction}
          onCancel={() => setConfirmDeleteFile({ show: false, fileId: null })}
        />
      )}

      {confirmDeleteFolder.show && (
        <ConfirmModal
          title="Delete Folder?"
          message="Deleting this folder also permanently deletes every file and subfolder inside it. This cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteFolderAction}
          onCancel={() => setConfirmDeleteFolder({ show: false, folderId: null })}
        />
      )}

      {showTotpExportModal && vault && (
        <TotpExportModal
          entries={(vault.totpEntries || []).filter(entry => selectedTotpIds.includes(entry.id))}
          onClose={() => {
            setShowTotpExportModal(false);
            setSelectedTotpIds([]);
          }}
        />
      )}

      <InstallPrompt />
      <OfflineIndicator />
    </div>
  );
}

export default App;
