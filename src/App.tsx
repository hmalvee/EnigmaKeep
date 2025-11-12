import { useState, useEffect, lazy, Suspense } from 'react';
import { Lock, Unlock, Plus, Search, Upload, Download, AlertTriangle, Key, Settings, Loader, Menu } from 'lucide-react';
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
  decryptVaultWithRecovery
} from './utils/vaultManager';
import type { VaultData, PasswordEntry as PasswordEntryType, VaultSettings as VaultSettingsType, Note, TotpEntry } from './types/vault';
import { PasswordEntry } from './components/PasswordEntry';
import { EntryModal } from './components/EntryModal';
import { RecoveryPhraseSetup } from './components/RecoveryPhraseSetup';
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
import { NoteModal } from './components/NoteModal';
import { TotpModal } from './components/TotpModal';
import { TotpList } from './components/TotpList';
import { TotpExportModal } from './components/TotpExportModal';
import { useAutoLock } from './hooks/useAutoLock';
import { generateRecoveryPhrase, deriveKeyFromRecoveryPhrase, splitPhraseIntoWords } from './crypto/recoveryPhrase';
import { saveLastVaultPath, getLastVaultPath, saveLastVaultHandle } from './utils/vaultStorage';
import { isBiometricEnabled, updateBiometricVaultData } from './utils/biometric';
import { LoadingScreen } from './components/LoadingScreen';

