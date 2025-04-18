import React, { useState, useCallback, useEffect } from 'react';
import { animated, useTransition, useSpring } from 'react-spring';
import { useSwipeable } from 'react-swipeable';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import styles from './FilmStrip.module.css';

const PhotoFrame = React.memo(({ photo, index, style, onDelete, onDragStart, onDragMove, onDragEnd, isDragging }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => onDelete(index),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const [isNew] = useState(true);
  const springProps = useSpring({
    from: { scale: isNew ? 0.8 : 1, opacity: isNew ? 0 : 1 },
    to: { scale: 1, opacity: 1 },
    config: { tension: 280, friction: 20 }
  });

  return (
    <animated.div 
      {...handlers}
      style={{
        ...style,
        ...springProps,
        transform: `${style.transform || ''} scale(${springProps.scale})`
      }}
      className={`${styles.photoFrame} ${isDragging ? styles.dragging : ''}`}
      onTouchStart={(e) => onDragStart(e, index)}
      onTouchMove={(e) => onDragMove(e, index)}
      onTouchEnd={onDragEnd}
      data-testid={`photo-${index}`}
    >
      <div className={styles.cornerMarks}>
        <span className={styles.corner} />
        <span className={styles.corner} />
        <span className={styles.corner} />
        <span className={styles.corner} />
      </div>
      <img 
        src={photo.dataUrl} 
        alt={`${index + 1}`}
        style={{ filter: photo.filter }}
        className={styles.photo}
      />
      <div className={styles.deleteHint}>
        <DeleteIcon />
        <span>Delete</span>
      </div>
    </animated.div>
  );
});

const Perforations = React.memo(() => {
  return (
    <>
      <div className={styles.perforationLeft}>
        {Array(8).fill(null).map((_, i) => (
          <div key={`left-${i}`} className={styles.perforation} />
        ))}
      </div>
      <div className={styles.perforationRight}>
        {Array(8).fill(null).map((_, i) => (
          <div key={`right-${i}`} className={styles.perforation} />
        ))}
      </div>
    </>
  );
});

const FilmStrip = ({ photos: initialPhotos, onExport, onNewStrip }) => {
  const [photos, setPhotos] = useState(initialPhotos);
  const [draggedItem, setDraggedItem] = useState(null);
  const [swipeIndex, setSwipeIndex] = useState(null);

  const [{ x }, swipeApi] = useSpring(() => ({ x: 0 }));

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const transitions = useTransition(photos, {
    from: { opacity: 0, transform: 'translateY(50px)' },
    enter: item => async (next) => {
      await next({ opacity: 1, transform: 'translateY(0px)', delay: item.id * 200 });
    },
    leave: { opacity: 0, transform: 'translateY(-50px)' },
    config: { tension: 280, friction: 20 }
  });

  const handleDelete = useCallback((index) => {
    setSwipeIndex(index);
    swipeApi.start({
      from: { x: 0 },
      to: { x: -100 },
      onRest: () => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setPhotos(newPhotos);
        setSwipeIndex(null);
        swipeApi.start({ x: 0 });
      }
    });
  }, [photos, swipeApi]);

  const handleDragStart = useCallback((e, index) => {
    const touch = e.touches[0];
    setDraggedItem({ index, startY: touch.clientY, currentY: touch.clientY });
  }, []);

  const handleDragMove = useCallback((e, index) => {
    if (draggedItem && draggedItem.index === index) {
      const touch = e.touches[0];
      const currentY = touch.clientY;
      
      setDraggedItem(prev => ({
        ...prev,
        currentY
      }));

      const moveDistance = currentY - draggedItem.startY;
      const itemHeight = 180;

      if (Math.abs(moveDistance) > itemHeight / 2) {
        const newIndex = draggedItem.index + (moveDistance > 0 ? 1 : -1);
        if (newIndex >= 0 && newIndex < photos.length) {
          const newPhotos = [...photos];
          [newPhotos[draggedItem.index], newPhotos[newIndex]] = 
          [newPhotos[newIndex], newPhotos[draggedItem.index]];
          setPhotos(newPhotos);
          setDraggedItem(prev => ({
            ...prev,
            index: newIndex,
            startY: currentY
          }));
        }
      }
    }
  }, [draggedItem, photos]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleShare = async () => {
    const strip = document.getElementById('film-strip');
    if (!strip) return;

    try {
      const canvas = await import('html2canvas').then(html2canvas => 
        html2canvas.default(strip)
      );
      
      canvas.toBlob(async (blob) => {
        if (blob && 'share' in navigator) {
          const file = new File([blob], 'photo-strip.jpg', { type: 'image/jpeg' });
          try {
            await navigator.share({
              files: [file],
              title: 'Photo Strip',
              text: 'Check out my photo strip!'
            });
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 50, 100]);
            }
          } catch (err) {
            console.error('Error sharing:', err);
            // Fallback to download if share fails
            onExport();
          }
        } else {
          // Fallback to download if sharing not supported
          onExport();
        }
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error('Error creating image:', err);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.stripContainer} id="film-strip">
        <div className={styles.stripBackground} />
        <div className={styles.stripGrain} />
        <Perforations />
        
        {Array(8).fill(null).map((_, i) => (
          <div
            key={`mark-${i}`}
            className={styles.exposureMark}
            style={{ top: `${(i + 1) * 12}%` }}
          />
        ))}
        
        <div className={styles.photosContainer}>
          {transitions((style, photo, _, index) => (
            <PhotoFrame
              key={photo.id}
              photo={photo}
              index={index}
              style={{
                ...style,
                x: swipeIndex === index ? x : 0,
                transform: draggedItem?.index === index 
                  ? `translateY(${draggedItem.currentY - draggedItem.startY}px)` 
                  : style.transform
              }}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              isDragging={draggedItem?.index === index}
            />
          ))}
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button 
          onClick={onExport}
          className={styles.exportButton}
          aria-label="Save photo strip"
        >
          <SaveIcon />
          <span>Save</span>
        </button>
        <button
          onClick={handleShare}
          className={styles.shareButton}
          aria-label="Share photo strip"
        >
          <ShareIcon />
          <span>Share</span>
        </button>
        <button
          onClick={onNewStrip}
          className={styles.newStripButton}
          aria-label="Create new photo strip"
        >
          <AddIcon />
          <span>New Strip</span>
        </button>
      </div>
    </div>
  );
};

export default FilmStrip;