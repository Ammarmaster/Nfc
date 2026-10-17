import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Search, 
  Zap, 
  RotateCw, 
  Check, 
  AlertCircle, 
  Unlink, 
  Link2, 
  ExternalLink, 
  Layers, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Power
} from 'lucide-react';
import jsQR from 'jsqr';
import type { Stand, Business, DestinationType } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';
import { MilkySpinner } from './MilkyLoader';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stands: Stand[];
  businesses: Business[];
  onRefreshStands: () => void;
  domain: string;
  onOpenCustomerView?: (stand: Stand) => void;
  onEditStand?: (stand: Stand) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  stands,
  businesses,
  onRefreshStands,
  domain,
  onOpenCustomerView,
  onEditStand,
}) => {
  // Scanner Mode: 'camera' | 'upload' | 'manual'
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Scanned State
  const [scannedRawText, setScannedRawText] = useState<string | null>(null);
  const [extractedSlug, setExtractedSlug] = useState<string | null>(null);
  const [scannedStand, setScannedStand] = useState<Stand | null>(null);
  const [isNewStand, setIsNewStand] = useState(false);

  // Management State (Link / Unlink)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedDestType, setSelectedDestType] = useState<DestinationType>('REVIEW');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Manual Input State
  const [manualInput, setManualInput] = useState('');

  // Extract slug from URL or raw text
  const parseQRContent = (text: string): string => {
    const trimmed = text.trim();
    // 1. Check for /r/:slug pattern (supports both regular URLs and hash routes like #/r/:slug)
    const urlMatch = trimmed.match(/\/r\/([a-zA-Z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    // 2. Check query params ?slug=...
    const queryMatch = trimmed.match(/[?&]slug=([a-zA-Z0-9_-]+)/i);
    if (queryMatch && queryMatch[1]) {
      return queryMatch[1];
    }
    // 3. Fallback: treat clean alphanumeric as slug
    return trimmed.replace(/^https?:\/\/[^/]+/i, '').replace(/^[#/r/]+/, '');
  };

  // Process a recognized code
  const handleCodeFound = useCallback((rawText: string) => {
    sounds.playScanSuccess();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {
        // Ignored
      }
    }

    setScannedRawText(rawText);
    const slug = parseQRContent(rawText);
    setExtractedSlug(slug);

    // Look up stand in local props first, fallback to case-insensitive match
    const found = stands.find(
      s => s.slug.toLowerCase() === slug.toLowerCase() ||
           s.standNumber.toString() === slug ||
           `0${s.standNumber}` === slug
    );

    if (found) {
      setScannedStand(found);
      setIsNewStand(false);
      setSelectedBusinessId(found.businessId || '');
      setSelectedDestType(found.destinationType || 'REVIEW');
      setCustomLabel(found.customLabel || '');
    } else {
      setScannedStand(null);
      setIsNewStand(true);
      setSelectedBusinessId(businesses[0]?.id || '');
      setSelectedDestType('REVIEW');
      setCustomLabel(`Table ${slug}`);
    }

    // Pause scanning while viewing stand result
    setIsScanning(false);
  }, [stands, businesses]);

  // Camera Management
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Check for torch/flashlight capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      setHasTorch(Boolean(capabilities?.torch));
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Camera access denied or unavailable.');
      setIsScanning(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setIsTorchOn(false);
  }, []);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Could not toggle flashlight:', err);
      }
    }
  };

  const flipCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Continuous Frame Analysis Loop
  useEffect(() => {
    if (!isOpen || scanMode !== 'camera' || !isScanning) return;

    let animId: number;
    let barcodeDetector: any = null;

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        barcodeDetector = null;
      }
    }

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animId = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // 1. Try Hardware-accelerated native BarcodeDetector if available
      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleCodeFound(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fall through to jsQR canvas fallback
        }
      }

      // 2. Ultra-reliable jsQR fallback via offscreen canvas
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const width = 480;
          const height = Math.round((video.videoHeight / video.videoWidth) * width) || 360;

          if (canvas.width !== width) canvas.width = width;
          if (canvas.height !== height) canvas.height = height;

          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleCodeFound(code.data);
            return;
          }
        }
      }

      animId = requestAnimationFrame(scanFrame);
    };

    animId = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, scanMode, isScanning, handleCodeFound]);

  // Start or Stop Camera when Modal Opens/Closes or Mode Changes
  useEffect(() => {
    if (isOpen && scanMode === 'camera' && !extractedSlug) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode, extractedSlug, startCamera, stopCamera]);

  // Handle Photo / Gallery Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);

        if (code && code.data) {
          handleCodeFound(code.data);
        } else {
          alert('No readable QR code found in this photo. Please try a clearer picture or enter Stand ID manually.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Manual Input Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleCodeFound(manualInput.trim());
  };

  // Reset to scan another QR code
  const handleScanNext = () => {
    sounds.playTap();
    setScannedRawText(null);
    setExtractedSlug(null);
    setScannedStand(null);
    setIsNewStand(false);
    setActionSuccessMsg(null);
    setIsScanning(true);
    if (scanMode === 'camera') {
      startCamera();
    }
  };

  // ACTION: Unlink Stand from currently assigned Business
  const handleUnlinkStand = async () => {
    if (!scannedStand) return;
    setIsProcessingAction(true);
    sounds.playTap();

    try {
      const updated: Stand = {
        ...scannedStand,
        businessId: null,
        businessName: undefined,
        updatedAt: new Date().toISOString(),
      };

      await api.saveStand(updated);
      setScannedStand(updated);
      setSelectedBusinessId('');
      setActionSuccessMsg(`Stand #${updated.slug} successfully unlinked!`);
      onRefreshStands();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Error unlinking stand: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ACTION: Link Stand to Selected Business & Destination
  const handleLinkStand = async () => {
    if (!selectedBusinessId && !isNewStand) {
      alert('Please select a business to link this stand to.');
      return;
    }

    setIsProcessingAction(true);
    sounds.playTap();

    try {
      const targetBiz = businesses.find(b => b.id === selectedBusinessId);

      if (scannedStand) {
        // Update existing stand
        const updated: Stand = {
          ...scannedStand,
          businessId: selectedBusinessId || null,
          businessName: targetBiz?.name,
          destinationType: selectedDestType,
          customLabel: customLabel.trim() || scannedStand.customLabel,
          isActive: true, // Auto-activate when newly linked
          updatedAt: new Date().toISOString(),
        };

        await api.saveStand(updated);
        setScannedStand(updated);
        setActionSuccessMsg(`Stand #${updated.slug} successfully linked to ${targetBiz?.name || 'Selected Place'}!`);
      } else if (isNewStand && extractedSlug) {
        // Create new stand on the fly!
        const parsedNum = parseInt(extractedSlug.replace(/\D/g, '')) || stands.length + 1;
        const newStand: Stand = {
          id: `stand_${Date.now()}`,
          slug: extractedSlug,
          standNumber: parsedNum,
          customLabel: customLabel.trim() || `Stand ${extractedSlug}`,
          businessId: selectedBusinessId || null,
          businessName: targetBiz?.name,
          destinationType: selectedDestType,
          isActive: true,
          isArchived: false,
          nfcProgrammedStatus: 'PENDING',
          visitCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await api.saveStand(newStand);
        setScannedStand(newStand);
        setIsNewStand(false);
        setActionSuccessMsg(`New Stand #${extractedSlug} registered and linked to ${targetBiz?.name || 'Inventory'}!`);
      }

      onRefreshStands();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Error linking stand: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ACTION: Quick Toggle Stand Active / Inactive
  const handleToggleActive = async () => {
    if (!scannedStand) return;
    setIsProcessingAction(true);
    sounds.playTap();

    try {
      const updated: Stand = {
        ...scannedStand,
        isActive: !scannedStand.isActive,
        updatedAt: new Date().toISOString(),
      };

      await api.saveStand(updated);
      setScannedStand(updated);
      setActionSuccessMsg(`Stand #${updated.slug} is now ${updated.isActive ? 'Active' : 'Temporarily Paused'}`);
      onRefreshStands();
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-md p-0 sm:p-4 animate-[fadeIn_0.25s_ease-out]">
      {/* Hidden processing canvas for jsQR analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Milky Dialog Drawer */}
      <div className="w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col bg-[#FDFBF7] border border-[#E8E2D5] rounded-t-[2.2rem] sm:rounded-[2.2rem] shadow-[0_25px_60px_-15px_rgba(70,55,40,0.25)] transition-all">
        
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-[#EFEAE1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#E8C872] p-[1.5px] shadow-sm">
              <div className="w-full h-full bg-[#FAF8F5] rounded-[14px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#B3801A]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  QR Scanner & Smart Manager
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#B3801A] font-bold text-[10px] uppercase tracking-wider border border-amber-200">
                  Instant Link
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Scan stand QR code to link, unlink or inspect in 1-click
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Camera vs Photo Upload vs Manual) */}
        {!extractedSlug && (
          <div className="flex items-center gap-1 px-6 pt-3 pb-1 border-b border-[#F0EBE1] bg-[#FAF8F5]/80">
            <button
              onClick={() => {
                setScanMode('camera');
                setCameraError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                scanMode === 'camera'
                  ? 'bg-white text-stone-900 shadow-sm border border-[#E4DCD0]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Live Camera</span>
            </button>
            <button
              onClick={() => {
                setScanMode('upload');
                stopCamera();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                scanMode === 'upload'
                  ? 'bg-white text-stone-900 shadow-sm border border-[#E4DCD0]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-[#059669]" />
              <span>Upload Photo</span>
            </button>
            <button
              onClick={() => {
                setScanMode('manual');
                stopCamera();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                scanMode === 'manual'
                  ? 'bg-white text-stone-900 shadow-sm border border-[#E4DCD0]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span>Type ID / URL</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Success Banner Notice */}
          {actionSuccessMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm animate-[fadeIn_0.2s_ease-out]">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="flex-1">{actionSuccessMsg}</span>
            </div>
          )}

          {/* VIEW A: Active Camera Viewfinder */}
          {!extractedSlug && scanMode === 'camera' && (
            <div className="space-y-4">
              <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden bg-black shadow-inner flex items-center justify-center border-2 border-[#E8E2D5]">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Camera Overlay Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  {/* Outer darkened vignette */}
                  <div className="absolute inset-0 bg-stone-950/25 backdrop-blur-[1px]" />

                  {/* Target Aiming Box */}
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-dashed border-white/60 rounded-3xl flex items-center justify-center z-10 shadow-[0_0_0_9999px_rgba(10,8,6,0.4)]">
                    {/* Glowing corners */}
                    <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

                    {/* Animated sweeping laser line */}
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#F59E0B] animate-[scan-laser_2s_easeInOut_infinite]" />

                    <div className="text-center px-4">
                      <span className="text-[11px] font-semibold text-white/90 drop-shadow-md bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md">
                        Align Stand QR Code Here
                      </span>
                    </div>
                  </div>
                </div>

                {/* In-viewfinder Flashlight & Camera Flip Controls */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-20">
                  {hasTorch && (
                    <button
                      onClick={toggleTorch}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all flex items-center gap-1.5 ${
                        isTorchOn
                          ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-lg'
                          : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isTorchOn ? 'Torch On' : 'Torch Off'}</span>
                    </button>
                  )}

                  <button
                    onClick={flipCamera}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-black/60 text-white border border-white/20 hover:bg-black/80 backdrop-blur-md transition-all flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Flip Camera</span>
                  </button>
                </div>
              </div>

              {cameraError && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block mb-0.5">Camera Permission Notice</strong>
                    <span>{cameraError}</span>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={startCamera}
                        className="px-3 py-1 rounded-lg bg-amber-600 text-white font-medium text-[11px] shadow-sm hover:bg-amber-700"
                      >
                        Retry Camera
                      </button>
                      <button
                        onClick={() => setScanMode('upload')}
                        className="px-3 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-medium text-[11px]"
                      >
                        Switch to Photo Upload
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW B: Photo Upload */}
          {!extractedSlug && scanMode === 'upload' && (
            <div className="p-8 border-2 border-dashed border-[#DCD3C5] rounded-3xl bg-white/70 text-center space-y-4 hover:border-[#C59B27] transition-colors">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800">
                  Select a Photo or Snap with Mobile Camera
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Upload any photo or screenshot of a table stand QR code
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-bold text-xs shadow-md hover:brightness-105 active:scale-95 cursor-pointer transition-all">
                <Camera className="w-4 h-4" />
                <span>Choose Image / Snap Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}

          {/* VIEW C: Manual Slug / URL Entry */}
          {!extractedSlug && scanMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="p-5 rounded-3xl bg-white/80 border border-[#E8E2D5] shadow-sm space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Enter Stand ID, Number, or Redirect URL
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. 01, 15, or https://tapreview.in/r/05"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DCD3C5] rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Lookup Stand</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* VIEW D: STAND FOUND & INSTANT MANAGEMENT VIEW */}
          {extractedSlug && (
            <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
              {/* Stand Header Card */}
              <div className="p-5 rounded-3xl bg-white/90 border border-[#E8E2D5] shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-stone-900 text-amber-300 font-mono font-bold text-sm shadow-sm">
                        #{extractedSlug}
                      </span>
                      {scannedStand?.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : scannedStand ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-300 text-stone-600 text-[11px] font-bold">
                          Paused / Inactive
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-bold">
                          Unregistered QR
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-stone-900">
                      {scannedStand?.customLabel || (isNewStand ? `New Stand #${extractedSlug}` : `Stand #${extractedSlug}`)}
                    </h3>
                  </div>

                  <button
                    onClick={handleScanNext}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DCD3C5] text-stone-700 hover:text-stone-900 hover:border-stone-400 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#B3801A]" />
                    <span>Scan Next</span>
                  </button>
                </div>

                {/* Permanent Redirect URL */}
                <div className="p-2.5 rounded-xl bg-[#F7F4EC] border border-[#E8E1D5] flex items-center justify-between text-xs font-mono text-stone-600">
                  <span className="truncate">https://{domain}/r/{extractedSlug}</span>
                  {scannedStand && (
                    <button
                      onClick={() => onOpenCustomerView && onOpenCustomerView(scannedStand)}
                      className="text-[#B3801A] hover:underline font-bold flex items-center gap-1 shrink-0 ml-2"
                      title="Preview Customer Destination"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test</span>
                    </button>
                  )}
                </div>

                {/* Current Assignment Status Pill */}
                <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-400">Assigned To:</span>
                    {scannedStand?.businessName ? (
                      <strong className="text-stone-900 font-semibold px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">
                        {scannedStand.businessName}
                      </strong>
                    ) : (
                      <span className="text-amber-700 font-semibold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                        None (Unassigned Inventory)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-400">Destination:</span>
                    <span className="font-semibold text-stone-800">
                      {scannedStand?.destinationType === 'REVIEW' && 'Google Review'}
                      {scannedStand?.destinationType === 'MENU_HOSTED' && 'Hosted Menu'}
                      {scannedStand?.destinationType === 'MENU_EXTERNAL' && 'External Menu'}
                      {scannedStand?.destinationType === 'CUSTOM_URL' && 'Custom URL'}
                      {!scannedStand?.destinationType && 'Not Set'}
                    </span>
                  </div>

                  {scannedStand && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400">Total Scans:</span>
                      <strong className="text-emerald-700 font-mono font-bold">
                        {scannedStand.visitCount || 0}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION SECTION 1: LINK OR CHANGE BUSINESS ASSIGNMENT */}
              <div className="p-5 rounded-3xl bg-white/90 border border-[#E8E2D5] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B3801A]">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">
                      {scannedStand?.businessId ? 'Re-link / Change Destination' : 'Link Stand to a Place'}
                    </h4>
                  </div>
                  {scannedStand?.businessId && (
                    <button
                      onClick={handleUnlinkStand}
                      disabled={isProcessingAction}
                      className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Unlink Stand</span>
                    </button>
                  )}
                </div>

                {/* Form fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Select Target Business / Client
                    </label>
                    <select
                      value={selectedBusinessId}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#DCD3C5] rounded-xl text-stone-900 font-medium focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15"
                    >
                      <option value="">-- Choose Business to Link --</option>
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-700 font-bold mb-1">
                        Destination Type
                      </label>
                      <select
                        value={selectedDestType}
                        onChange={(e) => setSelectedDestType(e.target.value as DestinationType)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD3C5] rounded-xl text-stone-900 font-medium focus:outline-none focus:border-[#C59B27]"
                      >
                        <option value="REVIEW">Google Review Safe Page</option>
                        <option value="MENU_HOSTED">Hosted Digital Menu</option>
                        <option value="MENU_EXTERNAL">External Menu Link</option>
                        <option value="CUSTOM_URL">Custom URL Override</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold mb-1">
                        Custom Stand Label
                      </label>
                      <input
                        type="text"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder="e.g. Table 05 (Garden)"
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD3C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleLinkStand}
                    disabled={isProcessingAction || (!selectedBusinessId && !scannedStand?.businessId)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E0B94A] to-[#C59B27] text-stone-950 font-extrabold text-sm shadow-md hover:brightness-105 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessingAction ? (
                      <MilkySpinner size="sm" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isNewStand
                            ? `Register & Link Stand #${extractedSlug}`
                            : scannedStand?.businessId
                            ? 'Update Link & Destination'
                            : `Link Stand #${extractedSlug} to Business`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ACTION SECTION 2: STAND TOGGLES & DETAILS */}
              {scannedStand && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleActive}
                    disabled={isProcessingAction}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                      scannedStand.isActive
                        ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{scannedStand.isActive ? 'Pause Stand' : 'Activate Stand'}</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playTap();
                      onEditStand && onEditStand(scannedStand);
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl bg-white border border-[#DCD3C5] hover:border-stone-400 text-stone-800 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                  >
                    <Layers className="w-4 h-4 text-stone-600" />
                    <span>Full Stand Config</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#EFEAE1] bg-[#FAF8F5] flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Direct QR Stand Pairing Engine</span>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-stone-200/60 hover:bg-stone-300/70 text-stone-800 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
