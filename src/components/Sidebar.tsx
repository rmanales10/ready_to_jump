'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { DashboardIcon, BugReportsIcon, LogoutIcon, CoursesIcon } from './SVGIcons';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingBugCount, setPendingBugCount] = useState<number>(0);

  // Real-time listener for bug reports to show red notification badge
  useEffect(() => {
    try {
      const reportsRef = collection(db, 'bug_reports');
      const unsubscribe = onSnapshot(reportsRef, (snapshot) => {
        const inProcessCount = snapshot.docs.filter((doc) => {
          const data = doc.data();
          return (data.status ?? 'In Process') === 'In Process';
        }).length;
        setPendingBugCount(inProcessCount);
      }, (error) => {
        console.error('Error listening to bug reports:', error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to setup bug reports listener:', err);
    }
  }, []);

  const handleLogout = () => {
    // Elegant logout flow redirecting back to home page
    router.push('/');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <img src="/logo.png" alt="Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
        <span className={styles.logoText}>ReadyToJump</span>
      </div>

      <nav className={styles.navLinks}>
        <Link href="/dashboard" passHref style={{ textDecoration: 'none' }}>
          <div className={`${styles.navItem} ${pathname === '/dashboard' ? styles.activeItem : ''}`}>
            <span>Dashboard</span>
            <div className={styles.navIconWrapper}>
              <DashboardIcon size={18} />
            </div>
          </div>
        </Link>

        <Link href="/bug-reports" passHref style={{ textDecoration: 'none' }}>
          <div className={`${styles.navItem} ${pathname === '/bug-reports' ? styles.activeItem : ''}`}>
            <div className={styles.navLabelWrapper}>
              <span>Bug Reports</span>
              {pendingBugCount > 0 && (
                <span className={styles.notificationBadge} title={`${pendingBugCount} pending bug report${pendingBugCount > 1 ? 's' : ''}`}>
                  {pendingBugCount > 99 ? '99+' : pendingBugCount}
                </span>
              )}
            </div>
            <div className={styles.navIconWrapper}>
              <BugReportsIcon size={18} />
            </div>
          </div>
        </Link>

        <Link href="/courses" passHref style={{ textDecoration: 'none' }}>
          <div className={`${styles.navItem} ${pathname === '/courses' ? styles.activeItem : ''}`}>
            <span>Courses & Prompts</span>
            <div className={styles.navIconWrapper}>
              <CoursesIcon size={18} />
            </div>
          </div>
        </Link>
      </nav>

      <div className={styles.logoutSection}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <span>Logout</span>
          <LogoutIcon size={18} />
        </button>
      </div>
    </aside>
  );
}

