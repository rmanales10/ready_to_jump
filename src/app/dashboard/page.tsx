'use client';

import React, { useState, useMemo } from 'react';
import styles from './dashboard.module.css';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { SearchIcon, SortIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/SVGIcons';
import { mockUsers, User } from '@/data/mockData';

export default function DashboardPage() {
  // State variables for interactive search, filters, checkbox selections, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'id' | 'email' | 'level' | 'date'>('id');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(2); // Default to Page 2 as in screenshot

  const ITEMS_PER_PAGE = 7;

  // Handles checking / unchecking a single user
  const handleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  // Handles checking / unchecking all filtered users on the current view
  const handleSelectAll = (filteredOnPageIds: string[]) => {
    const allSelectedOnPage = filteredOnPageIds.every((id) => selectedUserIds.includes(id));
    if (allSelectedOnPage) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredOnPageIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredOnPageIds])));
    }
  };

  // Sort and filter logic computed dynamically
  const processedUsers = useMemo(() => {
    let result = [...mockUsers];

    // 1. Text Search Filter (on User ID or Email)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.id.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
      );
    }

    // 2. Level Filter
    if (levelFilter !== 'All') {
      result = result.filter((user) => user.level === levelFilter);
    }

    // 3. Dynamic Sorting
    result.sort((a, b) => {
      if (sortBy === 'email') {
        return a.email.localeCompare(b.email);
      }
      if (sortBy === 'level') {
        return a.level.localeCompare(b.level);
      }
      if (sortBy === 'date') {
        // Parse date strings to compare (formatted like M/D/YY)
        const dateA = new Date(a.lastOnline).getTime();
        const dateB = new Date(b.lastOnline).getTime();
        return dateB - dateA; // Newest first
      }
      return a.id.localeCompare(b.id); // Default sort by User ID string
    });

    return result;
  }, [searchQuery, sortBy, levelFilter]);

  // Pagination bounds calculations
  const totalPages = Math.ceil(processedUsers.length / ITEMS_PER_PAGE) || 1;
  
  // Adjust current page if filters shrink total pages
  const validatedPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const startIndex = (validatedPage - 1) * ITEMS_PER_PAGE;
    return processedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedUsers, validatedPage]);

  const currentOnPageIds = paginatedUsers.map((u) => u.id);
  const isAllOnPageChecked = currentOnPageIds.length > 0 && currentOnPageIds.every((id) => selectedUserIds.includes(id));

  // Style tags mapper helper
  const getBadgeStyle = (level: User['level']) => {
    switch (level) {
      case 'Junior':
        return styles.badgeJunior;
      case 'Intermediate':
        return styles.badgeIntermediate;
      case 'Expert':
        return styles.badgeExpert;
      default:
        return '';
    }
  };

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

        {/* Three Navy metric counters */}
        <section className={styles.statsGrid}>
          <StatCard
            title="Active users"
            value="1250"
            trendValue="-10% "
            isPositive={false}
          />
          <StatCard
            title="New Users"
            value="24"
            trendValue="+5% "
            isPositive={true}
          />
          <StatCard
            title="Total Users"
            value="1301"
            trendValue="+40% "
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
                placeholder="Search user"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset back to page 1 on active search
                }}
              />
            </div>

            <div className={styles.filtersContainer}>
              {/* Level custom filtering */}
              <div className={styles.filterButton} style={{ padding: 0, overflow: 'hidden' }}>
                <select
                  value={levelFilter}
                  onChange={(e) => {
                    setLevelFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.filterSelect}
                  style={{ border: 'none', background: 'transparent', height: '100%', width: '100%', padding: '8px 16px', outline: 'none' }}
                >
                  <option value="All">All Levels</option>
                  <option value="Junior">Junior</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              {/* Sorting options selector */}
              <div className={styles.filterButton} style={{ padding: 0, overflow: 'hidden' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={styles.filterSelect}
                  style={{ border: 'none', background: 'transparent', height: '100%', width: '100%', padding: '8px 16px', outline: 'none' }}
                >
                  <option value="id">Sort by ID</option>
                  <option value="email">Sort by Email</option>
                  <option value="level">Sort by Level</option>
                  <option value="date">Sort by Last Online</option>
                </select>
              </div>


            </div>
          </div>

          {/* User management list data table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>

                  <th className={styles.th}>User ID</th>
                  <th className={styles.th}>Email Address</th>
                  <th className={styles.th}>Level</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Last Online Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className={styles.tr}>

                      <td className={styles.td}>{user.id}</td>
                      <td className={styles.td}>{user.email}</td>
                      <td className={styles.td}>
                        <span className={`${styles.levelBadge} ${getBadgeStyle(user.level)}`}>
                          {user.level}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {user.lastOnline}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={styles.td} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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
