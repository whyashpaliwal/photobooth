import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, FlashOn, Timer } from '@mui/icons-material';
import { useSpring, animated } from 'react-spring';
import { useSwipeable } from 'react-swipeable';
import styles from './Camera.module.css';

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'B&W', value: 'grayscale(1)' },
  { name: 'Sepia', value: 'sepia(0.8)' },
  { name: 'Vintage', value: 'contrast(1.1) brightness(1.1) sepia(0.3)' },
  { name: 'Cool', value: 'saturate(1.2) hue-rotate(20deg)' }
];

const CAPTURE_DEBOUNCE_MS = 1000; // Prevent rapid-fire captures

const Camera = ({ onCapture, disabled, countdown, isFlashOn, isTimerOn }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const lastCaptureTime = useRef(0);

  // Spring animation for filter transition
  const [filterSpring, filterApi] = useSpring(() => ({
    from: { x: 0 },
    config: { tension: 280, friction: 60 }
  }));

  const vibrate = (pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentFilterIndex < FILTERS.length - 1) {
        vibrate(50); // Quick vibration for filter change
        filterApi.start({ from: { x: 0 }, to: { x: -100 }, onRest: () => {
          setCurrentFilterIndex(i => i + 1);
          filterApi.start({ x: 0 });
        }});
        setShowSwipeHint(false);
      }
    },
    onSwipedRight: () => {
      if (currentFilterIndex > 0) {
        vibrate(50);
        filterApi.start({ from: { x: 0 }, to: { x: 100 }, onRest: () => {
          setCurrentFilterIndex(i => i - 1);
          filterApi.start({ x: 0 });
        }});
        setShowSwipeHint(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const debouncedCapture = useCallback(() => {
    const now = Date.now();
    if (now - lastCaptureTime.current < CAPTURE_DEBOUNCE_MS) {
      return;
    }
    lastCaptureTime.current = now;

    setIsFlashing(true);
    setIsCapturing(true);
    setIsProcessing(true);
    vibrate(100);

    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw in two steps for better performance
      context.filter = 'none';
      context.drawImage(video, 0, 0);
      
      if (FILTERS[currentFilterIndex].value !== 'none') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempContext = tempCanvas.getContext('2d');
        tempContext.filter = FILTERS[currentFilterIndex].value;
        tempContext.drawImage(canvas, 0, 0);
        context.drawImage(tempCanvas, 0, 0);
      }

      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(imageData, FILTERS[currentFilterIndex].value);

      setIsFlashing(false);
      setTimeout(() => {
        setIsCapturing(false);
        setIsProcessing(false);
      }, 300);
    });
  }, [currentFilterIndex, onCapture]);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        setIsReady(false);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            aspectRatio: 1,
            width: { ideal: 1080 },
            height: { ideal: 1080 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            setIsReady(true);
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Animated filter name display
  const [{ y }, textApi] = useSpring(() => ({ y: 0 }));
  
  useEffect(() => {
    textApi.start({ from: { y: 20 }, to: { y: 0 } });
  }, [currentFilterIndex, textApi]);

  return (
    <div className={styles.cameraContainer} {...handlers}>
      <animated.div style={{
        ...filterSpring,
        width: '100%',
        height: '100%'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.videoPreview}
          style={{ filter: FILTERS[currentFilterIndex].value }}
        />
      </animated.div>

      <div className={styles.focusGrid}>
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className={styles.focusCell} />
        ))}
      </div>
      <div className={styles.focusCenter} />

      <div className={styles.statusIndicators}>
        {isFlashOn && (
          <div className={styles.statusIndicator}>
            <FlashOn className={styles.statusIcon} />
            <span>Flash</span>
          </div>
        )}
        {isTimerOn && (
          <div className={styles.statusIndicator}>
            <Timer className={styles.statusIcon} />
            <span>3s</span>
          </div>
        )}
      </div>

      {showSwipeHint && (
        <>
          <div className={`${styles.swipeHint} ${styles.swipeLeft}`}>
            <ChevronLeft />
          </div>
          <div className={`${styles.swipeHint} ${styles.swipeRight}`}>
            <ChevronRight />
          </div>
          <animated.div 
            className={styles.swipeText}
            style={{ transform: y.to(v => `translateY(${v}px)`) }}
          >
            Swipe to change filters
          </animated.div>
        </>
      )}

      <animated.div 
        className={styles.filterName}
        style={{ transform: y.to(v => `translateY(${v}px)`) }}
      >
        {FILTERS[currentFilterIndex].name}
      </animated.div>

      {!isReady && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <span>Starting camera...</span>
        </div>
      )}

      {countdown > 0 ? (
        <div className={styles.countdown}>
          {countdown}
        </div>
      ) : (
        <button 
          className={styles.captureButton}
          onClick={debouncedCapture}
          disabled={disabled || !isReady || isProcessing}
        />
      )}

      <div className={`${styles.flashOverlay} ${isFlashing ? styles.active : ''}`} />
      <div className={`${styles.captureAnimation} ${isCapturing ? styles.active : ''}`} />
      
      {isProcessing && (
        <div className={styles.processingOverlay}>
          <div className={styles.processingSpinner} />
          <span>Processing...</span>
        </div>
      )}

      <audio ref={audioRef} src="/sounds/shutter.mp3" preload="auto" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Camera;