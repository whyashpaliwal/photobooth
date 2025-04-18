import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import Layout from './components/Layout/Layout';
import Camera from './components/Camera/Camera';
import FilmStrip from './components/FilmStrip/FilmStrip';
import Controls from './components/Controls/Controls';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4a90e2'
    }
  }
});

const TOTAL_PHOTOS = 3;

function App() {
  const [photos, setPhotos] = useState([]);
  const [currentView, setCurrentView] = useState('camera');
  const [countdown, setCountdown] = useState(0);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isTimerOn, setIsTimerOn] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return 0;
          }
          if ('vibrate' in navigator) {
            navigator.vibrate(50); // Vibrate for each countdown number
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleTimerChange = useCallback((seconds) => {
    setIsTimerOn(seconds > 0);
    setCountdown(seconds);
  }, []);

  const handleFlashChange = useCallback((isOn) => {
    setIsFlashOn(isOn);
  }, []);

  const handleCapture = useCallback((imageData, filter) => {
    const newPhoto = {
      id: Date.now(),
      dataUrl: imageData,
      filter: filter
    };
    setPhotos(prev => {
      const newPhotos = [...prev, newPhoto];
      if (newPhotos.length >= TOTAL_PHOTOS) {
        setCurrentView('strip');
      }
      return newPhotos;
    });
  }, []);

  const handleExport = () => {
    const strip = document.getElementById('film-strip');
    if (!strip) return;

    import('html2canvas').then(html2canvas => {
      html2canvas.default(strip).then(canvas => {
        const link = document.createElement('a');
        link.download = 'photo-strip.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.8);
        link.click();
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]); // Double vibration for save
        }
      });
    });
  };

  const handleNewStrip = useCallback(() => {
    setPhotos([]);
    setCurrentView('camera');
  }, []);

  const getCurrentComponent = () => {
    switch (currentView) {
      case 'camera':
        return (
          <>
            <Camera
              onCapture={handleCapture}
              disabled={photos.length >= TOTAL_PHOTOS}
              countdown={countdown}
              isFlashOn={isFlashOn}
              isTimerOn={isTimerOn}
            />
            <Controls
              onTimerChange={handleTimerChange}
              onFlashChange={handleFlashChange}
            />
          </>
        );
      case 'strip':
        return (
          <FilmStrip
            photos={photos}
            onExport={handleExport}
            onNewStrip={handleNewStrip}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Layout
        currentStep={photos.length}
        totalSteps={TOTAL_PHOTOS}
        onNavigate={setCurrentView}
        currentView={currentView}
      >
        {getCurrentComponent()}
      </Layout>
    </ThemeProvider>
  );
}

export default App;
