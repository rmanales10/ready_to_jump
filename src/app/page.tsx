'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { EyeIcon, EyeOffIcon } from '@/components/SVGIcons';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Clean PNG-based wave background graphics matching reference */}
      <img src="/wave-left.png?v=3" alt="Wave Left" className={styles.waveLeft} />

      <img src="/wave-right.png?v=3" alt="Wave Right" className={styles.waveRight} />

      <div className={styles.contentWrapper}>
        <div className={styles.leftColumn}>
          <div className={styles.brandLogo}>
            <img src="/logo.png" alt="ReadyToJump Logo" width={140} height={140} style={{ objectFit: 'contain' }} />
          </div>
          <h1 className={styles.heading}>
            Login into <br />
            your account
          </h1>
          <p className={styles.subheading}>Please log in your admin account</p>
        </div>

        <div className={styles.rightColumn}>
          <form className={styles.loginCard} onSubmit={handleSubmit}>
            <h2 className={styles.cardTitle}>Log in</h2>

            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Username"
                  className={styles.inputField}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className={`${styles.inputField} ${styles.passwordInput}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.togglePasswordButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              </div>
              
              {error && <span className={styles.errorText}>{error}</span>}
            </div>

            <button type="submit" className={styles.loginButton} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
