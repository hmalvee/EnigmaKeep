import { useState, useEffect, lazy, Suspense } from 'react';
import { Lock, Plus, Search, Upload, Download, AlertTriangle, Menu } from 'lucide-react';
import { verifyCrypto } from './crypto/encryption';
import {
  createNewVault,
  encryptVault,
  loadVaultFromFile,
  saveVaultToFile,
  addEntry,
  updateEntry,
  deleteEntry,
  searchEntries,
  updateVaultMetadata,
  getVaultMetadata,
  decryptVaultWithRecovery,
  readVaultRecoverySection
} from './utils/vaultManager';
import type { VaultData, PasswordEntry as PasswordEntryType, VaultSettings as VaultSettingsType, Note, TotpEntry } from './types/vault';
import { PasswordEntry } from './components/PasswordEntry';
import { EntryModal } from './components/EntryModal';
import { CategoryFilter } from './components/CategoryFilter';
import { VaultSettings } from './components/VaultSettings';
import { ImportModal } from './components/ImportModal';
import { ThemeToggle } from './components/ThemeToggle';
import { Toast } from './components/Toast';
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
import { isBiometricEnabled, updateBiometricVaultData, decryptBiometricPassword } from './utils/biometric';
import {
  setSessionPassword,
  getSessionPassword,
  setSessionRecoveryPhrase,
  getSessionRecoveryPhrase,
  clearSessionSecrets
} from './utils/sessionSecrets';
import { secureCopy, clearSecureClipboard } from './utils/secureClipboard';
import { waitForUnlockBackoff, recordUnlockFailure, clearUnlockFailures } from './utils/unlockBackoff';
import { LoadingScreen } from './components/LoadingScreen';

