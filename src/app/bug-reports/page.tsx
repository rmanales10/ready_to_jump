'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styles from './bug-reports.module.css';
import Sidebar from '@/components/Sidebar';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/SVGIcons';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';

// Firestore bug report shape
interface FirestoreBugReport {
  id: string; // Firestore document ID
  title: string;
  description: string;
  correctBehavior?: string;
  moreInfo?: string;
  reporterName: string;
  reporterIdnumber: string;
  reporterPic?: string;
  reportedOn: string; // 'mobile' or 'web'
  status: 'In Process' | 'Resolved';
  createdAt?: Timestamp;
}

export default function BugReportsPage() {
  const [reports, setReports] = useState<FirestoreBugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 5;

  // Fetch bug reports from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsRef = collection(db, 'bug_reports');
        const snapshot = await getDocs(reportsRef);
        const fetched: FirestoreBugReport[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title ?? '',
            description: data.description ?? '',
            correctBehavior: data.correctBehavior ?? '',
            moreInfo: data.moreInfo ?? '',
            reporterName: data.reporterName ?? 'Unknown',
            reporterIdnumber: data.reporterIdnumber ?? '',
            reporterPic: data.reporterPic ?? '',
            reportedOn: data.reportedOn ?? 'mobile',
            status: data.status === 'Resolved' ? 'Resolved' : 'In Process',
            createdAt: data.createdAt ?? null,
          };
        });

        // Sort by newest first by default
        fetched.sort((a, b) => {
          const dateA = a.createdAt?.toMillis() ?? 0;
          const dateB = b.createdAt?.toMillis() ?? 0;
          return dateB - dateA;
        });

        setReports(fetched);
      } catch (err) {
        console.error('Failed to fetch bug reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Format Firestore Timestamp
  const formatDate = (timestamp?: Timestamp | null): string => {
    if (!timestamp) return '—';
    const date = timestamp.toDate();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${dayName} ${year}.${month}.${day}`;
  };

  // Update status in Firestore and local state
  const handleStatusChange = async (id: string, newStatus: 'In Process' | 'Resolved') => {
    try {
      const reportRef = doc(db, 'bug_reports', id);
      await updateDoc(reportRef, { status: newStatus });

      // Find the corresponding report to notify the user
      const report = reports.find((r) => r.id === id);
      if (report && report.reporterIdnumber) {
        const notifsRef = collection(db, 'notifications');
        await addDoc(notifsRef, {
          title: newStatus === 'Resolved' ? 'Bug Report Resolved! 🛠️' : 'Bug Report In Progress ⚙️',
          body: `Your reported bug "${report.title}" has been marked as "${newStatus}". Thank you for helping us improve Ready To Jump!`,
          footer: `System Update - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          isRead: false,
          userId: report.reporterIdnumber,
        });
      }

      setReports((prev) =>
        prev.map((report) =>
          report.id === id ? { ...report, status: newStatus } : report
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Compute stats from real data
  const stats = useMemo(() => {
    const total = reports.length;
    const inProgress = reports.filter((r) => r.status === 'In Process').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    return { total, inProgress, resolved };
  }, [reports]);

  // Filters and sorts
  const processedReports = useMemo(() => {
    let result = [...reports];

    // 1. Text Search Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.reporterName.toLowerCase().includes(q)
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
      // Default: newest first
      const dateA = a.createdAt?.toMillis() ?? 0;
      const dateB = b.createdAt?.toMillis() ?? 0;
      return dateB - dateA;
    });

    return result;
  }, [reports, searchQuery, activeTab, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedReports.length / ITEMS_PER_PAGE) || 1;
  const validatedPage = Math.min(currentPage, totalPages);

  const paginatedReports = useMemo(() => {
    const startIndex = (validatedPage - 1) * ITEMS_PER_PAGE;
    return processedReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedReports, validatedPage]);

  // Avatar renderer — uses PRISMS pic or fallback initial
  const renderAvatar = (report: FirestoreBugReport) => (
    <div className={styles.avatar}>
      {report.reporterPic ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={report.reporterPic}
          alt={report.reporterName}
          className={styles.avatarImage}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.textContent = report.reporterName.charAt(0) || '?';
            (e.target as HTMLImageElement).parentElement!.style.display = 'flex';
            (e.target as HTMLImageElement).parentElement!.style.alignItems = 'center';
            (e.target as HTMLImageElement).parentElement!.style.justifyContent = 'center';
            (e.target as HTMLImageElement).parentElement!.style.fontSize = '14px';
            (e.target as HTMLImageElement).parentElement!.style.fontWeight = '700';
            (e.target as HTMLImageElement).parentElement!.style.color = '#fff';
          }}
        />
      ) : (
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
          {report.reporterName.charAt(0) || '?'}
        </span>
      )}
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
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'title')}
                className={styles.filterSelect}
                style={{ border: 'none', background: 'transparent', height: '100%', width: '100%', padding: '8px 14px', outline: 'none' }}
              >
                <option value="newest">Newest First</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>
        </section>

        {/* Bug card items grid */}
        <section className={styles.bugsGrid}>
          {loading ? (
            <div className={styles.bugCard} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div className={styles.loadingSpinner} />
              Loading bug reports from Firestore...
            </div>
          ) : paginatedReports.length > 0 ? (
            paginatedReports.map((report) => (
              <div key={report.id} className={styles.bugCard}>
                
                {/* Bug card title and date */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.bugTitle}>{report.title}</h3>
                  <span className={styles.bugDate}>{formatDate(report.createdAt)}</span>
                </div>

                {/* Bug card description */}
                <p className={styles.bugDescription}>{report.description}</p>

                {/* Show correct behavior if present */}
                {report.correctBehavior && (
                  <p className={styles.bugCorrectBehavior}>
                    <strong>Expected:</strong> {report.correctBehavior}
                  </p>
                )}

                {/* Bug card reporter details & status dropdown */}
                <div className={styles.cardFooter}>
                  <div className={styles.reporterInfo}>
                    {renderAvatar(report)}
                    <span className={styles.reporterName}>{report.reporterName}</span>
                    <span className={styles.reporterSeparator}>|</span>
                    <span className={styles.reporterDevice}>
                      reported on {report.reportedOn}
                    </span>
                  </div>

                  {/* Interactive status dropdown — updates Firestore */}
                  <div className={styles.statusBadgeWrapper}>
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report.id, e.target.value as 'In Process' | 'Resolved')}
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
