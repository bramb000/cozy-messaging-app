'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './InventoryNavBar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Chat', href: '/chat', icon: '💬' },
  { label: 'Voice', href: '/voice', icon: '🎙️' },
  { label: 'World', href: '/world', icon: '🗺️' },
  { label: 'Avatar', href: '/avatar', icon: '🎨' },
];

export const InventoryNavBar: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={styles.slotWrapper}>
              <motion.div
                className={`${styles.slot} ${isActive ? styles.active : ''}`}
                whileTap={{ scale: 0.9, y: 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeBorder"
                    className={styles.activeBorder}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
