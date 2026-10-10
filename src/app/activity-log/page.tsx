'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './activity-log.module.css';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, ActivityLogIcon, CoursesIcon, BugReportsIcon } from '@/components/SVGIcons';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';

function getPaginationRange(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export interface ActivityItem {
  id: string;
  category: 'Session' | 'Bug Report' | 'Auth' | 'Goal' | 'Course';
  action: string;
  details: string;
  userName: string;
  userId?: string;
  userPic?: string;
  timestamp: Timestamp | null;
  status?: string;
}

function formatRelativeTime(ts: Timestamp | null): string {
  if (!ts) return 'Recent';
  const now = Date.now();
  const millis = ts.toMillis();
  const diffSec = Math.max(0, Math.floor((now - millis) / 1000));

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return ts.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatExactDateTime(ts: Timestamp | null): string {
  if (!ts) return '';
  return ts.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  // Real-time listener aggregating activities from Firestore
  useEffect(() => {
    setLoading(true);

    // 1. Listen to explicit activity_logs if present
    const unsubActivityLogs = onSnapshot(collection(db, 'activity_logs'), (actSnap) => {
      const explicitActs: ActivityItem[] = actSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          category: (data.category as ActivityItem['category']) || 'Session',
          action: data.action || 'Activity',
          details: data.details || '',
          userName: data.userName || 'User',
          userId: data.userId || '',
          userPic: data.userPic || '',
          timestamp: data.timestamp || null,
          status: data.status || 'Completed',
        };
      });

      // 2. Also listen to sessions for rich real-time interview logs
      const unsubSessions = onSnapshot(collection(db, 'sessions'), (sessSnap) => {
        const sessionActs: ActivityItem[] = sessSnap.docs.map((d) => {
          const data = d.data();
          const role = data.targetRole || data.category || 'Job Interview';
          const score = data.overallScore ?? data.averageScore;
          const scoreText = score !== undefined ? ` (Score: ${Math.round(score)}%)` : '';
          const interviewer = data.interviewerName ? ` with ${data.interviewerName}` : '';

          return {
            id: `session_${d.id}`,
            category: 'Session',
            action: 'Interview Session Completed',
            details: `Simulated practice session for ${role}${interviewer}${scoreText}`,
            userName: data.userName || data.fullname || 'Student',
            userId: data.userId || data.idnumber || '',
            userPic: data.userPic || data.pic || '',
            timestamp: data.createdAt || data.timestamp || null,
            status: 'Completed',
          };
        });

        // 3. Listen to bug reports
        const unsubBugs = onSnapshot(collection(db, 'bug_reports'), (bugSnap) => {
          const bugActs: ActivityItem[] = bugSnap.docs.map((d) => {
            const data = d.data();
            const isResolved = data.status === 'Resolved';
            return {
              id: `bug_${d.id}`,
              category: 'Bug Report',
              action: isResolved ? 'Bug Report Resolved' : 'Bug Report Submitted',
              details: `"${data.title || 'Untitled'}" — ${data.reportedOn || 'Mobile'} platform`,
              userName: data.reporterName || 'Reporter',
              userId: data.reporterIdnumber || '',
              userPic: data.reporterPic || '',
              timestamp: data.createdAt || null,
              status: isResolved ? 'Resolved' : 'In Process',
            };
          });

          // 4. Listen to user sign-ins / registrations
          const unsubUsers = onSnapshot(collection(db, 'users'), (userSnap) => {
            const userActs: ActivityItem[] = userSnap.docs.map((d) => {
              const data = d.data();
              return {
                id: `user_${d.id}`,
                category: 'Auth',
                action: 'User Profile Updated / Active',
                details: `Level: ${data.level || 'Junior'} • ${data.email || 'Email registered'}`,
                userName: data.fullname || 'Student',
                userId: data.idnumber || d.id,
                userPic: data.pic || '',
                timestamp: data.lastLogin || data.createdAt || null,
                status: 'Active',
              };
            });

            // Combine and deduplicate
            const combined = [...explicitActs, ...sessionActs, ...bugActs, ...userActs];
            setActivities(combined);
            setLoading(false);
          }, (err) => {
            console.error('User listener error:', err);
            setLoading(false);
          });

          return () => unsubUsers();
        }, (err) => {
          console.error('Bug reports listener error:', err);
        });

        return () => unsubBugs();
      }, (err) => {
        console.error('Sessions listener error:', err);
      });

      return () => unsubSessions();
    }, (err) => {
      console.error('Activity logs listener error:', err);
      setLoading(false);
    });

    return () => unsubActivityLogs();
  }, []);

  // Filter & sort
  const filteredActivities = useMemo(() => {
    let result = [...activities];

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.action.toLowerCase().includes(q) ||
          a.details.toLowerCase().includes(q) ||
          a.userName.toLowerCase().includes(q) ||
          (a.userId && a.userId.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() ?? 0;
      const timeB = b.timestamp?.toMillis() ?? 0;
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [activities, selectedCategory, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / ITEMS_PER_PAGE));
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredActivities.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActivities, currentPage]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const sessionCount = activities.filter((a) => a.category === 'Session').length;
  const bugCount = activities.filter((a) => a.category === 'Bug Report').length;

  const getCategoryBadgeClass = (cat: ActivityItem['category']) => {
    switch (cat) {
      case 'Session':
        return styles.badgeSession;
      case 'Bug Report':
        return styles.badgeBug;
      case 'Auth':
        return styles.badgeAuth;
      case 'Goal':
        return styles.badgeGoal;
      case 'Course':
        return styles.badgeCourse;
      default:
        return styles.badgeSession;
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Activity log</h1>
          <div className={styles.adminProfile}>Admin</div>
        </header>

        {/* 3 Metrics Cards */}
        <section className={styles.statsGrid}>
          <StatCard
            title="Total Activities"
            value={loading ? '—' : String(activities.length)}
            trendValue="Live Feed"
            trendLabel="active audit events"
            icon={<ActivityLogIcon size={20} />}
            isPositive={true}
          />
          <StatCard
            title="Interview Sessions"
            value={loading ? '—' : String(sessionCount)}
            trendValue="Simulated Practices"
            trendLabel="completed sessions"
            icon={<CoursesIcon size={20} />}
            isPositive={true}
          />
          <StatCard
            title="Bug & Issue Events"
            value={loading ? '—' : String(bugCount)}
            trendValue="Tickets Handled"
            trendLabel="reported issues"
            icon={<BugReportsIcon size={20} />}
            isPositive={true}
          />
        </section>

        {/* Main Activity Table Widget */}
        <section className={styles.widgetCard}>
          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            {/* Category Filter Tabs */}
            <div className={styles.tabList}>
              {['All', 'Session', 'Bug Report', 'Auth'].map((cat) => (
                <button
                  key={cat}
                  className={`${styles.tabButton} ${selectedCategory === cat ? styles.activeTabButton : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat === 'All' ? 'All Activities' : cat === 'Session' ? 'Sessions' : cat === 'Bug Report' ? 'Bug Reports' : 'User Auth'}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className={styles.actionsRight}>
              <div className={styles.searchContainer}>
                <span className={styles.searchIcon}>
                  <SearchIcon size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search user, action..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Table Feed */}
          <div className={styles.tableWrapper}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>User</th>
                  <th style={{ width: '14%' }}>Category</th>
                  <th style={{ width: '46%' }}>Action & Details</th>
                  <th style={{ width: '18%' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                      Loading activity records...
                    </td>
                  </tr>
                ) : paginatedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className={styles.emptyState}>
                        <div className={styles.emptyTitle}>No activity records found</div>
                        <p>There are no activities matching your current filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedActivities.map((act) => (
                    <tr key={act.id} className={styles.activityRow}>
                      {/* User Cell */}
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>
                            {act.userPic ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={act.userPic} alt={act.userName} className={styles.avatarImg} />
                            ) : (
                              act.userName.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <div className={styles.userName}>{act.userName}</div>
                            {act.userId && <div className={styles.userIdNumber}>ID: {act.userId}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span className={`${styles.badge} ${getCategoryBadgeClass(act.category)}`}>
                          {act.category}
                        </span>
                      </td>

                      {/* Action & Description */}
                      <td>
                        <div className={styles.actionCell}>
                          <span className={styles.actionTitle}>{act.action}</span>
                          <span className={styles.actionDetail}>{act.details}</span>
                        </div>
                      </td>

                      {/* Time */}
                      <td>
                        <div className={styles.timeCell}>
                          <div className={styles.timeRelative}>{formatRelativeTime(act.timestamp)}</div>
                          <div className={styles.timeExact}>{formatExactDateTime(act.timestamp)}</div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Sliding Window Pagination */}
          {!loading && filteredActivities.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Showing{' '}
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredActivities.length)}
                </span>{' '}
                of <span style={{ fontWeight: 600, color: '#0f172a' }}>{filteredActivities.length}</span> activities
              </div>

              {totalPages > 1 && (
                <div className={styles.paginationControls}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon size={14} />
                    <span>Previous</span>
                  </button>

                  {getPaginationRange(currentPage, totalPages).map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                          ...
                        </span>
                      );
                    }
                    const pageNum = Number(p);
                    return (
                      <button
                        key={pageNum}
                        className={`${styles.pageNumber} ${currentPage === pageNum ? styles.activePageNumber : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <span>Next</span>
                    <ChevronRightIcon size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
