'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styles from './dashboard.module.css';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/SVGIcons';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

// Firestore user shape
interface FirestoreUser {
  idnumber: string;
  fullname: string;
  email?: string;
  phone?: string;
  pic?: string;
  lastLogin?: Timestamp;
  level?: string;
}

export default function DashboardPage() {
  // State variables
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'email' | 'date'>('date');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 7;

  // Fetch users from Firestore on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const fetched: FirestoreUser[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            idnumber: data.idnumber ?? doc.id,
            fullname: data.fullname ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            pic: data.pic ?? '',
            lastLogin: data.lastLogin ?? null,
            level: data.level ?? 'Junior',
          };
        });
        setUsers(fetched);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Format Firestore Timestamp to readable date
  const formatDate = (timestamp?: Timestamp | null): string => {
    if (!timestamp) return '—';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format Firestore Timestamp to readable date+time
  const formatDateTime = (timestamp?: Timestamp | null): string => {
    if (!timestamp) return '—';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sort and filter logic
  const processedUsers = useMemo(() => {
    let result = [...users];

    // 1. Text Search Filter (on ID, name, or email)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.idnumber.toLowerCase().includes(q) ||
          user.fullname.toLowerCase().includes(q) ||
          (user.email ?? '').toLowerCase().includes(q)
      );
    }

    // 2. Dynamic Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.fullname.localeCompare(b.fullname);
      }
      if (sortBy === 'email') {
        return (a.email ?? '').localeCompare(b.email ?? '');
      }
      if (sortBy === 'date') {
        const dateA = a.lastLogin?.toMillis() ?? 0;
        const dateB = b.lastLogin?.toMillis() ?? 0;
        return dateB - dateA; // Newest first
      }
      return a.idnumber.localeCompare(b.idnumber);
    });

    return result;
  }, [users, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedUsers.length / ITEMS_PER_PAGE) || 1;
  const validatedPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const startIndex = (validatedPage - 1) * ITEMS_PER_PAGE;
    return processedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedUsers, validatedPage]);

  // Stats derived from real data
  const totalUsersCount = users.length;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newUsersCount = users.filter((u) => {
    if (!u.lastLogin) return false;
    return u.lastLogin.toDate() >= thirtyDaysAgo;
  }).length;

  const activeUsersCount = users.filter((u) => {
    if (!u.lastLogin) return false;
    return u.lastLogin.toDate() >= sevenDaysAgo;
  }).length;

  return (
    <div className={styles.layout}>
      {/* Dynamic Sidebar panel */}
      <Sidebar />

      {/* Main user management dashboard content */}
      <main className={styles.mainContent}>
        
        {/* Top administration navbar headers */}
        <header className={styles.header}>
          <h1 className={styles.title}>User management</h1>
          <div className={styles.adminProfile}>Admin</div>
        </header>

        {/* Three metric counters — now computed from real data */}
        <section className={styles.statsGrid}>
          <StatCard
            title="Active users"
            value={loading ? '—' : String(activeUsersCount)}
            trendValue="last 7 days"
            isPositive={true}
          />
          <StatCard
            title="New Users"
            value={loading ? '—' : String(newUsersCount)}
            trendValue="last 30 days"
            isPositive={true}
          />
          <StatCard
            title="Total Users"
            value={loading ? '—' : String(totalUsersCount)}
            trendValue={`${totalUsersCount} registered`}
            isPositive={true}
          />
        </section>

        {/* Interactive user grid widget panel */}
        <section className={styles.widgetCard}>
          
          {/* Controls filtering sub-header */}
          <div className={styles.controlsBar}>
            <div className={styles.searchContainer}>
              <SearchIcon className={styles.searchIcon} size={16} />
              <input
                type="text"
                placeholder="Search by name, ID, or email"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className={styles.filtersContainer}>
              {/* Sorting options selector */}
              <div className={styles.filterButton} style={{ padding: 0, overflow: 'hidden' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'id' | 'name' | 'email' | 'date')}
                  className={styles.filterSelect}
                  style={{ border: 'none', background: 'transparent', height: '100%', width: '100%', padding: '8px 16px', outline: 'none' }}
                >
                  <option value="id">Sort by ID</option>
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                  <option value="date">Sort by Last Login</option>
                </select>
              </div>
            </div>
          </div>

          {/* User management list data table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Student</th>
                  <th className={styles.th}>Student ID</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Phone</th>
                  <th className={styles.th}>Level</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                      <div className={styles.loadingSpinner} />
                      Loading users from Firestore...
                    </td>
                  </tr>
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.idnumber} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>
                            {user.pic ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={user.pic}
                                alt={user.fullname}
                                className={styles.avatarImg}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.classList.add(styles.avatarFallback);
                                  (e.target as HTMLImageElement).parentElement!.textContent = user.fullname.charAt(0) || '?';
                                }}
                              />
                            ) : (
                              <span>{user.fullname.charAt(0) || '?'}</span>
                            )}
                          </div>
                          <span className={styles.userName}>{user.fullname || '—'}</span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.idBadge}>{user.idnumber}</span>
                      </td>
                      <td className={styles.td} style={{ color: user.email ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {user.email || '—'}
                      </td>
                      <td className={styles.td} style={{ color: user.phone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {user.phone || '—'}
                      </td>
                      <td className={styles.td}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                          backgroundColor:
                            user.level === 'Senior' || user.level === 'Expert' || user.level === 'Advanced'
                              ? 'rgba(158, 186, 243, 0.15)'
                              : user.level === 'Mid' || user.level === 'Intermediate'
                              ? 'rgba(255, 171, 0, 0.15)'
                              : 'rgba(76, 175, 80, 0.15)',
                          color:
                            user.level === 'Senior' || user.level === 'Expert' || user.level === 'Advanced'
                              ? '#4c4ddc'
                              : user.level === 'Mid' || user.level === 'Intermediate'
                              ? '#E65100'
                              : '#2E7D32',
                          textTransform: 'uppercase',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        }}>
                          {user.level || 'Junior'}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {formatDateTime(user.lastLogin)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No matching users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table list pagination controls */}
          <div className={styles.paginationBar}>
            <button
              className={`${styles.pageButton} ${validatedPage === 1 ? styles.pageDisabled : ''}`}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeftIcon size={14} />
              <span>Previous</span>
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx + 1}
                className={`${styles.pageNumber} ${validatedPage === idx + 1 ? styles.pageActive : ''}`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}

            <button
              className={`${styles.pageButton} ${validatedPage === totalPages ? styles.pageDisabled : ''}`}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              <span>Next</span>
              <ChevronRightIcon size={14} />
            </button>
          </div>

        </section>

      </main>
    </div>
  );
}
