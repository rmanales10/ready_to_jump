import React from 'react';
import styles from './StatCard.module.css';
import { UsersIcon } from './SVGIcons';

interface StatCardProps {
  title: string;
  value: string | number;
  trendValue: string;
  isPositive: boolean;
}

export default function StatCard({ title, value, trendValue, isPositive }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.glow} />
      <div className={styles.cardHeader}>
        <span className={styles.title}>{title}</span>
        <div className={styles.iconWrapper}>
          <UsersIcon size={16} />
        </div>
      </div>
      <div className={styles.value}>{value}</div>
      <div className={`${styles.trend} ${isPositive ? styles.positive : styles.negative}`}>
        {trendValue}
        <span className={styles.trendLabel}>compared to last month</span>
      </div>
    </div>
  );
}
