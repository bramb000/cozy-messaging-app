import React from 'react';
import emojiMap from '@/utils/emojiMap.json';
import styles from './PixelEmojiPicker.module.css';

interface PixelEmojiPickerProps {
  onEmojiSelect: (emojiStr: string) => void;
}

export default function PixelEmojiPicker({ onEmojiSelect }: PixelEmojiPickerProps) {
  return (
    <div className={styles.picker}>
      <span className={styles.header}>Emojis</span>
      <div className={styles.grid}>
        {Object.entries(emojiMap).map(([unicode, src]) => (
          <button
            key={unicode}
            className={styles.emojiBtn}
            onClick={() => onEmojiSelect(unicode)}
            title={unicode}
            type="button"
          >
            <img src={src} alt={unicode} className={styles.emojiImg} />
          </button>
        ))}
      </div>
    </div>
  );
}
