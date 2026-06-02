'use client';

import React, { useState, useMemo, KeyboardEvent, useRef, useEffect } from 'react';
import styles from './courses.module.css';
import Sidebar from '@/components/Sidebar';
import { SearchIcon, CoursesIcon } from '@/components/SVGIcons';
import { Course, InterviewerPersona } from '@/data/mockData';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  // Categories list state
  const [categories, setCategories] = useState<string[]>(['IT', 'Product', 'Business', 'Marketing']);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form states
  const [isEditing, setIsEditing] = useState(true);
  const [formCategory, setFormCategory] = useState('');
  
  // Multiple target roles tags system
  const [formTargetRoles, setFormTargetRoles] = useState<string[]>([]);
  const [targetRolesInput, setTargetRolesInput] = useState('');

  const [formTargetLevels, setFormTargetLevels] = useState<('Junior' | 'Mid' | 'Senior')[]>([]);
  
  // AI Persona states
  const [formInterviewers, setFormInterviewers] = useState<InterviewerPersona[]>([]);
  const [activeInterviewerId, setActiveInterviewerId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeAvatarInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Personality Dropdown states
  const [personalities, setPersonalities] = useState<string[]>([
    'Empathic and Structured',
    'Friendly and Encouraging',
    'Professional and Direct',
    'Constructive and Development-Oriented',
    'Objective and Unbiased',
    'Patient and Supportive',
    'Motivational and Confidence-Building',
    'Adaptive and Personalized'
  ]);
  const [showCustomPersonalityInput, setShowCustomPersonalityInput] = useState(false);
  const [newPersonalityName, setNewPersonalityName] = useState('');

  const handleAddCustomPersonality = () => {
    const trimmed = newPersonalityName.trim();
    if (trimmed) {
      if (!personalities.includes(trimmed)) {
        setPersonalities((prev) => [...prev, trimmed]);
      }
      handleActiveInterviewerChange('style', trimmed);
      setNewPersonalityName('');
      setShowCustomPersonalityInput(false);
      showNotification(`Added custom style: "${trimmed}"`);
    }
  };

  // Active interviewer helper
  const activeInterviewer = useMemo(() => {
    return formInterviewers.find((i) => i.id === activeInterviewerId) || formInterviewers[0];
  }, [formInterviewers, activeInterviewerId]);

  // Interactive Tags states
  const [formFocusAreas, setFormFocusAreas] = useState<string[]>([]);
  const [focusAreaInput, setFocusAreaInput] = useState('');

  const [formTargetOutcomes, setFormTargetOutcomes] = useState<string[]>([]);
  const [targetOutcomesInput, setTargetOutcomesInput] = useState('');

  const [formGrowthGoals, setFormGrowthGoals] = useState<string[]>([]);
  const [growthGoalsInput, setGrowthGoalsInput] = useState('');

  // Zero-Code Prompts states
  const [formArchitectPrompt, setFormArchitectPrompt] = useState('');
  const [formInterviewerPrompt, setFormInterviewerPrompt] = useState('');
  const [formEvaluatorPrompt, setFormEvaluatorPrompt] = useState('');
  const [formCoachPrompt, setFormCoachPrompt] = useState('');

  // Notification banners
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Filter courses by search based on roles or category
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const q = searchQuery.toLowerCase();
      const rolesMatch = course.targetRoles.some(role => role.toLowerCase().includes(q));
      const categoryMatch = course.category.toLowerCase().includes(q);
      const interviewerMatch = course.interviewers?.some(i => i.name.toLowerCase().includes(q)) || false;
      return rolesMatch || categoryMatch || interviewerMatch;
    });
  }, [courses, searchQuery]);

  // Load course details into form when a course is selected
  const handleSelectCourse = (course: Course) => {
    setSelectedCourseId(course.id);
    setIsEditing(true);

    // Load general details
    setFormCategory(course.category);
    setFormTargetRoles(course.targetRoles);
    setFormTargetLevels(course.targetLevels);

    // Load AI interviewer persona details
    const ints = course.interviewers || [];
    setFormInterviewers(ints);
    setActiveInterviewerId(ints[0]?.id || '');

    // Load Tags
    setFormFocusAreas(course.focusAreas);
    setFormTargetOutcomes(course.targetOutcomes);
    setFormGrowthGoals(course.growthGoals);

    // Load Prompts
    setFormArchitectPrompt(course.architectPrompt || '');
    setFormInterviewerPrompt(course.interviewerPrompt);
    setFormEvaluatorPrompt(course.evaluatorPrompt);
    setFormCoachPrompt(course.coachPrompt);
  };

  // Initialize form for a brand new course
  const handleAddNewCourseClick = () => {
    setSelectedCourseId(null);
    setIsEditing(false);

    // Set clean defaults
    setFormCategory(categories[0] || 'IT');
    setFormTargetRoles(['Software Engineer', 'Programmer']);
    setFormTargetLevels(['Junior', 'Mid']);
    
    const defaultPersona: InterviewerPersona = {
      id: `persona-${Date.now()}`,
      name: 'Ava',
      title: 'AI Interview Lead',
      style: 'Empathetic & Structured',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'
    };
    setFormInterviewers([defaultPersona]);
    setActiveInterviewerId(defaultPersona.id);

    setFormFocusAreas(['Technical Questions', 'Scenario-Based']);
    setFormTargetOutcomes(['General Growth']);
    setFormGrowthGoals(['Confidence', 'Answer Clarity']);

    // Standard high-fidelity templates for zero-code maintenance
    setFormArchitectPrompt(`You are the AI Interview Architect/Planner (Ang Planner). Your role is to plan the interview structure based on the candidate's target roles and the job description provided.

1. Analyze the user's input (Job Description, target level).
2. Construct a structured interview flow testing the core technical and behavioral aspects.
3. Pass this structured flow to the Interviewer Agent to guide the conversation step-by-step.`);

    setFormInterviewerPrompt(`You are Ava, a highly skilled AI Interviewer. Your style is empathetic, warm, and highly structured.

Your goal is to conduct a professional interview for the candidate:
1. Ask clear, targeted questions one by one.
2. Listen to their responses and ask follow-up questions to understand their specific thought process.
3. Be professional and encouraging. Try to draw out their practical expertise.`);

    setFormEvaluatorPrompt(`Evaluate the candidate's answers based on the following:
1. Conceptual Understanding (0-10): Accuracy of concepts explained.
2. Logic (0-10): Structural coherence and reasoning of the solution.
3. Communication (0-10): Articulation of the response.

Provide an average score, highlighting key strengths and areas of improvements.`);

    setFormCoachPrompt(`As an AI Coach, analyze the candidate's interview performance:
1. Frameworks: Did they structure their answer step-by-step?
2. Articulation: Did they present clear examples or metrics?
3. Speech habits: Provide advice on voice modulation, filler words, or pacing.

Deliver encouraging suggestions and actionable steps for future practice.`);

    showNotification('Form initialized with default templates. Add additional interviewers and upload custom images on the right.', 'info');
  };

  // Handle adding dynamic tags
  const handleAddTag = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    tags: string[],
    setTags: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setInput('');
    }
  };

  const handleTagInputKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    tags: string[],
    setTags: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(input, setInput, tags, setTags);
    }
  };

  const handleRemoveTag = (tagToRemove: string, tags: string[], setTags: React.Dispatch<React.SetStateAction<string[]>>) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Handle new interviewer addition via image upload from computer (Vercel Blob Storage)
  const handleAddNewInterviewerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    showNotification('Uploading image(s) to Vercel Blob Storage...', 'info');

    const newPersonas: InterviewerPersona[] = [];
    let uploadedCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file,
        });

        if (!res.ok) {
          throw new Error('Upload failed');
        }

        const data = await res.json();
        const newId = `persona-${Date.now()}-${i}`;
        newPersonas.push({
          id: newId,
          name: file.name.split('.')[0] || `AI Interviewer ${i + 1}`,
          title: 'Senior Specialist',
          style: 'Direct & Focused',
          avatar: data.url, // Save Vercel Blob CDN url!
        });
        uploadedCount++;
      } catch (err) {
        console.error('Error uploading to Vercel Blob:', err);
        showNotification(`Failed to upload "${file.name}" to Vercel Blob.`, 'error');
      }
    }

    if (newPersonas.length > 0) {
      setFormInterviewers((prev) => [...prev, ...newPersonas]);
      setActiveInterviewerId(newPersonas[0].id);
      showNotification(`Successfully uploaded and created ${newPersonas.length} new interviewer(s)!`);
    }
  };

  // Handle active interviewer avatar replacement (Vercel Blob Storage)
  const handleActiveInterviewerAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeInterviewer) return;

    showNotification(`Uploading avatar for ${activeInterviewer.name} to Vercel Blob...`, 'info');

    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setFormInterviewers((prev) =>
        prev.map((i) => (i.id === activeInterviewer.id ? { ...i, avatar: data.url } : i))
      );
      showNotification(`Successfully updated avatar for ${activeInterviewer.name} via Vercel Blob!`);
    } catch (err) {
      console.error('Error updating avatar in Vercel Blob:', err);
      showNotification('Failed to upload avatar to Vercel Blob.', 'error');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerActiveAvatarFileSelect = () => {
    activeAvatarInputRef.current?.click();
  };

  const handleDeleteInterviewer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (formInterviewers.length <= 1) {
      showNotification('AI Interviewer pool must have at least one persona.', 'error');
      return;
    }

    const updated = formInterviewers.filter((i) => i.id !== id);
    setFormInterviewers(updated);

    if (activeInterviewerId === id) {
      setActiveInterviewerId(updated[0]?.id || '');
    }
    showNotification('AI Interviewer persona removed from pool.', 'info');
  };

  // Edit active interviewer helper
  const handleActiveInterviewerChange = (field: keyof InterviewerPersona, value: string) => {
    if (!activeInterviewer) return;
    setFormInterviewers((prev) =>
      prev.map((i) => (i.id === activeInterviewer.id ? { ...i, [field]: value } : i))
    );
  };

  // Handle Level toggles
  const handleToggleLevel = (level: 'Junior' | 'Mid' | 'Senior') => {
    if (formTargetLevels.includes(level)) {
      setFormTargetLevels(formTargetLevels.filter((l) => l !== level));
    } else {
      setFormTargetLevels([...formTargetLevels, level]);
    }
  };

  // Handle category additions
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setFormCategory(trimmed);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      showNotification(`Category "${trimmed}" added successfully!`, 'success');
    }
  };

  // Handle Save / Submit of course form — writes to Firestore
  const handleSaveCourse = async () => {
    if (formTargetRoles.length === 0) {
      showNotification('Target Roles cannot be empty. Please specify at least one target role.', 'error');
      return;
    }
    if (formInterviewers.length === 0) {
      showNotification('AI Interviewer pool must have at least one persona.', 'error');
      return;
    }

    const courseData = {
      category: formCategory,
      targetRoles: formTargetRoles,
      targetLevels: formTargetLevels,
      interviewers: formInterviewers.map((i) => ({
        id: i.id,
        name: i.name,
        title: i.title,
        style: i.style,
        avatar: i.avatar,
        gender: i.gender ?? 'male',
      })),
      focusAreas: formFocusAreas,
      targetOutcomes: formTargetOutcomes,
      growthGoals: formGrowthGoals,
      architectPrompt: formArchitectPrompt,
      interviewerPrompt: formInterviewerPrompt,
      evaluatorPrompt: formEvaluatorPrompt,
      coachPrompt: formCoachPrompt,
    };

    try {
      if (isEditing && selectedCourseId) {
        // Update existing in Firestore
        await setDoc(doc(db, 'courses', selectedCourseId), courseData);

        setCourses(
          courses.map((course) =>
            course.id === selectedCourseId ? { ...course, ...courseData } : course
          )
        );
        showNotification('Course saved to Firestore! Changes are now live on the mobile app.');
      } else {
        // Create new in Firestore
        const newCourseId = `course-${Date.now()}`;
        await setDoc(doc(db, 'courses', newCourseId), courseData);

        const newCourse: Course = { id: newCourseId, ...courseData } as Course;
        setCourses([...courses, newCourse]);
        setSelectedCourseId(newCourseId);
        setIsEditing(true);
        showNotification('New course created in Firestore! Mobile app can now use these prompts.');
      }
    } catch (err) {
      console.error('Firestore save error:', err);
      showNotification('Failed to save to Firestore. Check console for details.', 'error');
    }
  };

  // Handle deleting a course — deletes from Firestore
  const handleDeleteCourse = async () => {
    if (!selectedCourseId) return;

    if (confirm('Are you sure you want to delete this course and all its AI Prompts? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'courses', selectedCourseId));

        const remaining = courses.filter((c) => c.id !== selectedCourseId);
        setCourses(remaining);
        showNotification('Course deleted from Firestore.', 'info');
        
        if (remaining.length > 0) {
          handleSelectCourse(remaining[0]);
        } else {
          setSelectedCourseId(null);
        }
      } catch (err) {
        console.error('Firestore delete error:', err);
        showNotification('Failed to delete from Firestore.', 'error');
      }
    }
  };

  // Handle resetting the form back to actual values
  const handleResetForm = () => {
    if (selectedCourseId) {
      const current = courses.find((c) => c.id === selectedCourseId);
      if (current) {
        handleSelectCourse(current);
        showNotification('Form reset to saved database values.', 'info');
      }
    }
  };

  // Fetch courses from Firestore on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'courses'));
        const fetched: Course[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            category: data.category ?? '',
            targetRoles: data.targetRoles ?? [],
            targetLevels: data.targetLevels ?? [],
            interviewers: (data.interviewers ?? []).map((i: InterviewerPersona) => ({
              id: i.id ?? `persona-${Date.now()}`,
              name: i.name ?? '',
              title: i.title ?? '',
              style: i.style ?? '',
              avatar: i.avatar ?? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
              gender: i.gender ?? 'male',
            })),
            focusAreas: data.focusAreas ?? [],
            targetOutcomes: data.targetOutcomes ?? [],
            growthGoals: data.growthGoals ?? [],
            architectPrompt: data.architectPrompt ?? '',
            interviewerPrompt: data.interviewerPrompt ?? '',
            evaluatorPrompt: data.evaluatorPrompt ?? '',
            coachPrompt: data.coachPrompt ?? '',
          } as Course;
        });

        setCourses(fetched);
        if (fetched.length > 0) {
          setSelectedCourseId(fetched[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setFirestoreLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Load details when selectedCourseId changes
  React.useEffect(() => {
    if (courses.length > 0 && selectedCourseId) {
      const active = courses.find((c) => c.id === selectedCourseId);
      if (active) {
        setFormCategory(active.category);
        setFormTargetRoles(active.targetRoles);
        setFormTargetLevels(active.targetLevels);
        const ints = active.interviewers || [];
        setFormInterviewers(ints);
        setActiveInterviewerId(ints[0]?.id || '');
        setFormFocusAreas(active.focusAreas);
        setFormTargetOutcomes(active.targetOutcomes);
        setFormGrowthGoals(active.growthGoals);
        setFormArchitectPrompt(active.architectPrompt || '');
        setFormInterviewerPrompt(active.interviewerPrompt);
        setFormEvaluatorPrompt(active.evaluatorPrompt);
        setFormCoachPrompt(active.coachPrompt);
        setIsEditing(true);
      }
    }
  }, [selectedCourseId, courses]);

  return (
    <div className={styles.layout}>
      {/* Sidebar Layout shell */}
      <Sidebar />

      {/* Main Screen Panel */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>Courses & Prompts Management</h1>
          <div className={styles.adminProfile}>Admin</div>
        </header>

        {/* Global Action notification */}
        {notification && (
          <div
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              backgroundColor:
                notification.type === 'success'
                  ? 'var(--green-bg)'
                  : notification.type === 'error'
                  ? 'var(--red-bg)'
                  : 'var(--amber-bg)',
              color:
                notification.type === 'success'
                  ? 'var(--green-text)'
                  : notification.type === 'error'
                  ? 'var(--red-text)'
                  : 'var(--amber-text)',
            }}
          >
            {notification.message}
          </div>
        )}

        {/* Split screen containers */}
        <div className={styles.panelContainer}>
          
          {/* LEFT: Active Courses list panel */}
          <div className={styles.listPanel}>
            <div className={styles.listActions}>
              <div className={styles.searchContainer}>
                <SearchIcon className={styles.searchIcon} size={16} />
                <input
                  type="text"
                  placeholder="Search roles or category..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className={styles.addButton} onClick={handleAddNewCourseClick}>
                <span>+</span> Add Course
              </button>
            </div>

            <div className={styles.scrollableList}>
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => {
                  const isActive = course.id === selectedCourseId;
                  const hasInt = !!course.interviewerPrompt.trim();
                  const hasEval = !!course.evaluatorPrompt.trim();
                  const hasCoach = !!course.coachPrompt.trim();

                  return (
                    <div
                      key={course.id}
                      className={`${styles.courseCard} ${isActive ? styles.activeCourseCard : ''}`}
                      onClick={() => handleSelectCourse(course)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.categoryBadge}>{course.category}</span>
                        <div className={styles.promptsIndicators}>
                          <span className={`${styles.promptDot} ${hasInt ? styles.promptDotFilled : ''}`}>INT</span>
                          <span className={`${styles.promptDot} ${hasEval ? styles.promptDotFilled : ''}`}>EVAL</span>
                          <span className={`${styles.promptDot} ${hasCoach ? styles.promptDotFilled : ''}`}>COACH</span>
                        </div>
                      </div>

                      {/* Display primary role and target roles badges */}
                      <h3 className={styles.courseName}>{course.targetRoles[0] || 'No Roles'}</h3>
                      
                      <div className={styles.rolesContainer}>
                        {course.targetRoles.map((role) => (
                          <span
                            key={role}
                            className={styles.roleTag}
                          >
                            {role}
                          </span>
                        ))}
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.interviewerSnippet}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {course.interviewers?.slice(0, 3).map((i, index) => (
                              <img
                                key={i.id}
                                src={i.avatar || '/logo.png'}
                                alt={i.name}
                                className={styles.avatarSnippet}
                                style={{
                                  marginLeft: index > 0 ? '-10px' : '0',
                                  zIndex: 10 - index,
                                  position: 'relative',
                                  border: '2px solid rgba(255, 255, 255, 0.2)'
                                }}
                              />
                            ))}
                          </div>
                          <span className={styles.interviewerName}>
                            {course.interviewers?.length || 0} AI Personas ({course.interviewers?.map((i) => i.name).join(', ')})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.courseCard} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No courses found matching search.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Dynamic Editor Form Panel */}
          <div className={styles.editorPanel}>
            {selectedCourseId || !isEditing ? (
              <>
                <div className={styles.editorHeader}>
                  <h2 className={styles.editorTitle}>
                    {isEditing ? 'Edit Course & Prompts' : 'Create New Course & Prompts'}
                  </h2>
                  <div className={styles.editorActions}>
                    {isEditing && (
                      <button className={styles.deleteButton} onClick={handleDeleteCourse}>
                        Delete Course
                      </button>
                    )}
                    <button className={styles.resetButton} onClick={handleResetForm}>
                      Reset
                    </button>
                    <button className={styles.saveButton} onClick={handleSaveCourse}>
                      {isEditing ? 'Save Changes' : 'Create Course'}
                    </button>
                  </div>
                </div>

                <div className={styles.scrollableEditor}>
                  
                  {/* ZERO-CODE MAINTENANCE INFO */}
                  <div className={styles.tipsBanner}>
                     <div className={styles.tipsIcon}>💡</div>
                    <div className={styles.tipsContent}>
                      <h4 className={styles.tipsTitle}>Zero-Code AI Prompt Maintenance System</h4>
                      <p className={styles.tipsDescription}>
                        Editing these fields updates the AI's behavior instantly! Type instructions directly into the prompts textareas below. This updates the **Interviewer, Evaluator, and Coach** agents on-the-fly without needing developer code modifications.
                      </p>
                    </div>
                  </div>

                  {/* SECTION 1: General Info */}
                  <div className={styles.editorSection}>
                    <h3 className={styles.sectionTitle}>1. Course General Settings</h3>
                    
                    <div className={styles.grid2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Category</label>
                        <div className={styles.categorySelectContainer}>
                          {showNewCategoryInput ? (
                            <>
                              <input
                                type="text"
                                className={styles.formInput}
                                style={{ flexGrow: 1 }}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="New category name"
                              />
                              <button className={styles.inlineAddBtn} onClick={handleAddCategory}>Add</button>
                              <button className={styles.resetButton} style={{ padding: '0 12px' }} onClick={() => setShowNewCategoryInput(false)}>X</button>
                            </>
                          ) : (
                            <>
                              <select
                                className={styles.formSelect}
                                style={{ flexGrow: 1 }}
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value)}
                              >
                                {categories.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <button className={styles.inlineAddBtn} onClick={() => setShowNewCategoryInput(true)}>+ New</button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Target Levels Available</label>
                        <div className={styles.levelButtonsRow}>
                          {(['Junior', 'Mid', 'Senior'] as const).map((level) => {
                            const isSelected = formTargetLevels.includes(level);
                            return (
                              <button
                                key={level}
                                type="button"
                                className={`${styles.levelToggleBtn} ${isSelected ? styles.levelToggleActive : ''}`}
                                onClick={() => handleToggleLevel(level)}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Target Roles (Add Multiple Roles Possible)</label>
                      <div className={styles.tagsContainer}>
                        {formTargetRoles.map((role) => (
                          <span
                            key={role}
                            className={styles.tagBadge}
                            style={{ backgroundColor: 'var(--brand-blue)' }}
                            onClick={() => handleRemoveTag(role, formTargetRoles, setFormTargetRoles)}
                          >
                            {role} <span className={styles.tagDeleteBtn}>×</span>
                          </span>
                        ))}
                        <input
                          type="text"
                          className={styles.tagInput}
                          placeholder="Add target role tag... (Press Enter)"
                          value={targetRolesInput}
                          onChange={(e) => setTargetRolesInput(e.target.value)}
                          onKeyDown={(e) =>
                            handleTagInputKeyDown(e, targetRolesInput, setTargetRolesInput, formTargetRoles, setFormTargetRoles)
                          }
                          onBlur={() => handleAddTag(targetRolesInput, setTargetRolesInput, formTargetRoles, setFormTargetRoles)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: AI Interviewer Persona Card */}
                  <div className={styles.editorSection}>
                    <h3 className={styles.sectionTitle}>2. AI Interviewer Persona</h3>
                    
                    <div className={styles.personaCardPreview}>
                      <div 
                        className={styles.personaAvatarWrapper}
                        onClick={triggerActiveAvatarFileSelect}
                        style={{ cursor: 'pointer', position: 'relative' }}
                        title="Change Persona Photo"
                      >
                        <img
                          src={activeInterviewer?.avatar || '/logo.png'}
                          alt={activeInterviewer?.name || 'AI Interviewer'}
                          className={styles.personaAvatar}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.png';
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.6)',
                          color: '#ffffff',
                          fontSize: '9px',
                          padding: '2px 0',
                          textAlign: 'center',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Change
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          ref={activeAvatarInputRef}
                          style={{ display: 'none' }}
                          onChange={handleActiveInterviewerAvatarUpload}
                        />
                      </div>
                      <div className={styles.personaInfo}>
                        <div className={styles.personaHeader}>
                          <input
                            type="text"
                            className={styles.personaNameInput}
                            value={activeInterviewer?.name || ''}
                            onChange={(e) => handleActiveInterviewerChange('name', e.target.value)}
                            placeholder="AI Name (e.g. David)"
                          />
                          <div className={styles.personaTick}>✓</div>
                        </div>

                        <input
                          type="text"
                          className={styles.personaTitleInput}
                          value={activeInterviewer?.title || ''}
                          onChange={(e) => handleActiveInterviewerChange('title', e.target.value)}
                          placeholder="AI Subtitle (e.g. Senior Programmer)"
                        />

                        <div style={{ marginTop: '8px' }}>
                          {!showCustomPersonalityInput ? (
                            <select
                              className={styles.personaStyleSelect}
                              value={activeInterviewer?.style || ''}
                              onChange={(e) => {
                                if (e.target.value === 'ADD_NEW') {
                                  setShowCustomPersonalityInput(true);
                                } else {
                                  handleActiveInterviewerChange('style', e.target.value);
                                }
                              }}
                            >
                              <option value="" disabled>Select Style / Personality</option>
                              {personalities.map((styleOption) => (
                                <option key={styleOption} value={styleOption}>
                                  {styleOption}
                                </option>
                              ))}
                              {activeInterviewer?.style && !personalities.includes(activeInterviewer.style) && (
                                <option value={activeInterviewer.style}>
                                  {activeInterviewer.style}
                                </option>
                              )}
                              <option value="ADD_NEW" style={{ color: '#2dd4bf', fontWeight: 'bold' }}>
                                + Add Custom Personality...
                              </option>
                            </select>
                          ) : (
                            <div className={styles.customStyleContainer}>
                              <input
                                type="text"
                                className={styles.customStyleInput}
                                placeholder="Add custom style..."
                                value={newPersonalityName}
                                onChange={(e) => setNewPersonalityName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomPersonality();
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomPersonality}
                                className={styles.customStyleAddBtn}
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomPersonalityInput(false);
                                  setNewPersonalityName('');
                                }}
                                className={styles.customStyleCancelBtn}
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Dynamic Voice Gender Selection */}
                        <div className={styles.genderSelectContainer}>
                          <span className={styles.genderSelectLabel}>Voice Gender (TTS)</span>
                          <div className={styles.genderButtonGroup}>
                            <button
                              type="button"
                              onClick={() => handleActiveInterviewerChange('gender', 'male')}
                              className={`${styles.genderSelectBtn} ${
                                (activeInterviewer?.gender || 'male') === 'male' ? styles.genderActive : ''
                              }`}
                            >
                              ♂ Male Voice
                            </button>
                            <button
                              type="button"
                              onClick={() => handleActiveInterviewerChange('gender', 'female')}
                              className={`${styles.genderSelectBtn} ${
                                activeInterviewer?.gender === 'female' ? styles.genderActive : ''
                              }`}
                            >
                              ♀ Female Voice
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* INTERVIEWER PERSONAS POOL SECTION */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>AI Interviewers Pool (Click to select & edit, Hover to delete)</label>
                      
                      <div className={styles.avatarsGallery}>
                        {formInterviewers.map((persona) => {
                          const isActive = activeInterviewerId === persona.id;
                          return (
                            <div
                              key={persona.id}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                            >
                              <div
                                className={`${styles.avatarThumbContainer} ${isActive ? styles.avatarThumbActive : ''}`}
                                onClick={() => setActiveInterviewerId(persona.id)}
                                title={isActive ? 'Active Persona' : `Click to edit ${persona.name}`}
                              >
                                <img src={persona.avatar || '/logo.png'} alt={persona.name} className={styles.avatarThumb} />
                                {isActive && <div className={styles.avatarActiveBadge}>✓</div>}
                                <button
                                  type="button"
                                  className={styles.avatarThumbDelete}
                                  onClick={(e) => handleDeleteInterviewer(persona.id, e)}
                                  title={`Delete ${persona.name}`}
                                >
                                  ×
                                </button>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
                                {persona.name}
                              </span>
                            </div>
                          );
                        })}

                        {/* Add New Persona upload card */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div className={styles.avatarUploadCard} onClick={triggerFileSelect} title="Add new interviewer with image">
                            <span className={styles.avatarUploadIcon}>+</span>
                            <span className={styles.avatarUploadLabel}>Add AI</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              ref={fileInputRef}
                              style={{ display: 'none' }}
                              onChange={handleAddNewInterviewerUpload}
                            />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)' }}>
                            Add New
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Dynamic Mockup Struct Tags */}
                  <div className={styles.editorSection}>
                    <h3 className={styles.sectionTitle}>3. Mockup Goals & Categories Structure</h3>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Focus Areas (Mockup: "Your Focus -&gt; Area")</label>
                      <div className={styles.tagsContainer}>
                        {formFocusAreas.map((tag) => (
                          <span
                            key={tag}
                            className={styles.tagBadge}
                            onClick={() => handleRemoveTag(tag, formFocusAreas, setFormFocusAreas)}
                          >
                            {tag} <span className={styles.tagDeleteBtn}>×</span>
                          </span>
                        ))}
                        <input
                          type="text"
                          className={styles.tagInput}
                          placeholder="Add focus area tag... (Press Enter)"
                          value={focusAreaInput}
                          onChange={(e) => setFocusAreaInput(e.target.value)}
                          onKeyDown={(e) =>
                            handleTagInputKeyDown(e, focusAreaInput, setFocusAreaInput, formFocusAreas, setFormFocusAreas)
                          }
                          onBlur={() => handleAddTag(focusAreaInput, setFocusAreaInput, formFocusAreas, setFormFocusAreas)}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Target Outcomes</label>
                      <div className={styles.tagsContainer}>
                        {formTargetOutcomes.map((tag) => (
                          <span
                            key={tag}
                            className={styles.tagBadge}
                            onClick={() => handleRemoveTag(tag, formTargetOutcomes, setFormTargetOutcomes)}
                          >
                            {tag} <span className={styles.tagDeleteBtn}>×</span>
                          </span>
                        ))}
                        <input
                          type="text"
                          className={styles.tagInput}
                          placeholder="Add target outcome... (Press Enter)"
                          value={targetOutcomesInput}
                          onChange={(e) => setTargetOutcomesInput(e.target.value)}
                          onKeyDown={(e) =>
                            handleTagInputKeyDown(
                              e,
                              targetOutcomesInput,
                              setTargetOutcomesInput,
                              formTargetOutcomes,
                              setFormTargetOutcomes
                            )
                          }
                          onBlur={() =>
                            handleAddTag(targetOutcomesInput, setTargetOutcomesInput, formTargetOutcomes, setFormTargetOutcomes)
                          }
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Growth Goals to Improve (Mockup: "Growth Goals -&gt; Improve")</label>
                      <div className={styles.tagsContainer}>
                        {formGrowthGoals.map((tag) => (
                          <span
                            key={tag}
                            className={styles.tagBadge}
                            onClick={() => handleRemoveTag(tag, formGrowthGoals, setFormGrowthGoals)}
                          >
                            {tag} <span className={styles.tagDeleteBtn}>×</span>
                          </span>
                        ))}
                        <input
                          type="text"
                          className={styles.tagInput}
                          placeholder="Add improvement target... (Press Enter)"
                          value={growthGoalsInput}
                          onChange={(e) => setGrowthGoalsInput(e.target.value)}
                          onKeyDown={(e) =>
                            handleTagInputKeyDown(e, growthGoalsInput, setGrowthGoalsInput, formGrowthGoals, setFormGrowthGoals)
                          }
                          onBlur={() => handleAddTag(growthGoalsInput, setGrowthGoalsInput, formGrowthGoals, setFormGrowthGoals)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: Zero-Code Prompts Editor */}
                  <div className={styles.editorSection}>
                    <h3 className={styles.sectionTitle}>4. Real-time Agent System Instructions (Prompts)</h3>
                    
                    {/* Prompt Box 0: Architect */}
                    <div className={styles.promptBox}>
                      <div className={styles.promptHeader}>
                        <span className={`${styles.promptBadge} ${styles.architectHeader}`}>Architect Agent</span>
                        <span className={styles.promptHelper}>Plans the structured interview syllabus from job description/input</span>
                      </div>
                      <textarea
                        className={styles.promptTextarea}
                        value={formArchitectPrompt}
                        onChange={(e) => setFormArchitectPrompt(e.target.value)}
                        placeholder="Architect Agent System prompt instructions..."
                      />
                    </div>

                    {/* Prompt Box 1: Interviewer */}
                    <div className={styles.promptBox}>
                      <div className={styles.promptHeader}>
                        <span className={`${styles.promptBadge} ${styles.interviewerHeader}`}>Interviewer Agent</span>
                        <span className={styles.promptHelper}>Directs persona behavior & conversation</span>
                      </div>
                      <textarea
                        className={styles.promptTextarea}
                        value={formInterviewerPrompt}
                        onChange={(e) => setFormInterviewerPrompt(e.target.value)}
                        placeholder="Interviewer Agent System prompt instructions..."
                      />
                    </div>

                    {/* Prompt Box 2: Evaluator */}
                    <div className={styles.promptBox}>
                      <div className={styles.promptHeader}>
                        <span className={`${styles.promptBadge} ${styles.evaluatorHeader}`}>Evaluator Agent</span>
                        <span className={styles.promptHelper}>Calculates accuracy scoring & technical criteria</span>
                      </div>
                      <textarea
                        className={styles.promptTextarea}
                        value={formEvaluatorPrompt}
                        onChange={(e) => setFormEvaluatorPrompt(e.target.value)}
                        placeholder="Evaluator Agent System prompt instructions..."
                      />
                    </div>

                    {/* Prompt Box 3: Coach */}
                    <div className={styles.promptBox}>
                      <div className={styles.promptHeader}>
                        <span className={`${styles.promptBadge} ${styles.coachHeader}`}>Coach Agent</span>
                        <span className={styles.promptHelper}>Provides psychology and structure guidance</span>
                      </div>
                      <textarea
                        className={styles.promptTextarea}
                        value={formCoachPrompt}
                        onChange={(e) => setFormCoachPrompt(e.target.value)}
                        placeholder="Coach Agent System prompt instructions..."
                      />
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <CoursesIcon size={64} />
                </div>
                <h3 className={styles.emptyStateTitle}>No Course Selected</h3>
                <p className={styles.emptyStateText}>
                  Please choose a career course from the left menu or click "+ Add Course" to configure a zero-code AI Prompt system.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
