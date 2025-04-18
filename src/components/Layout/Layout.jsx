import React from 'react';
import { useTransition, animated } from 'react-spring';
import { CameraAlt, Collections } from '@mui/icons-material';
import styles from './Layout.module.css';

const Layout = ({ children, currentStep, totalSteps, currentView, onNavigate }) => {
  const transitions = useTransition(currentView, {
    from: { opacity: 0, transform: 'translate3d(100%,0,0)' },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 0, transform: 'translate3d(-100%,0,0)' },
    config: { tension: 280, friction: 60 }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>{`${currentStep}/${totalSteps} Photos`}</div>
      </header>
      
      <main className={styles.content}>
        {transitions((style, item) => (
          <animated.div className={styles.pageTransition} style={style}>
            {children}
          </animated.div>
        ))}
      </main>

      <div className={styles.grainOverlay} />

      <nav className={styles.bottomNav}>
        <button 
          className={`${styles.navItem} ${currentView === 'camera' ? styles.active : ''}`}
          onClick={() => onNavigate('camera')}
        >
          <CameraAlt className={styles.navIcon} />
          <span>Camera</span>
        </button>
        <button 
          className={`${styles.navItem} ${currentView === 'strip' ? styles.active : ''}`}
          onClick={() => onNavigate('strip')}
        >
          <Collections className={styles.navIcon} />
          <span>Strip</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;