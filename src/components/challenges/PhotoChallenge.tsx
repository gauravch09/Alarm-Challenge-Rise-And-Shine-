"use client"

import { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { toast } from '@/hooks/use-toast';

export function PhotoChallenge({ targetId, onComplete }: { targetId: string, onComplete: () => void }) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isDataUri = targetId.startsWith('data:image');
  const targetImage = !isDataUri ? PlaceHolderImages.find(img => img.id === targetId) : null;
  const targetLabel = isDataUri ? "Target Reference Image" : (targetImage ? targetImage.description : targetId);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    stopCamera(); 
    
    try {
      // Prioritize the back camera (environment) for location verification
      const constraints = { 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Back camera failed, falling back to any available camera', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Video play failed", e);
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Error',
        description: 'Could not access camera. Please ensure permissions are granted in browser settings.',
      });
    }
  };

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => stopCamera();
  }, [capturedImage]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      
      stopCamera();

      // Simulated "Vision AI" processing
      setTimeout(() => {
        setCapturedImage(imageData);
        setIsCapturing(false);
        setTimeout(onComplete, 2000);
      }, 1500);
    }
  };

  const retryCamera = () => {
    setHasCameraPermission(null);
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-2 w-full">
        <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto relative group">
          <Camera className="w-10 h-10 text-primary transition-transform group-hover:rotate-12" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">Location Match</h2>
        <div className="bg-muted/30 p-4 rounded-2xl border border-dashed border-primary/20 space-y-3">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <Eye className="w-3 h-3" /> Visual Requirement
          </p>
          {isDataUri ? (
            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary/20 shadow-inner bg-black/5">
               <img src={targetId} alt="Target" className="w-full h-full object-cover opacity-80" />
            </div>
          ) : (
            <p className="text-lg font-black uppercase not-italic text-primary leading-tight">{targetLabel}</p>
          )}
        </div>
      </div>

      <div className="w-full space-y-4">
        {hasCameraPermission === false && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Camera Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              Verification requires camera access.
              <Button variant="outline" size="sm" onClick={retryCamera} className="w-fit border-destructive/20 text-destructive">
                <RefreshCw className="w-3 h-3 mr-2" /> Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-black aspect-video rounded-[2.5rem] overflow-hidden relative border-4 border-card shadow-2xl">
          <video 
            ref={videoRef} 
            className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`} 
            autoPlay 
            playsInline 
            muted 
          />
          <canvas ref={canvasRef} className="hidden" />

          {capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-accent/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <CheckCircle2 className="w-16 h-16 mb-2" />
                <p className="text-2xl font-black uppercase">Goal Matched</p>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 text-white gap-4 backdrop-blur-sm">
              <RefreshCw className="w-10 h-10 animate-spin text-primary" />
              <p className="font-black uppercase tracking-widest text-xs">Analyzing Scene...</p>
            </div>
          )}
        </div>
      </div>

      <Button 
        onClick={handleCapture} 
        disabled={hasCameraPermission === false || isCapturing || !!capturedImage}
        className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 group"
      >
        <Camera className="w-6 h-6 mr-3 transition-transform group-hover:rotate-12" />
        {capturedImage ? "SUCCESS" : "VERIFY LOCATION"}
      </Button>
    </div>
  );
}