const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));

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
  const [masterPassword, setMasterPassword] = useState('');
  const [mode, setMode] = useState<'welcome' | 'create' | 'open' | 'vault' | 'settings'>('welcome');
  const [lastVaultPath, setLastVaultPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [existingRecoveryData, setExistingRecoveryData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copyNotification, setCopyNotification] = useState<{ message: string; countdown: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; entryId: string | null }>({ show: false, entryId: null });
  const [currentView, setCurrentView] = useState<'passwords' | 'notes' | 'totp' | 'settings'>('passwords');
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

    // Handle navigation
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLock = () => {
    if (vaultSettings.clearClipboardOnLock) {
      navigator.clipboard.writeText('');
    }
    setIsLocked(true);
    setMasterPassword('');
    setSearchQuery('');
    setMode('welcome');
  };

  useAutoLock(handleLock, isLocked, vaultSettings.idleTimeout);

  useEffect(() => {
    if (vaultSettings.lockOnTabClose) {
      const handleBeforeUnload = () => {
        handleLock();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [vaultSettings.lockOnTabClose]);

  useEffect(() => {
    if (vaultSettings.autoLockOnMinimize && !isLocked) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          handleLock();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [vaultSettings.autoLockOnMinimize, isLocked]);

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

  const handleCreateVaultComplete = async (password: string, recoveryPhraseHash: string, handle: FileSystemFileHandle, phrase: string) => {
    try {
      const newVault = await createNewVault(recoveryPhraseHash);
      await saveVaultToFile(handle, newVault, password, phrase, undefined);

      setVault(newVault);
      setFileHandle(handle);
      setMasterPassword(password);
      setRecoveryPhrase(phrase);
      setExistingRecoveryData(null);
      setIsLocked(false);
      setMode('vault');

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
    const storedPassword = localStorage.getItem('vault_password_encrypted');
    const storedVaultData = localStorage.getItem('vault_file_data');

    if (!storedPassword || !storedVaultData) {
      setError('No saved credentials. Please login with master password first.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const password = atob(storedPassword);
      const vaultData = JSON.parse(storedVaultData);
      const file = new File([vaultData.content], vaultData.name, { type: 'application/octet-stream' });

      await handleLoginWithPassword(password, file, null);
    } catch (err: any) {
      setError('Biometric login failed. Please use master password.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const saveBiometricVaultData = async (password: string, file: File) => {
    try {
      const fileContent = await file.text();
      localStorage.setItem('vault_password_encrypted', btoa(password));
      localStorage.setItem('vault_file_data', JSON.stringify({ name: file.name, content: fileContent }));
    } catch (err) {
      console.error('Failed to save biometric vault data:', err);
    }
  };

  const handleLoginWithPassword = async (password: string, file: File, handle: FileSystemFileHandle | null) => {
    try {
      const loadedVault = await loadVaultFromFile(file, password);

      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.recoveryKeyData) {
        setExistingRecoveryData(parsed.recoveryKeyData);
      }

      setVault(loadedVault);
      setFileHandle(handle);
      setMasterPassword(password);
      setIsLocked(false);
      setMode('vault');

      saveLastVaultPath(file.name);
      setLastVaultPath(file.name);
      if (handle) {
        await saveLastVaultHandle(handle);
      }

      if (isBiometricEnabled()) {
        await saveBiometricVaultData(password, file);
      }

      setSuccess('Vault unlocked successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.message?.includes('password')) {
        setError('Incorrect password');
      } else {
        setError('Failed to load vault');
      }
      setTimeout(() => setError(''), 3000);
      throw err;
    }
  };

  const handleRecoverWithSeedPhrase = async (seedPhrase: string, newPassword: string, file: File, handle: FileSystemFileHandle) => {
    try {
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

      await saveVaultToFile(handle, loadedVault, newPassword, seedPhrase, undefined);

      setVault(loadedVault);
      setFileHandle(handle);
      setMasterPassword(newPassword);
      setRecoveryPhrase(seedPhrase);
      setExistingRecoveryData(null);
      setIsLocked(false);
      setMode('vault');

      saveLastVaultPath(file.name);
      setLastVaultPath(file.name);
      if (handle) {
        await saveLastVaultHandle(handle);
      }

      setSuccess('Vault recovered and password reset successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.message?.includes('does not match')) {
        setError('Recovery phrase does not match');
      } else if (err.message?.includes('recovery phrase')) {
        setError('Invalid recovery phrase');
      } else if (err.message?.includes('decrypt')) {
        setError('Recovery phrase does not match');
      } else {
        setError('Failed to recover vault');
      }
      setTimeout(() => setError(''), 3000);
      throw err;
    }
  };

  const updateBiometricDataAfterSave = async (vaultToSave: VaultData) => {
    if (!isBiometricEnabled() || !fileHandle || !masterPassword) {
      return;
    }

    try {
      const blob = await encryptVault(vaultToSave, masterPassword);
      const vaultData = await blob.text();

      const updated = await updateBiometricVaultData(
        masterPassword,
        vaultData,
        fileHandle.name
      );

      if (updated) {
        console.log('Biometric data updated successfully');
      }
    } catch (err) {
      console.error('Failed to update biometric data:', err);
    }
  };

  const handleSaveVault = async () => {
    if (!vault || !masterPassword) return;

    try {
      if (fileHandle) {
        await saveVaultToFile(fileHandle, vault, masterPassword, recoveryPhrase, existingRecoveryData);
        setVault(prev => prev ? { ...prev, lastBackup: Date.now() } : null);
      } else {
        const updatedVault = { ...vault, lastBackup: Date.now() };
        const blob = await encryptVault(updatedVault, masterPassword);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vault-${Date.now()}.enc`;
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

  const handleAddEntry = async (entry: Omit<PasswordEntryType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!vault) return;
    const updatedVault = addEntry(vault, entry);
    setVault(updatedVault);

    if (fileHandle && masterPassword) {
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
      await updateBiometricDataAfterSave(updatedVault);
    }
  };

  const handleImportEntries = async (entries: Omit<PasswordEntryType, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (!vault) return;

    let updatedVault = vault;
    for (const entry of entries) {
      updatedVault = addEntry(updatedVault, entry);
    }

    setVault(updatedVault);

    if (fileHandle && masterPassword) {
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
      await updateBiometricDataAfterSave(updatedVault);
    }

    setSuccess(`Imported ${entries.length} entries successfully`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpdateEntry = async (entry: Omit<PasswordEntryType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!vault || !editingEntry) return;
    const updatedVault = updateEntry(vault, editingEntry.id, entry);
    setVault(updatedVault);
    setEditingEntry(null);

    if (fileHandle && masterPassword) {
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
      await updateBiometricDataAfterSave(updatedVault);
    }
  };

  const handleDuplicateEntry = async (entry: PasswordEntryType) => {
    if (!vault) return;
    const duplicatedEntry = {
      title: `${entry.title} (Copy)`,
      username: entry.username,
      password: entry.password,
      url: entry.url,
      notes: entry.notes
    };
    const updatedVault = addEntry(vault, duplicatedEntry);
    setVault(updatedVault);

    if (fileHandle && masterPassword) {
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
      await updateBiometricDataAfterSave(updatedVault);
    }

    setSuccess('Entry duplicated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteEntry = async (id: string) => {
    setConfirmDelete({ show: true, entryId: id });
  };

  const confirmDeleteEntry = async () => {
    if (!vault || !confirmDelete.entryId) return;

    const updatedVault = deleteEntry(vault, confirmDelete.entryId);
    setVault(updatedVault);

    if (fileHandle && masterPassword) {
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
      await updateBiometricDataAfterSave(updatedVault);
    }

    setConfirmDelete({ show: false, entryId: null });
    setSuccess('Entry deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Note handlers
  const handleAddNote = (noteData: Partial<Note>) => {
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
    const updatedVault = {
      ...vault,
      notes: [...(vault.notes || []), newNote],
      updatedAt: Date.now()
    };
    setVault(updatedVault);
    setShowNoteModal(false);
    setEditingNote(null);

    if (fileHandle && masterPassword) {
      saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
    }

    setSuccess('Note saved successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpdateNote = (noteData: Partial<Note>) => {
    if (!vault || !editingNote) return;
    const updatedNotes = (vault.notes || []).map(note =>
      note.id === editingNote.id
        ? { ...note, ...noteData, updatedAt: Date.now() }
        : note
    );
    const updatedVault = {
      ...vault,
      notes: updatedNotes,
      updatedAt: Date.now()
    };
    setVault(updatedVault);
    setShowNoteModal(false);
    setEditingNote(null);

    if (fileHandle && masterPassword) {
      saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
    }

    setSuccess('Note updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteNote = (noteId: string) => {
    setConfirmDeleteNote({ show: true, noteId });
  };

  const handleConfirmDeleteNote = async () => {
    if (!vault || !confirmDeleteNote.noteId) return;
    const updatedNotes = (vault.notes || []).filter(note => note.id !== confirmDeleteNote.noteId);
    const updatedVault = {
      ...vault,
      notes: updatedNotes,
      updatedAt: Date.now()
    };
    setVault(updatedVault);

    if (fileHandle && masterPassword) {
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
    }

    setConfirmDeleteNote({ show: false, noteId: null });
    setSuccess('Note deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleFavoriteNote = (noteId: string) => {
    if (!vault) return;
    const updatedNotes = (vault.notes || []).map(note =>
      note.id === noteId
        ? { ...note, favorite: !note.favorite, updatedAt: Date.now() }
        : note
    );
    const updatedVault = {
      ...vault,
      notes: updatedNotes,
      updatedAt: Date.now()
    };
    setVault(updatedVault);

    if (fileHandle && masterPassword) {
      saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
    }
  };

  const handleAddTotp = (totpData: Omit<TotpEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!vault) return;
    const newTotp: TotpEntry = {
      ...totpData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updatedVault = {
      ...vault,
      totpEntries: [...(vault.totpEntries || []), newTotp],
      updatedAt: Date.now()
    };
    setVault(updatedVault);
    setShowTotpModal(false);
    setEditingTotp(null);

    if (fileHandle && masterPassword) {
      saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
    }

    setSuccess('2FA code saved successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpdateTotp = (totpData: Omit<TotpEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!vault || !editingTotp) return;
    const updatedTotpEntries = (vault.totpEntries || []).map(totp =>
      totp.id === editingTotp.id
        ? { ...totp, ...totpData, updatedAt: Date.now() }
        : totp
    );
    const updatedVault = {
      ...vault,
      totpEntries: updatedTotpEntries,
      updatedAt: Date.now()
    };
    setVault(updatedVault);
    setShowTotpModal(false);
    setEditingTotp(null);

    if (fileHandle && masterPassword) {
      saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
    }

    setSuccess('2FA code updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteTotp = (totpId: string) => {
    setConfirmDeleteTotp({ show: true, totpId });
  };

  const handleConfirmDeleteTotp = async () => {
    if (!vault || !confirmDeleteTotp.totpId) return;
    const updatedTotpEntries = (vault.totpEntries || []).filter(totp => totp.id !== confirmDeleteTotp.totpId);
    const updatedVault = {
      ...vault,
      totpEntries: updatedTotpEntries,
      updatedAt: Date.now()
    };
    setVault(updatedVault);

    if (fileHandle && masterPassword) {
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
    }

    setConfirmDeleteTotp({ show: false, totpId: null });
    setSuccess('2FA code deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleFavoriteTotp = (totpId: string) => {
    if (!vault) return;
    const updatedTotpEntries = (vault.totpEntries || []).map(totp =>
      totp.id === totpId
        ? { ...totp, favorite: !totp.favorite, updatedAt: Date.now() }
        : totp
    );
    const updatedVault = {
      ...vault,
      totpEntries: updatedTotpEntries,
      updatedAt: Date.now()
    };
    setVault(updatedVault);

    if (fileHandle && masterPassword) {
      saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
    }
  };

  const handleCopyTotpCode = (code: string, title: string) => {
    navigator.clipboard.writeText(code);
    setSuccess(`${title} code copied to clipboard`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChangeMasterPassword = async (oldPassword: string, newPassword: string) => {
    if (!vault) return;

    if (oldPassword !== masterPassword) {
      throw new Error('Current password is incorrect');
    }

    setMasterPassword(newPassword);
    if (fileHandle) {
      await saveVaultToFile(fileHandle, vault, newPassword, recoveryPhrase, existingRecoveryData);

      if (isBiometricEnabled()) {
        const blob = await encryptVault(vault, newPassword);
        const vaultData = await blob.text();
        localStorage.setItem('vault_password_encrypted', btoa(newPassword));
        localStorage.setItem('vault_file_data', JSON.stringify({ name: fileHandle.name, content: vaultData }));
      }
    }
  };

  const handleBiometricSetupComplete = async () => {
    if (vault && masterPassword && fileHandle) {
      const blob = await encryptVault(vault, masterPassword);
      const vaultData = await blob.text();
      localStorage.setItem('vault_password_encrypted', btoa(masterPassword));
      localStorage.setItem('vault_file_data', JSON.stringify({ name: fileHandle.name, content: vaultData }));
    }
  };

  const handleRegenerateRecoveryPhrase = async (newPhraseHash: string, newPhrase: string) => {
    if (!vault) return;

    const updatedVault = updateVaultMetadata(vault, { recoveryPhraseHash: newPhraseHash });
    setVault(updatedVault);
    setRecoveryPhrase(newPhrase);
    setExistingRecoveryData(null);

    if (fileHandle) {
      await saveVaultToFile(fileHandle, updatedVault, masterPassword, newPhrase, undefined);
      await updateBiometricDataAfterSave(updatedVault);
    }
  };

  const handleUpdateSettings = (newSettings: VaultSettingsType) => {
    setVaultSettings(newSettings);
  };

  const handleExportBackup = async () => {
    if (!vault || !masterPassword) return;

    try {
      const updatedVault = { ...vault, lastBackup: Date.now() };
      const blob = await encryptVault(updatedVault, masterPassword);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault-backup-${new Date().toISOString().split('T')[0]}.enc`;
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

  const filteredEntries = vault
    ? searchQuery
      ? searchEntries(vault, searchQuery)
      : vault.entries
    : [];

  if (!cryptoReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-scaleIn">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-2xl w-full animate-scaleIn">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl mb-4 shadow-lg border border-cyan-500/30">
                <Lock className="text-cyan-400" size={36} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">EnigmaKeep</h1>
              <p className="text-gray-400">Your Digital Fortress</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('open')}
                className="p-6 border-2 border-gray-700 rounded-xl hover:border-cyan-500 hover:bg-gray-700/50 transition-all duration-200 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 border border-cyan-500/30">
                    <Upload className="text-cyan-400" size={28} />
                  </div>
                  <h3 className="font-bold text-white mb-2">Open Vault</h3>
                  <p className="text-sm text-gray-400">Access your existing password vault</p>
                </div>
              </button>

              <button
                onClick={() => setMode('create')}
                className="p-6 border-2 border-gray-700 rounded-xl hover:border-emerald-500 hover:bg-gray-700/50 transition-all duration-200 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 border border-emerald-500/30">
                    <Plus className="text-emerald-400" size={28} />
                  </div>
                  <h3 className="font-bold text-white mb-2">Create Vault</h3>
                  <p className="text-sm text-gray-400">Set up a new secure password vault</p>
                </div>
              </button>
          </div>

            <div className="mt-8 pt-6 border-t border-gray-700 text-center">
              <p className="text-xs text-gray-500">
                All data is encrypted locally using AES-GCM.<br />
                No data is sent to any server.
              </p>
            </div>
          </div>
          <OfflineIndicator />
        </div>
      );
    }

    if (mode === 'create') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 animate-scaleIn">
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 animate-scaleIn w-full max-w-md">
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
                className="text-sm text-gray-400 hover:text-white transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        passwordCount={vault.entries.length}
        noteCount={(vault.notes || []).length}
        totpCount={(vault.totpEntries || []).length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentView === 'passwords' ? 'Passwords' : currentView === 'notes' ? 'Notes' : currentView === 'totp' ? '2FA Codes' : 'Settings'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={handleSaveVault}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
              >
                <Download size={16} />
                Save
              </button>
              <button
                onClick={handleLock}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <Lock size={16} />
                Lock
              </button>
            </div>
          </div>
        </header>

        {/* Success/Error Messages */}
        {success && (
          <div className="px-6 py-4">
            <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-medium shadow-sm animate-slideIn">
              {success}
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-4">
            <div className="p-4 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium shadow-sm animate-slideIn">
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
              masterPassword={masterPassword}
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
                        setVault(updatedVault);
                        if (fileHandle && masterPassword) {
                          await saveVaultToFile(fileHandle, updatedVault, masterPassword, recoveryPhrase, existingRecoveryData);
                        }
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
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search passwords..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
              >
                <Upload size={18} />
                Import
              </button>
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setShowModal(true);
                }}
                className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
              >
                <Plus size={18} />
                Add Entry
              </button>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="text-center py-16 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl mb-4 shadow-lg border border-cyan-500/30">
                  <Lock className="text-cyan-400" size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No matches found' : 'No passwords yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Start by adding your first password entry'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 inline-flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                  >
                    <Plus size={20} />
                    Add First Entry
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
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
