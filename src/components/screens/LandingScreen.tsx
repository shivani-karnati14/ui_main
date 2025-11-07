import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { CardScannerAPI } from '../../services/api';

interface LandingScreenProps {
  onStartScan: () => void;
  activeView?: 'home' | 'chat' | 'scan' | 'upload' | 'analysis' | 'cardscanner';
  onNavClick?: (view: 'home' | 'chat' | 'scan' | 'upload' | 'analysis' | 'cardscanner') => void;
}

export function LandingScreen({ onStartScan, activeView = 'cardscanner', onNavClick }: LandingScreenProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  useEffect(() => {
    const checkBackend = async () => {
      const isReachable = await CardScannerAPI.pingBackend();
      setBackendStatus(isReachable ? 'ready' : 'error');
    };
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col px-4 sm:px-6 overflow-y-auto pb-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full mx-auto pt-1 sm:pt-2"
      >
        {/* Heading Section - Top */}
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
          <div className="flex items-center justify-center">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Scan Business Cards
            </h1>
          </div>
          
          <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
            Transform business cards into digital contacts with AI-powered scanning
          </p>
        </div>
      </motion.div>

      {/* Button with Status Indicator - Center of Screen */}
      <div className="flex items-center justify-center gap-3 max-w-4xl w-full mx-auto py-4 sm:py-6">
        <Button size="lg" onClick={onStartScan}>
          Start Scanning
        </Button>
        
        {/* Backend Status Indicator - Beside Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <div
            className={`
              px-2.5 py-1.5 rounded-full backdrop-blur-2xl border shadow-lg
              flex items-center gap-1.5 text-xs font-medium
              transition-all duration-500
              ${backendStatus === 'ready'
                ? 'bg-green-500/20 border-green-400/50 text-green-700 shadow-green-500/30'
                : backendStatus === 'error'
                ? 'bg-red-500/20 border-red-400/50 text-red-700 shadow-red-500/30'
                : 'bg-gray-500/20 border-gray-400/50 text-gray-700 shadow-gray-500/30'
              }
            `}
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <span className="relative flex h-2.5 w-2.5">
              {backendStatus === 'ready' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span
                className={`
                  relative inline-flex rounded-full h-2.5 w-2.5
                  ${backendStatus === 'ready'
                    ? 'bg-green-500 shadow-lg shadow-green-500/50'
                    : backendStatus === 'error'
                    ? 'bg-red-500 shadow-lg shadow-red-500/50'
                    : 'bg-gray-400 shadow-lg shadow-gray-400/50 animate-pulse'
                  }
                `}
              ></span>
            </span>
            <span>
              {backendStatus === 'ready' ? 'Ready' : backendStatus === 'error' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}