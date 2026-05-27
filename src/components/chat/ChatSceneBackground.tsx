'use client'

import {
  getChatSceneLayers,
  resolveChatBackground,
  type ChatBackgroundId,
} from '@/lib/chatBackgrounds'
import styles from './ChatSceneBackground.module.css'

interface ChatSceneBackgroundProps {
  sceneId: string | null | undefined
}

export function ChatSceneBackground({ sceneId }: ChatSceneBackgroundProps) {
  const id = resolveChatBackground(sceneId)
  const { sky, ground, middle, animateMiddle } = getChatSceneLayers(id)

  return (
    <div className={styles.scene} aria-hidden="true">
      <img className={styles.layer} src={sky} alt="" draggable={false} />
      {middle.map((src, i) => (
        <img
          key={src}
          className={animateMiddle ? styles.layerFloating : styles.layer}
          src={src}
          alt=""
          draggable={false}
          style={
            animateMiddle
              ? {
                  animationDuration: `${14 + (i % 3) * 3}s`,
                  animationDelay: `${i * -2.4}s`,
                }
              : undefined
          }
        />
      ))}
      <img className={styles.layer} src={ground} alt="" draggable={false} />
    </div>
  )
}
