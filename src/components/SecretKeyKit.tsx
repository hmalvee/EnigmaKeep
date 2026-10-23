import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download } from 'lucide-react';
import { secureCopy } from '../utils/secureClipboard';

interface Props {
  secretKey: string;
  /** Called once the user has downloaded or copied the kit. */
  onSaved?: () => void;
}

const KIT_WIDTH = 800;
const KIT_HEIGHT = 1040;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Render a printable Emergency Kit PNG containing the Secret Key and its QR code. */
async function renderEmergencyKit(secretKey: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = KIT_WIDTH;
  canvas.height = KIT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, KIT_WIDTH, KIT_HEIGHT);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';

  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('EnigmaKeep Emergency Kit', KIT_WIDTH / 2, 80);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#555555';
  ctx.fillText(`Created ${new Date().toLocaleDateString()}`, KIT_WIDTH / 2, 120);

  const qr = await loadImage(
    await QRCode.toDataURL(secretKey, { errorCorrectionLevel: 'M', margin: 2, width: 420 })
  );
  ctx.drawImage(qr, (KIT_WIDTH - 420) / 2, 160, 420, 420);

  ctx.fillStyle = '#111111';
  ctx.font = 'bold 22px ui-monospace, monospace';
  ctx.fillText('SECRET KEY', KIT_WIDTH / 2, 630);
  ctx.font = 'bold 28px ui-monospace, monospace';
  ctx.fillText(secretKey, KIT_WIDTH / 2, 675);

  ctx.textAlign = 'left';
  ctx.font = '21px system-ui, sans-serif';
  const lines = [
    'Your vault needs BOTH your master password and this Secret Key.',
    'This device remembers it. On a new device or browser, scan the QR',
    'code or type the key once when unlocking.',
    '',
    'Keep this kit somewhere safe and private (printed, or in your phone\'s',
    'photos/notes). Someone needs your vault file, master password AND this',
    'key to open your vault.',
    '',
    'Lost the key? Your 12-word recovery phrase still opens the vault.',
    'Master password: ____________________________ (optional, handwrite)'
  ];
  lines.forEach((line, i) => ctx.fillText(line, 60, 740 + i * 30));

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Export failed'))), 'image/png');
  });
}

export function SecretKeyKit({ secretKey, onSaved }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(secretKey, { errorCorrectionLevel: 'M', margin: 2, width: 240 })
      .then(setQrDataUrl)
      .catch(err => console.error('QR generation failed:', err));
  }, [secretKey]);

  const handleCopy = async () => {
    await secureCopy(secretKey, 60_000);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaved?.();
  };

  const handleDownload = async () => {
    try {
      const blob = await renderEmergencyKit(secretKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'EnigmaKeep-Emergency-Kit.png';
      a.click();
      URL.revokeObjectURL(url);
      onSaved?.();
    } catch (err) {
      console.error('Emergency Kit export failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 bg-white rounded-xl p-4">
        {qrDataUrl && <img src={qrDataUrl} alt="Secret Key QR code" width={240} height={240} />}
        <p className="font-mono font-semibold text-gray-900 text-sm sm:text-base break-all text-center select-all">
          {secretKey}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 px-4 py-3 bg-btn hover:bg-btn-hover text-btn-ink hover:shadow-halo rounded-md font-medium flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Download Emergency Kit
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 px-4 py-3 border border-[color:var(--hair)] text-ink rounded-md hover:bg-ink/5 font-medium flex items-center justify-center gap-2"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied!' : 'Copy Secret Key'}
        </button>
      </div>
    </div>
  );
}
