import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface CardCaptureScreenProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function CardCaptureScreen({ onCapture, onCancel, onPrevious, onNext }: CardCaptureScreenProps) {
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [showShutterEffect, setShowShutterEffect] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileCapture(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileCapture(file);
    }
  };

  const handleFileCapture = async (file: File) => {
    setValidationError(null);
    setIsValidating(true);

    try {
      // COMMENTED OUT: Business card validation
      // const detectionService = CardDetectionService.getInstance();
      // const isValid = await detectionService.validateBusinessCard(file);
      
      // if (!isValid) {
      //   setValidationError('This doesn\'t appear to be a business card. Please upload a clear photo of a business card.');
      //   setIsValidating(false);
      //   return;
      // }

      // For now, accept all images without validation
      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsValidating(false);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationError('Failed to validate image. Please try again.');
      setIsValidating(false);
    }
  };

  const startCamera = async () => {
    setIsCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('✅ Camera access granted');
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('❌ Camera access denied:', err);
      alert('Unable to access camera. Please use file upload instead.');
      setCaptureMode('upload');
    } finally {
      setIsCameraLoading(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      setValidationError(null);
      setIsValidating(true);

      // Show shutter effect
      setShowShutterEffect(true);
      setTimeout(() => setShowShutterEffect(false), 300);

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'business-card.jpg', { type: 'image/jpeg' });
            
            try {
              // COMMENTED OUT: Business card validation
              // const detectionService = CardDetectionService.getInstance();
              // const isValid = await detectionService.validateBusinessCard(file);
              
              // if (!isValid) {
              //   setValidationError('No business card detected! Please position a business card within the frame and try again.');
              //   setIsValidating(false);
              //   return;
              // }

              // For now, accept all photos without validation
              setCapturedFile(file);
              setPreviewUrl(URL.createObjectURL(file));
              stopCamera();
              setIsValidating(false);
            } catch (error) {
              console.error('Validation error:', error);
              setValidationError('Failed to validate card. Please try again.');
              setIsValidating(false);
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Track stopped:', track.kind);
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setCapturedFile(null);
    setValidationError(null);
    if (captureMode === 'camera') {
      startCamera();
    }
  };

  const handleProcess = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      // If onNext is provided, navigate to next step after capture
      if (onNext) {
        onNext();
      }
    }
  };

  const handleCancelCapture = () => {
    stopCamera();
    onCancel();
  };

  // Effect to connect stream to video element
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
      console.log('📹 Video stream connected');
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-start justify-center pt-1 px-3 sm:px-4 md:px-6 overflow-y-auto pb-6">
      {/* Navigation Buttons */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 max-w-6xl mx-auto">
        <button
          onClick={onPrevious || onCancel}
          disabled={!onPrevious}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            onPrevious
              ? 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-300 hover:border-green-300 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Previous Step"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <button
          onClick={onNext}
          disabled={!onNext || !capturedFile}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            onNext && capturedFile
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Next Step"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full mt-16"
      >
        <Card className="mx-auto">
          <div className="space-y-3 sm:space-y-4 md:space-y-5 p-3 sm:p-4 md:p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Capture Business Card</h2>
              <button
                onClick={handleCancelCapture}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Cancel"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>

            {/* Capture Mode Toggle */}
            {!previewUrl && (
              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant={captureMode === 'upload' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setCaptureMode('upload');
                    stopCamera();
                    // Open file picker immediately when clicking Upload button
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 100);
                  }}
                  className="flex-1 !px-3 !py-1.5 !text-sm !rounded-lg"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
                <Button
                  variant={captureMode === 'camera' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setCaptureMode('camera');
                    startCamera();
                  }}
                  className="flex-1 !px-3 !py-1.5 !text-sm !rounded-lg"
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
              </div>
            )}

            {/* Capture Area */}
            <div className="relative bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center mt-2">
              {/* Upload Mode */}
              {!previewUrl && captureMode === 'upload' && !isValidating && (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors cursor-pointer p-6 sm:p-8"
                >
                  <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
                  <p className="text-gray-600 text-center text-sm sm:text-base">
                    Click to upload or drag and drop<br />
                    <span className="text-xs sm:text-sm text-gray-500">Any image up to 10MB</span>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Camera Mode - Loading */}
              {!previewUrl && captureMode === 'camera' && isCameraLoading && (
                <div className="flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-green-500" />
                  </motion.div>
                  <p className="text-gray-600">Starting camera...</p>
                </div>
              )}

              {/* Camera Mode - Active */}
              {!previewUrl && captureMode === 'camera' && !isCameraLoading && stream && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Camera Overlay Guides */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner guides */}
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 border-l-[3px] sm:border-l-4 border-t-[3px] sm:border-t-4 border-green-500"></div>
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 border-r-[3px] sm:border-r-4 border-t-[3px] sm:border-t-4 border-green-500"></div>
                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 border-l-[3px] sm:border-l-4 border-b-[3px] sm:border-b-4 border-green-500"></div>
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 border-r-[3px] sm:border-r-4 border-b-[3px] sm:border-b-4 border-green-500"></div>
                    
                    {/* Center frame */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[85%] sm:w-[80%] h-[55%] sm:h-[60%] border-2 border-green-500/50 rounded-xl sm:rounded-2xl"></div>
                    </div>
                    
                    {/* Instruction text */}
                    <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 text-center px-2">
                      <p className="text-white text-xs sm:text-sm bg-gray-900/70 inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                        Position card within the frame
                      </p>
                    </div>
                  </div>

                  {/* Shutter Effect */}
                  <AnimatePresence>
                    {showShutterEffect && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-white pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Preview Mode */}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Captured business card"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Validating Overlay */}
              {isValidating && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3"
                    />
                    <p className="text-gray-700">Validating...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-600 font-semibold mb-1 text-sm sm:text-base">Validation Failed</p>
                  <p className="text-red-600 text-xs sm:text-sm">{validationError}</p>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {previewUrl ? (
                <>
                  <Button variant="secondary" onClick={handleRetake} className="flex-1 !px-3 !py-1.5 !text-sm !rounded-lg">
                    <X className="w-4 h-4" />
                    Retake
                  </Button>
                  <Button onClick={handleProcess} className="flex-1 !px-3 !py-1.5 !text-sm !rounded-lg" disabled={isValidating}>
                    <Check className="w-4 h-4" />
                    Process Card
                  </Button>
                </>
              ) : captureMode === 'camera' && stream && !isCameraLoading && (
                <Button onClick={capturePhoto} className="w-full !px-3 !py-1.5 !text-sm !rounded-lg" disabled={isValidating}>
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
