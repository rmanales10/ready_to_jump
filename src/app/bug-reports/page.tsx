'use client';

import React, { useState, useMemo } from 'react';
import styles from './bug-reports.module.css';
import Sidebar from '@/components/Sidebar';
import { SearchIcon, SortIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/SVGIcons';
import { mockBugReports, BugReport } from '@/data/mockData';

export default function BugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>(mockBugReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(2); // Default to Page 2 from screenshot

  const ITEMS_PER_PAGE = 3;

  // Handles updating the status of a specific bug report dynamically
  const handleStatusChange = (id: string, newStatus: BugReport['status']) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, status: newStatus } : report
      )
    );
  };

  // Computes the statistics counts dynamically from state
  const stats = useMemo(() => {
    const total = reports.length;
    const inProgress = reports.filter((r) => r.status === 'In Process').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;

    // Standardize offsets to align with the visual counts in the screenshot (22 total, 12 in progress, 10 resolved)
    // while keeping them interactive. If you change a bug's status, the counts will reflect the changes!
    const baseTotal = 22;
    const baseInProgress = 12;
    const baseResolved = 10;

    // Calculate diff from base mock length
    const initialTotalMock = mockBugReports.length;
    const initialInProgressMock = mockBugReports.filter((r) => r.status === 'In Process').length;
    const initialResolvedMock = mockBugReports.filter((r) => r.status === 'Resolved').length;

    const diffInProgress = inProgress - initialInProgressMock;
    const diffResolved = resolved - initialResolvedMock;

    return {
      total: baseTotal + diffInProgress + diffResolved,
      inProgress: baseInProgress + diffInProgress,
      resolved: baseResolved + diffResolved
    };
  }, [reports]);

  // Filters and sorts bug reports computed dynamically
  const processedReports = useMemo(() => {
    let result = [...reports];

    // 1. Text Search Filter (on Title or Description)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }

    // 2. Tab Filter
    if (activeTab === 'in-progress') {
      result = result.filter((r) => r.status === 'In Process');
    } else if (activeTab === 'resolved') {
      result = result.filter((r) => r.status === 'Resolved');
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return a.id.localeCompare(b.id); // Default / ID sorting
    });

    return result;
  }, [reports, searchQuery, activeTab, sortBy]);

  // Pagination bounds calculations
  const totalPages = Math.ceil(processedReports.length / ITEMS_PER_PAGE) || 1;
  const validatedPage = Math.min(currentPage, totalPages);

  const paginatedReports = useMemo(() => {
    const startIndex = (validatedPage - 1) * ITEMS_PER_PAGE;
    return processedReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedReports, validatedPage]);

  // Sharp inline SVG representation for Cahnn's profile avatar
  const renderAvatar = (bgColor: string) => (
    <div className={styles.avatar} style={{ backgroundColor: bgColor }}>
      <svg viewBox="0 0 100 100" className={styles.avatarImage}>
        <defs>
          <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#avatarGrad)" />
        {/* Stylized hair/face vector */}
        <circle cx="50" cy="40" r="22" fill="#fed7aa" />
        <path d="M50 18 C30 18, 25 35, 28 45 C32 40, 40 42, 50 35 C60 42, 68 40, 72 45 C75 35, 70 18, 50 18 Z" fill="#7c2d12" />
        <path d="M20 85 C20 70, 35 60, 50 60 C65 60, 80 70, 80 85 Z" fill="#3b82f6" />
      </svg>
    </div>
  );

  return (
    <div className={styles.layout}>
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main bug reports content */}
      <main className={styles.mainContent}>
        
        {/* Top administration navbar headers */}
        <header className={styles.header}>
          <h1 className={styles.title}>User bug report</h1>
          <div className={styles.adminProfile}>Admin</div>
        </header>

        {/* Tab Filters and Controls panel */}
        <section className={styles.topControls}>
          <div className={styles.tabGroup}>
            <span className={styles.tabTitle}>Bug Reports</span>
            
            <button
              className={`${styles.tabButton} ${activeTab === 'all' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
            >
              all Reports ({stats.total})
            </button>
            
            <button
              className={`${styles.tabButton} ${activeTab === 'in-progress' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('in-progress');
                setCurrentPage(1);
              }}
            >
              In progress ({stats.inProgress})
            </button>
            
            <button
              className={`${styles.tabButton} ${activeTab === 'resolved' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('resolved');
                setCurrentPage(1);
              }}
            >
              Resolved ({stats.resolved})
            </button>
          </div>

          <div className={styles.rightControls}>
            <div className={styles.searchContainer}>
              <SearchIcon className={styles.searchIcon} size={15} />
              <input
                type="text"
                placeholder="Search Reports"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className={styles.filterButton} style={{ padding: 0, overflow: 'hidden' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={styles.filterSelect}
                style={{ border: 'none', background: 'transparent', height: '100%', width: '100%', padding: '8px 14px', outline: 'none' }}
              >
                <option value="newest">Sorting By</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>


          </div>
        </section>

        {/* Bug card items grid */}
        <section className={styles.bugsGrid}>
          {paginatedReports.length > 0 ? (
            paginatedReports.map((report) => (
              <div key={report.id} className={styles.bugCard}>
                
                {/* Bug card title and date */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.bugTitle}>{report.title}</h3>
                  <span className={styles.bugDate}>{report.date}</span>
                </div>

                {/* Bug card description */}
                <p className={styles.bugDescription}>{report.description}</p>

                {/* Bug card reporter details & status dropdown */}
                <div className={styles.cardFooter}>
                  <div className={styles.reporterInfo}>
                    {renderAvatar(report.reporter.avatar)}
                    <span className={styles.reporterName}>{report.reporter.name}</span>
                    <span className={styles.reporterSeparator}>|</span>
                    <span className={styles.reporterDevice}>{report.reporter.device}</span>
                  </div>

                  {/* Interactive status dropdown */}
                  <div className={styles.statusBadgeWrapper}>
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report.id, e.target.value as BugReport['status'])}
                      className={`${styles.statusDropdown} ${
                        report.status === 'Resolved' ? styles.statusResolved : styles.statusInProcess
                      }`}
                    >
                      <option value="In Process">In Process</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className={styles.bugCard} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              No bug reports match the selected filters.
            </div>
          )}
        </section>

        {/* Bug list pagination controls */}
        <section className={styles.paginationBar}>
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
        </section>

      </main>
    </div>
  );
}
