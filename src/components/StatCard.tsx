import React from 'react';
import styles from './StatCard.module.css';
import { UsersIcon } from './SVGIcons';

interface StatCardProps {
  title: string;
  value: string | number;
  trendValue: string;
  trendLabel?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  trendValue,
  trendLabel,
  isPositive = true,
  icon,
}: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.topAccent} />
      <div className={styles.glow} />
      <div className={styles.cardHeader}>
        <span className={styles.title}>{title}</span>
        <div className={styles.iconWrapper}>
          {icon || <UsersIcon size={16} />}
        </div>
      </div>
      <div className={styles.value}>{value}</div>
      <div className={`${styles.trend} ${isPositive ? styles.positive : styles.negative}`}>
        <span>{trendValue}</span>
        {trendLabel && <span className={styles.trendLabel}>{trendLabel}</span>}
      </div>
    </div>
  );
}
