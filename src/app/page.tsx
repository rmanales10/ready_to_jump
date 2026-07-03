'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';


export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate beautiful micro-animation delay
    setTimeout(() => {
      if (username.trim() === 'admin@gmail.com' && password === 'admin123') {
        setLoading(false);
        router.push('/dashboard');
      } else {
        setLoading(false);
        setError('Invalid username or password');
      }
    }, 800);
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
                  type="password"
                  placeholder="Password"
                  className={styles.inputField}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
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
