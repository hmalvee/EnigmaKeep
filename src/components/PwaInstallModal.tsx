import { X, Smartphone, Chrome, Download } from 'lucide-react';

interface PwaInstallModalProps {
  platform: string;
  onClose: () => void;
}

export function PwaInstallModal({ platform, onClose }: PwaInstallModalProps) {
  const getInstructions = () => {
    switch (platform.toLowerCase()) {
      case 'android':
        return {
          title: 'Install on Android',
          icon: <Smartphone className="text-green-500" size={48} />,
          steps: [
            'Open EnigmaKeep in Chrome or Edge browser',
            'Tap the menu icon (three dots) in the top right',
            'Select "Add to Home screen" or "Install app"',
            'Tap "Add" or "Install" to confirm',
            'EnigmaKeep will appear on your home screen like a native app'
          ],
          note: 'Works best with Chrome or Edge browser on Android devices'
        };
      case 'ios':
        return {
          title: 'Install on iOS',
          icon: (
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-gray-300">
              <path fill="currentColor" d="M17.05,20.28c-0.98,0.95-2.05,0.8-3.08,0.35c-1.09-0.46-2.09-0.48-3.24,0c-1.44,0.62-2.2,0.44-3.06-0.35 C2.79,15.25,3.51,7.59,9.05,7.31c1.35,0.07,2.29,0.74,3.08,0.8c1.18-0.24,2.31-0.93,3.57-0.84c1.51,0.12,2.65,0.72,3.4,1.8 c-3.12,1.87-2.38,5.98,0.48,7.13c-0.57,1.5-1.31,2.99-2.54,4.09l0.01-0.01L17.05,20.28z M12.03,7.25c-0.15-2.23,1.66-4.07,3.74-4.25c0.29,2.58-2.34,4.5-3.74,4.25z"/>
            </svg>
          ),
          steps: [
            'Open EnigmaKeep in Safari browser',
            'Tap the Share button (square with arrow up) at the bottom',
            'Scroll down and tap "Add to Home Screen"',
            'Customize the name if desired, then tap "Add"',
            'EnigmaKeep will appear on your home screen'
          ],
          note: 'Must use Safari browser on iOS/iPadOS devices'
        };
      case 'windows':
        return {
          title: 'Install on Windows',
          icon: (
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-500">
              <path fill="currentColor" d="M3,12V6.75L9,5.43V11.91L3,12M20,3V11.75L10,11.9V5.21L20,3M3,13L9,13.09V19.9L3,18.75V13M20,13.25V22L10,20.09V13.1L20,13.25Z"/>
            </svg>
          ),
          steps: [
            'Open EnigmaKeep in Chrome or Edge browser',
            'Click the install icon (⊕) in the address bar, or',
            'Click the menu (three dots) → "Apps" → "Install EnigmaKeep"',
            'Click "Install" in the popup dialog',
            'EnigmaKeep will open in its own window and appear in your Start menu'
          ],
          note: 'Works with Chrome, Edge, or any Chromium-based browser'
        };
      case 'macos':
        return {
          title: 'Install on macOS',
          icon: (
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-gray-300">
              <path fill="currentColor" d="M17.05,20.28c-0.98,0.95-2.05,0.8-3.08,0.35c-1.09-0.46-2.09-0.48-3.24,0c-1.44,0.62-2.2,0.44-3.06-0.35 C2.79,15.25,3.51,7.59,9.05,7.31c1.35,0.07,2.29,0.74,3.08,0.8c1.18-0.24,2.31-0.93,3.57-0.84c1.51,0.12,2.65,0.72,3.4,1.8 c-3.12,1.87-2.38,5.98,0.48,7.13c-0.57,1.5-1.31,2.99-2.54,4.09l0.01-0.01L17.05,20.28z M12.03,7.25c-0.15-2.23,1.66-4.07,3.74-4.25c0.29,2.58-2.34,4.5-3.74,4.25z"/>
            </svg>
          ),
          steps: [
            'Open EnigmaKeep in Safari, Chrome, or Edge',
            'Safari: Click "File" → "Add to Dock"',
            'Chrome/Edge: Click the install icon in the address bar',
            'Or: Click menu (three dots) → "Install EnigmaKeep"',
            'EnigmaKeep will appear in your Dock and Applications folder'
          ],
          note: 'Best experience with Safari, Chrome, or Edge on macOS'
        };
      case 'linux':
        return {
          title: 'Install on Linux',
          icon: (
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-yellow-500">
              <path fill="currentColor" d="M14.62,8.35C14.2,8.63 12.87,9.39 12.67,9.54C12.28,9.85 11.92,9.83 11.53,9.53C11.33,9.37 10,8.61 9.58,8.34C9.1,8.03 9.13,7.64 9.66,7.42C11.3,6.73 12.94,6.78 14.57,7.45C15.06,7.66 15.08,8.05 14.62,8.35M21.84,15.63C20.91,13.54 19.64,11.64 18,9.97C17.47,9.42 17.14,8.8 16.94,8.09C16.84,7.76 16.77,7.42 16.7,7.08C16.5,6.2 16.41,5.3 16,4.47C15.27,2.89 14,2.07 12.16,2C10.35,2.05 9.05,2.88 8.3,4.47C7.91,5.32 7.83,6.22 7.64,7.11C7.58,7.44 7.5,7.77 7.41,8.1C7.2,8.8 6.87,9.42 6.35,9.97C4.72,11.64 3.44,13.54 2.5,15.63C2.25,16.21 2.16,16.79 2.4,17.39C2.57,17.84 2.89,18.13 3.32,18.25C3.71,18.35 4.1,18.36 4.5,18.36C7.43,18.3 10.13,17.55 12.63,16.07C12.76,16 12.92,15.99 13.05,16.07C15.55,17.55 18.25,18.3 21.17,18.36C21.57,18.36 22,18.35 22.36,18.25C22.79,18.14 23.1,17.84 23.28,17.39C23.5,16.79 23.41,16.21 23.17,15.63L21.84,15.63M7.67,14.68C7.04,14.68 6.54,14.18 6.54,13.55C6.54,12.92 7.04,12.42 7.67,12.42C8.3,12.42 8.8,12.92 8.8,13.55C8.8,14.18 8.3,14.68 7.67,14.68M16.33,14.68C15.7,14.68 15.2,14.18 15.2,13.55C15.2,12.92 15.7,12.42 16.33,12.42C16.96,12.42 17.46,12.92 17.46,13.55C17.46,14.18 16.96,14.68 16.33,14.68Z"/>
            </svg>
          ),
          steps: [
            'Open EnigmaKeep in Chrome, Firefox, or Edge',
            'Chrome/Edge: Click the install icon (⊕) in the address bar',
            'Or: Click menu (three dots) → "Install EnigmaKeep"',
            'Firefox: Click the "⋮" menu → "Install"',
            'EnigmaKeep will be available in your application launcher'
          ],
          note: 'Works with Chrome, Firefox, Edge, or any modern browser'
        };
      default:
        return {
          title: 'Install EnigmaKeep',
          icon: <Download className="text-cyan-400" size={48} />,
          steps: [
            'Open EnigmaKeep in a modern browser',
            'Look for an install icon in the address bar',
            'Or check your browser menu for "Install" option',
            'Follow the prompts to add to your device'
          ],
          note: 'Installation available on most modern browsers'
        };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleIn">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {instructions.icon}
            <div>
              <h2 className="text-2xl font-bold text-white">{instructions.title}</h2>
              <p className="text-gray-400 text-sm">Progressive Web App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Chrome size={18} className="text-cyan-400" />
              Installation Steps
            </h3>
            <ol className="space-y-2.5">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-gray-300 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong className="font-semibold">Note:</strong> {instructions.note}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-semibold"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