const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));
const Details = lazy(() => import('./pages/Details').then(module => ({ default: module.Details })));
const DetailArticle = lazy(() => import('./pages/DetailArticle').then(module => ({ default: module.DetailArticle })));

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
  console.log('Rendering Vault App for path:', currentPath);

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
  const [vaultSettings, setVaultSettings] = useState<VaultSettingsType>({
    idleTimeout: 5 * 60 * 1000,
    clipboardTimeout: 15 * 1000,
    lockOnTabClose: true,
    autoLockOnMinimize: false,
    clearClipboardOnLock: true,
    allowScreenshots: false
  });
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

  useEffect(() => {
    verifyCrypto().then(ready => {
      if (!ready) {
        setError('Crypto self-test failed. The application cannot run safely.');
      }
      setCryptoReady(ready);
    });

    const savedPath = getLastVaultPath();
    setLastVaultPath(savedPath);

    // Purge legacy biometric vault blob cache if present.
    try {
      localStorage.removeItem('vault_file_data');
    } catch {
      /* ignore */
    }

    // Handle navigation
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLock = () => {
    if (vaultSettings.clearClipboardOnLock) {
      void clearSecureClipboard();
    }
    clearSessionSecrets();
    setVault(null);
    setExistingRecoveryData(null);
    setSearchQuery('');
    setEditingEntry(null);
    setEditingNote(null);
    setEditingTotp(null);
    setShowModal(false);
    setShowNoteModal(false);
    setShowTotpModal(false);
    setIsLocked(true);
    setMode('welcome');
  };

  useAutoLock(handleLock, isLocked, {
    idleTimeout: vaultSettings.idleTimeout,
    lockOnHide: !!vaultSettings.autoLockOnMinimize
  });

  useEffect(() => {
    if (vaultSettings.lockOnTabClose) {
      const handleBeforeUnload = () => {
        clearSessionSecrets();
        if (vaultSettings.clearClipboardOnLock) {
          void clearSecureClipboard();
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [vaultSettings.lockOnTabClose, vaultSettings.clearClipboardOnLock]);

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

  const DEFAULT_SETTINGS: VaultSettingsType = {
    idleTimeout: 5 * 60 * 1000,
    clipboardTimeout: 15 * 1000,
    lockOnTabClose: true,
    autoLockOnMinimize: false,
    clearClipboardOnLock: true,
    allowScreenshots: false
  };

  const applyVaultSettings = (loaded: VaultData) => {
    if (loaded.settings) {
      setVaultSettings({ ...DEFAULT_SETTINGS, ...loaded.settings });
    }
  };

  const handleCreateVaultComplete = async (password: string, recoveryPhraseHash: string, handle: FileSystemFileHandle, phrase: string) => {
    try {
      const newVault = await createNewVault(recoveryPhraseHash);
      newVault.settings = { ...vaultSettings };
      await saveVaultToFile(handle, newVault, password, phrase, undefined);

      setSessionPassword(password);
      // Phrase only needed while rewriting recovery; drop after first save.
      setSessionRecoveryPhrase(null);
      setVault(newVault);
      setFileHandle(handle);
      setExistingRecoveryData(null);
      setIsLocked(false);
      setMode('vault');
      clearUnlockFailures();

      saveLastVaultPath(handle.name);
      setLastVaultPath(handle.name);
      await saveLastVaultHandle(handle);

      setSuccess('Vault created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create vault');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBiometricLoginSuccess = async () => {
    try {
      await waitForUnlockBackoff();
      const password = await decryptBiometricPassword();
      if (!password) {
        setError('No saved credentials found. Please login with master password to re-enable biometric.');
        setTimeout(() => setError(''), 3000);
        return;
      }

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

  const saveBiometricVaultData = async (password: string) => {
    try {
      await updateBiometricVaultData(password);
    } catch (err) {
      console.error('Failed to save biometric vault data:', err);
    }
  };

  const handleLoginWithPassword = async (password: string, file: File, handle: FileSystemFileHandle | null) => {
    try {
      await waitForUnlockBackoff();
      const loadedVault = await loadVaultFromFile(file, password);

      const recoverySection = await readVaultRecoverySection(file);
      if (recoverySection) {
        setExistingRecoveryData(recoverySection);
      }

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

      if (isBiometricEnabled()) {
        await saveBiometricVaultData(password);
      }

      setSuccess('Vault unlocked successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      recordUnlockFailure();
      if (err.message?.includes('password') || err.message?.includes('Decryption')) {
        setError('Incorrect password');
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
      if (!handle) {
        throw new Error('A writable vault file is required to complete recovery');
      }
      const phraseHash = await deriveKeyFromRecoveryPhrase(seedPhrase);
      const metadata = await getVaultMetadata(file);

      if (metadata?.recoveryPhraseHash) {
        if (metadata.recoveryPhraseHash !== phraseHash) {
          throw new Error('Recovery phrase does not match');
        }
      }

      const loadedVault = await decryptVaultWithRecovery(file, seedPhrase);

      if (loadedVault.recoveryPhraseHash && loadedVault.recoveryPhraseHash !== phraseHash) {
        throw new Error('Recovery phrase does not match');
      }

      // Re-encrypt recovery block under derived key + new master password.
      await saveVaultToFile(handle, loadedVault, newPassword, seedPhrase, undefined);

      setSessionPassword(newPassword);
      setSessionRecoveryPhrase(null);
      setVault(loadedVault);
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
        await saveBiometricVaultData(newPassword);
      }

      setSuccess('Vault recovered and password reset successfully');
      setTimeout(() => setSuccess(''), 3000);
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

  const updateBiometricDataAfterSave = async () => {
    const password = getSessionPassword();
    if (!isBiometricEnabled() || !password) {
      return;
    }

    try {
      await updateBiometricVaultData(password);
    } catch (err) {
      console.error('Failed to update biometric data:', err);
    }
  };

  const handleSaveVault = async () => {
    const masterPassword = getSessionPassword();
    if (!vault || !masterPassword) return;

    try {
      if (fileHandle) {
        await saveVaultToFile(fileHandle, vault, masterPassword, getSessionRecoveryPhrase() || undefined, existingRecoveryData);
        setVault(prev => prev ? { ...prev, lastBackup: Date.now() } : null);
      } else {
        const updatedVault = { ...vault, lastBackup: Date.now() };
        const blob = await encryptVault(updatedVault, masterPassword);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-${Date.now()}.dat`;
        a.click();
        URL.revokeObjectURL(url);
        setVault(updatedVault);
      }
      setSuccess('Vault saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save vault');
    }
  };

  const persistVault = async (updatedVault: VaultData) => {
    setVault(updatedVault);
    const masterPassword = getSessionPassword();
    if (fileHandle && masterPassword) {
      await saveVaultToFile(
        fileHandle,
        updatedVault,
        masterPassword,
        getSessionRecoveryPhrase() || undefined,
        existingRecoveryData
      );
      await updateBiometricDataAfterSave();
    }
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

    setSessionPassword(newPassword);
    if (fileHandle) {
      await saveVaultToFile(
        fileHandle,
        vault,
        newPassword,
        getSessionRecoveryPhrase() || undefined,
        existingRecoveryData
      );

      if (isBiometricEnabled()) {
        await updateBiometricVaultData(newPassword);
      }
    }
  };

  const handleBiometricSetupComplete = async () => {
    const masterPassword = getSessionPassword();
    if (vault && masterPassword) {
      await updateBiometricVaultData(masterPassword);
    }
  };

  const handleRegenerateRecoveryPhrase = async (newPhraseHash: string, newPhrase: string) => {
    if (!vault) return;
    const masterPassword = getSessionPassword();
    if (!masterPassword) return;

    const updatedVault = updateVaultMetadata(vault, { recoveryPhraseHash: newPhraseHash });
    setVault(updatedVault);
    setExistingRecoveryData(null);

    if (fileHandle) {
      // Phrase needed once to rewrite the recovery block, then discarded.
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, newPhrase, undefined);
      setSessionRecoveryPhrase(null);
      await updateBiometricDataAfterSave();
    }
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-backup-${new Date().toISOString().split('T')[0]}.dat`;
      a.click();
      URL.revokeObjectURL(url);
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
      <div className="min-h-screen bg-vault-dark flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center animate-scaleIn">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft border border-red-500/20">
            <AlertTriangle className="text-red-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Security Error</h1>
          <p className="text-gray-400">
            Cryptographic verification failed. The application cannot run safely.
          </p>
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  if (isLocked || !vault) {
    if (mode === 'welcome') {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 ai-grid-bg opacity-30 dark:opacity-20" />
          <div className="ambient-orb top-[-10%] left-[-5%] w-[420px] h-[420px] bg-accent/20" />
          <div className="ambient-orb bottom-[-15%] right-[-8%] w-[380px] h-[380px] bg-accent-2/15" style={{ animationDelay: '-4s' }} />

          <div className="glass-card p-8 max-w-2xl w-full animate-scaleIn relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/15 rounded-2xl mb-4 border border-accent/25 animate-soft-glow">
                <Lock className="text-accent" size={30} />
              </div>
              <h1 className="text-3xl font-display font-bold text-ink mb-2 tracking-tight">EnigmaKeep</h1>
              <p className="text-sm text-accent font-medium">Offline · Zero-knowledge · Yours</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('open')}
                className="p-6 rounded-2xl border border-line bg-surface2/50 hover:border-accent/40 hover:bg-surface2 transition-all duration-300 group text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-accent/20">
                    <Upload className="text-accent" size={24} />
                  </div>
                  <h3 className="font-display font-semibold text-ink mb-1">Open Vault</h3>
                  <p className="text-sm text-muted">Access your existing password vault</p>
                </div>
              </button>

              <button
                onClick={() => setMode('create')}
                className="p-6 rounded-2xl border border-line bg-surface2/50 hover:border-success/40 hover:bg-surface2 transition-all duration-300 group text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-success/20">
                    <Plus className="text-success" size={24} />
                  </div>
                  <h3 className="font-display font-semibold text-ink mb-1">Create Vault</h3>
                  <p className="text-sm text-muted">Set up a new secure password vault</p>
                </div>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-line text-center">
              <p className="text-xs text-muted font-mono tracking-wide">
                AES-256-GCM · PBKDF2 600K · ZERO KNOWLEDGE
              </p>
            </div>
          </div>
          <OfflineIndicator />
        </div>
      );
    }

    if (mode === 'create') {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 ai-grid-bg opacity-25" />
          <div className="ambient-orb top-1/4 right-1/4 w-[300px] h-[300px] bg-accent/15" />
          <div className="glass-card p-6 sm:p-8 animate-scaleIn relative z-10 w-full max-w-lg">
            <CreateVaultFlow
              onComplete={handleCreateVaultComplete}
              onCancel={() => setMode('welcome')}
              error={error}
            />
          </div>
          <OfflineIndicator />
        </div>
      );
    }

    if (mode === 'open') {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 ai-grid-bg opacity-25" />
          <div className="ambient-orb bottom-1/3 left-1/4 w-[300px] h-[300px] bg-accent-2/15" />
          <div className="glass-card p-6 sm:p-8 animate-scaleIn w-full max-w-md relative z-10">
            <LoginScreen
              onLogin={handleLoginWithPassword}
              onRecoverWithSeedPhrase={handleRecoverWithSeedPhrase}
              onBiometricLogin={handleBiometricLoginSuccess}
              lastVaultPath={lastVaultPath}
              error={error}
            />
            <div className="mt-6 text-center">
              <button
                onClick={() => setMode('welcome')}
                className="text-sm text-muted hover:text-accent transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
          <OfflineIndicator />
        </div>
      );
    }

    return null;
  }

  // Vault app main UI
  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        passwordCount={vault.entries.length}
        noteCount={(vault.notes || []).length}
        totpCount={(vault.totpEntries || []).length}
        fileCount={(vault.files || []).length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-surface/95 backdrop-blur-xl border-b border-line sticky top-0 z-40">
          <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-muted hover:text-ink transition-colors shrink-0"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              <h1 className="text-lg sm:text-xl font-display font-semibold text-ink tracking-tight truncate">
                {currentView === 'passwords' ? 'Passwords' : currentView === 'notes' ? 'Notes' : currentView === 'totp' ? '2FA Codes' : currentView === 'files' ? 'Files' : 'Settings'}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <button
                onClick={handleSaveVault}
                className="btn-primary !px-3 sm:!px-4 !py-2 text-sm gap-1.5"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                onClick={handleLock}
                className="btn-ghost !px-3 sm:!px-4 !py-2 text-sm gap-1.5"
              >
                <Lock size={15} />
                <span className="hidden sm:inline">Lock</span>
              </button>
            </div>
          </div>
        </header>

        {/* Success/Error Messages */}
        {success && (
          <div className="px-6 py-4">
            <div className="p-4 bg-neon-green/10 border border-neon-green/20 rounded-xl text-neon-green text-sm font-medium animate-slideIn backdrop-blur-sm">
              {success}
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-slideIn backdrop-blur-sm">
              {error}
            </div>
          </div>
        )}

        {/* Content Area */}
        {currentView === 'settings' && vault ? (
          <div className="flex-1 overflow-auto p-6">
            <VaultSettings
              vault={vault}
              settings={vaultSettings}
              masterPassword={getSessionPassword() || ''}
              onClose={() => setCurrentView('passwords')}
              onChangeMasterPassword={handleChangeMasterPassword}
              onRegenerateRecoveryPhrase={handleRegenerateRecoveryPhrase}
              onUpdateSettings={handleUpdateSettings}
              onExportBackup={handleExportBackup}
              onBiometricSetupComplete={handleBiometricSetupComplete}
            />
          </div>
        ) : currentView === 'totp' ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex gap-3">
                {selectedTotpIds.length > 0 && (
                  <button
                    onClick={() => setShowTotpExportModal(true)}
                    className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                  >
                    <Download size={18} />
                    Export Selected ({selectedTotpIds.length})
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      try {
                        const content = await file.text();
                        const importedTotpEntries = JSON.parse(content) as TotpEntry[];
                        if (!Array.isArray(importedTotpEntries)) {
                          throw new Error('Invalid format');
                        }
                        const updatedVault = {
                          ...vault,
                          totpEntries: [...(vault.totpEntries || []), ...importedTotpEntries],
                          updatedAt: Date.now()
                        };
                        await persistVault(updatedVault);
                        setSuccess(`Imported ${importedTotpEntries.length} 2FA code(s)`);
                        setTimeout(() => setSuccess(''), 3000);
                      } catch (err) {
                        setError('Failed to import 2FA codes. Please check the file format.');
                        setTimeout(() => setError(''), 3000);
                      }
                    };
                    input.click();
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                >
                  <Upload size={18} />
                  Import
                </button>
                <button
                  onClick={() => {
                    setEditingTotp(null);
                    setShowTotpModal(true);
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                >
                  <Plus size={18} />
                  Add 2FA Code
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
          </div>
        ) : currentView === 'files' ? (
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
        ) : currentView === 'notes' ? (
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
        ) : (
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, username, site…"
                  className="w-full pl-11 pr-4 py-3 ai-input"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex-1 sm:flex-none px-4 py-3 btn-ghost !py-3 border border-line"
                >
                  <Upload size={18} />
                  <span className="hidden sm:inline">Import</span>
                </button>
                <button
                  onClick={() => {
                    setEditingEntry(null);
                    setShowModal(true);
                  }}
                  className="flex-1 sm:flex-none px-4 py-3 btn-primary !py-3"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>

            {entryCategories.length > 0 && (
              <div className="mb-4">
                <CategoryFilter
                  categories={entryCategories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>
            )}

            {filteredEntries.length === 0 ? (
              <div className="text-center py-16 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mb-4 border border-accent/20">
                  <Lock className="text-accent" size={28} />
                </div>
                <h3 className="text-xl font-display font-semibold text-ink mb-2">
                  {searchQuery || selectedCategory ? 'No matches' : 'No passwords yet'}
                </h3>
                <p className="text-muted mb-6 text-sm max-w-sm mx-auto">
                  {searchQuery || selectedCategory
                    ? 'Try another search or clear the category filter'
                    : 'Add your first login — title and password is enough'}
                </p>
                {!searchQuery && !selectedCategory && (
                  <button
                    onClick={() => {
                      setEditingEntry(null);
                      setShowModal(true);
                    }}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add first password
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3 vault-stagger">
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
          </div>
        )}
      </div>

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
