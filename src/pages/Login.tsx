import React, { useState } from 'react';
import { ChevronRight, Lock, User, AlertCircle } from 'lucide-react';
import StaggeredText from '../components/StaggeredText';
import GridScan from '../components/GridScan';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      // Single Admin Credentials Check
      if (
        (username.trim().toLowerCase() === 'admin' && password.trim() === 'admin') ||
        (username.trim().toLowerCase() === 'admin' && password.trim() === 'admin123') ||
        (username.trim().toLowerCase() === 'admin' && password.trim() === 'password')
      ) {
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setErrorMsg('Invalid Username or Password. Please try admin / admin.');
      }
    }, 400);
  };

  const handleQuickFillAdmin = () => {
    setUsername('admin');
    setPassword('admin');
    setErrorMsg('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
        color: '#ffffff',
        padding: '20px',
        overflow: 'hidden'
      }}
    >
      {/* GridScan — WebGL animated background */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#2F293A"
          gridScale={0.1}
          scanColor="#FF9FFC"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Main Split Login Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px',
          maxWidth: '850px',
          width: '100%',
          padding: '40px 20px',
          zIndex: 1,
          flexWrap: 'wrap'
        }}
      >
        {/* LEFT SECTION: Logo & Brand Name */}
        <div
          style={{
            flex: '1',
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-center',
            justifyContent: 'center',
            textAlign: 'center',
            paddingRight: '10px'
          }}
        >
          {/* Logo with Dotted Accent Circle matching reference image */}
          <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto 16px' }}>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                zIndex: 2
              }}
            >
              <StaggeredText
                text="GLOBAL MINDS"
                staggerMs={55}
                initialDelayMs={80}
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  color: '#ffffff'
                }}
              />

            </div>
          </div>

          <a
            href="#create-account"
            onClick={(e) => {
              e.preventDefault();
              handleQuickFillAdmin();
            }}
            style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.85)',
              textDecoration: 'none',
              marginTop: '12px',
              fontWeight: 500,
              transition: 'opacity 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.85'}
          >
            Create New Account
          </a>
        </div>

        {/* VERTICAL DIVIDER LINE */}
        <div
          style={{
            width: '1px',
            height: '240px',
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            display: 'block'
          }}
          className="login-divider"
        />

        {/* RIGHT SECTION: Sign In Form */}
        <div
          style={{
            flex: '1',
            minWidth: '280px',
            maxWidth: '360px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 600,
              marginBottom: '20px',
              color: '#ffffff',
              letterSpacing: '0.2px'
            }}
          >
            Sign In
          </h2>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Username Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="User Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: '0 0 0 0px transparent',
                  backdropFilter: 'blur(6px)'
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: '0 0 0 0px transparent',
                  backdropFilter: 'blur(6px)'
                }}
              />
            </div>

            {/* Error Message if Login Fails */}
            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#fca5a5',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Forgot Password Link & Login Submit Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px'
              }}
            >
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Default Admin Credentials:\nUsername: admin\nPassword: admin');
                }}
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontWeight: 400
                }}
              >
                Forgot Password
              </a>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'opacity 0.2s ease',
                  padding: 0,
                  marginLeft: 'auto'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span>{isLoading ? 'Signing in...' : 'Login'}</span>
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>

          </form>

          {/* Quick Admin Credentials Helper Tag */}
          <div
            style={{
              marginTop: '20px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={handleQuickFillAdmin}
          >
          </div>

        </div>
      </div>

      {/* BOTTOM RIGHT FOOTER LINKS matching reference image */}
      <footer
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '32px',
          fontSize: '13px',
          fontStyle: 'italic',
          color: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          gap: '10px'
        }}
      >
        <span>About us</span>
        <span>|</span>
        <span>Contact</span>
        <span>|</span>
        <span>Help</span>
      </footer>

      {/* Responsive Style for small screens */}
      <style>{`
        @media (max-width: 680px) {
          .login-divider {
            display: none !important;
          }
        }
        input::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }
      `}</style>
    </div>
  );
};

export default Login;
