import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X } from 'lucide-react';

interface Props {
  onDetected: (text: string) => void;
  onClose: () => void;
  prompt?: string;
}

/** Full-screen camera view that reads the Secret Key QR from an Emergency Kit. */
export function SecretKeyScanner({
  onDetected,
  onClose,
  prompt = 'Point the camera at the QR code on your Emergency Kit'
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  // Keep the camera running across re-renders that pass a new callback.
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scan = () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          stopped = true;
          onDetectedRef.current(code.data);
          return;
        }
      }
      frame = requestAnimationFrame(scan);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not available in this browser. Type the Secret Key instead.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        frame = requestAnimationFrame(scan);
      } catch {
        setError('Could not open the camera. Allow camera access, or type the Secret Key instead.');
      }
    };

    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Close scanner"
      >
        <X size={24} />
      </button>
      <p className="text-white mb-4 text-center">{prompt}</p>
      {error ? (
        <p className="text-amber-400 text-center max-w-sm">{error}</p>
      ) : (
        <video ref={videoRef} className="w-full max-w-md rounded-xl border-2 border-white/30" playsInline muted />
      )}
    </div>
  );
}
