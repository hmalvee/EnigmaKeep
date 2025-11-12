import type { PasswordEntry } from '../types/vault';

export interface CSVExportEntry {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

export function exportToCSV(entries: PasswordEntry[]): string {
  const headers = ['Title', 'Username', 'Password', 'URL', 'Notes'];
  const csvRows = [headers.join(',')];

  for (const entry of entries) {
    const row = [
      escapeCSVField(entry.title),
      escapeCSVField(entry.username || ''),
      escapeCSVField(entry.password),
      escapeCSVField(entry.url || ''),
      escapeCSVField(entry.notes || '')
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

export function exportToJSON(entries: PasswordEntry[]): string {
  const exportData = entries.map(entry => ({
    title: entry.title,
    username: entry.username || '',
    password: entry.password,
    url: entry.url || '',
    notes: entry.notes || '',
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  }));

  return JSON.stringify(exportData, null, 2);
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export interface ImportResult {
  entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[];
  errors: string[];
}

export function importFromCSV(csvContent: string): ImportResult {
  const entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];

  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    errors.push('CSV file is empty or invalid');
    return { entries, errors };
  }

  const headers = parseCSVLine(lines[0]);

  const titleIndex = findHeaderIndex(headers, ['title', 'name', 'account']);
  const usernameIndex = findHeaderIndex(headers, ['username', 'user', 'login', 'email']);
  const passwordIndex = findHeaderIndex(headers, ['password', 'pass']);
  const urlIndex = findHeaderIndex(headers, ['url', 'website', 'site', 'link']);
  const notesIndex = findHeaderIndex(headers, ['notes', 'note', 'comment']);

  if (titleIndex === -1) {
    errors.push('CSV must have a "Title" or "Name" column');
    return { entries, errors };
  }

  if (passwordIndex === -1) {
    errors.push('CSV must have a "Password" column');
    return { entries, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i]);

      if (fields.length === 0) continue;

      const entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        title: fields[titleIndex] || `Entry ${i}`,
        username: usernameIndex !== -1 ? fields[usernameIndex] : undefined,
        password: fields[passwordIndex] || '',
        url: urlIndex !== -1 ? fields[urlIndex] : undefined,
        notes: notesIndex !== -1 ? fields[notesIndex] : undefined
      };

      if (!entry.password) {
        errors.push(`Line ${i + 1}: Missing password, skipping`);
        continue;
      }

      entries.push(entry);
    } catch (error) {
      errors.push(`Line ${i + 1}: Parse error`);
    }
  }

  return { entries, errors };
}

export function importFromJSON(jsonContent: string): ImportResult {
  const entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];

  try {
    const data = JSON.parse(jsonContent);

    if (!Array.isArray(data)) {
      errors.push('JSON must be an array of entries');
      return { entries, errors };
    }

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (!item || typeof item !== 'object') {
        errors.push(`Entry ${i + 1}: Invalid format`);
        continue;
      }

      const title = item.title || item.name || item.account;
      const password = item.password || item.pass;

      if (!password) {
        errors.push(`Entry ${i + 1}: Missing password, skipping`);
        continue;
      }

      entries.push({
        title: title || `Entry ${i + 1}`,
        username: item.username || item.user || item.login || item.email,
        password,
        url: item.url || item.website || item.site,
        notes: item.notes || item.note || item.comment
      });
    }
  } catch (error) {
    errors.push('Invalid JSON format');
  }

  return { entries, errors };
}

export function importFrom1Password(csvContent: string): ImportResult {
  const entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];

  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    errors.push('1Password CSV file is empty');
    return { entries, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i]);

      if (fields.length < 4) continue;

      entries.push({
        title: fields[0] || `Entry ${i}`,
        username: fields[2] || undefined,
        password: fields[3] || '',
        url: fields[1] || undefined,
        notes: fields[4] || undefined
      });
    } catch (error) {
      errors.push(`Line ${i + 1}: Parse error`);
    }
  }

  return { entries, errors };
}

export function importFromLastPass(csvContent: string): ImportResult {
  const entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];

  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    errors.push('LastPass CSV file is empty');
    return { entries, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i]);

      if (fields.length < 4) continue;

      entries.push({
        title: fields[4] || fields[1] || `Entry ${i}`,
        username: fields[1] || undefined,
        password: fields[2] || '',
        url: fields[0] || undefined,
        notes: fields[3] || undefined
      });
    } catch (error) {
      errors.push(`Line ${i + 1}: Parse error`);
    }
  }

  return { entries, errors };
}

export function importFromBitwarden(jsonContent: string): ImportResult {
  const entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];

  try {
    const data = JSON.parse(jsonContent);
    const items = data.items || [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type !== 1) continue;

      const login = item.login || {};

      entries.push({
        title: item.name || `Entry ${i + 1}`,
        username: login.username || undefined,
        password: login.password || '',
        url: login.uris?.[0]?.uri || undefined,
        notes: item.notes || undefined
      });
    }
  } catch (error) {
    errors.push('Invalid Bitwarden JSON format');
  }

  return { entries, errors };
}

export function importFromChrome(csvContent: string): ImportResult {
  const entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];

  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    errors.push('Chrome CSV file is empty');
    return { entries, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i]);

      if (fields.length < 3) continue;

      const url = fields[0] || '';
      const hostname = url ? new URL(url).hostname : `Entry ${i}`;

      entries.push({
        title: hostname,
        username: fields[1] || undefined,
        password: fields[2] || '',
        url: url || undefined,
        notes: undefined
      });
    } catch (error) {
      errors.push(`Line ${i + 1}: Parse error`);
    }
  }

  return { entries, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function findHeaderIndex(headers: string[], possibleNames: string[]): number {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  for (const name of possibleNames) {
    const index = lowerHeaders.indexOf(name.toLowerCase());
    if (index !== -1) return index;
  }

  return -1;
}
