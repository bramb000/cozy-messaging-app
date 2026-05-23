import React, { useEffect, useState } from 'react';
import { getPixelatedEmoji } from '@/utils/pixelEmojiRenderer';
import styles from './PixelEmojiPicker.module.css';

interface PixelEmojiPickerProps {
  onEmojiSelect: (emojiStr: string) => void;
}

// A curated list of common emojis to display in our custom picker.
const COMMON_EMOJIS = [
  '😀', '😂', '😊', '😍', '😎', '😭', '😡', '🤔',
  '👍', '👎', '👏', '🙏', '💪', '👋', '🙌', '🤝',
  '❤️', '✨', '🔥', '🎉', '💯', '⭐', '🌟', '💥',
  '🚀', '💀', '🌱', '💬', '🍺', '☕', '🎮', '💡'
];

export default function PixelEmojiPicker({ onEmojiSelect }: PixelEmojiPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.picker}>
      <span className={styles.header}>Emojis (16x16)</span>
      <div className={styles.grid}>
        {mounted && COMMON_EMOJIS.map((unicode) => (
          <button
            key={unicode}
            className={styles.emojiBtn}
            onClick={() => onEmojiSelect(unicode)}
            title={unicode}
            type="button"
          >
            <img src={getPixelatedEmoji(unicode)} alt={unicode} className={styles.emojiImg} />
          </button>
        ))}
      </div>
    </div>
  );
}
