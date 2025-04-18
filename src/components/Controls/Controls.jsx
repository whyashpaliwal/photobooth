import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { FlashOn, FlashOff, Timer, TimerOff } from '@mui/icons-material';
import { useSpring, animated } from 'react-spring';
import styles from './Controls.module.css';

const ControlButton = ({ isActive, onClick, activeIcon, inactiveIcon, label }) => {
  const spring = useSpring({
    scale: isActive ? 1.1 : 1,
    config: { tension: 300, friction: 10 }
  });

  return (
    <animated.div style={spring}>
      <IconButton 
        onClick={onClick}
        className={`${styles.controlButton} ${isActive ? styles.active : ''}`}
        aria-label={label}
      >
        {isActive ? activeIcon : inactiveIcon}
      </IconButton>
      <div className={styles.controlLabel}>{label}</div>
    </animated.div>
  );
};

const Controls = ({ onTimerChange, onFlashChange }) => {
  const [isTimerOn, setIsTimerOn] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

  const handleTimerToggle = () => {
    const newTimerState = !isTimerOn;
    setIsTimerOn(newTimerState);
    onTimerChange(newTimerState ? 3 : 0);
    
    // Vibrate on toggle
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleFlashToggle = () => {
    const newFlashState = !isFlashOn;
    setIsFlashOn(newFlashState);
    onFlashChange(newFlashState);
    
    // Vibrate on toggle
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <Box className={styles.controlsContainer}>
      <ControlButton 
        isActive={isTimerOn}
        onClick={handleTimerToggle}
        activeIcon={<Timer />}
        inactiveIcon={<TimerOff />}
        label="Timer"
      />
      <ControlButton 
        isActive={isFlashOn}
        onClick={handleFlashToggle}
        activeIcon={<FlashOn />}
        inactiveIcon={<FlashOff />}
        label="Flash"
      />
    </Box>
  );
};

export default Controls;