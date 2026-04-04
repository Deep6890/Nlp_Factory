import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import illustration from '../../../assets/illustration.png';
import './LandingPage.css';

/* ═══════════════════════════════════════════════════════════
   INLINE SVG COIN ICONS
   ═══════════════════════════════════════════════════════════ */
const CoinBTC = () => (
  <svg viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="18" fill="#F7931A" opacity="0.92" />
    <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">₿</text>
  </svg>
);

const CoinDollar = () => (
  <svg viewBox="0 0 40 40" width="36" height="36">
    <circle cx="20" cy="20" r="18" fill="#26A17B" opacity="0.92" />
    <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">$</text>
  </svg>
);

const CoinETH = () => (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <circle cx="20" cy="20" r="18" fill="#627EEA" opacity="0.92" />
    <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">Ξ</text>
  </svg>
);

const CoinShield = () => (
  <svg viewBox="0 0 40 40" width="32" height="32">
    <circle cx="20" cy="20" r="18" fill="#4A7C3F" opacity="0.92" />
    <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="bold">🛡</text>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   WORD-BY-WORD STAGGER — "Trade Smarter."
   Each word slides up with 80ms stagger between words
   ═══════════════════════════════════════════════════════════ */
const StaggerWords = ({ text, delayStart = 0.25 }) => {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="hero-word"
          initial={{ opacity: 0, y: 32, rotateX: -45 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            delay: delayStart + i * 0.08,
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   LETTER-BY-LETTER POP — "Protect More."
   Each letter pops in with scale + glow (#7DC842)
   ═══════════════════════════════════════════════════════════ */
const LetterPop = ({ text, delayStart = 0.85 }) => {
  return (
    <span className="accent letter-pop-wrapper">
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="letter-pop-char"
          style={{ '--i': i }}
          initial={{ opacity: 0, y: 20, scale: 0.4 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: delayStart + i * 0.055,
            duration: 0.38,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — Full Hero Section
   ═══════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const [borderHover, setBorderHover] = useState(false);

  /* ── Mouse-tracking 3D tilt for illustration (max 5deg) ── */
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const illustrationRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!illustrationRef.current) return;
    const rect = illustrationRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxDeg = 5;
    const rotateY = ((e.clientX - cx) / (rect.width / 2)) * maxDeg;
    const rotateX = -((e.clientY - cy) / (rect.height / 2)) * maxDeg;
    setTilt({
      x: Math.max(-maxDeg, Math.min(maxDeg, rotateX)),
      y: Math.max(-maxDeg, Math.min(maxDeg, rotateY)),
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  /* ── Parallax scroll — illustration at 0.85x speed ── */
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const illustrationY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div
      className="lp-root"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={heroRef}
    >

      {/* ══════════════════════════════════════════
          BACKGROUND EFFECTS
          ══════════════════════════════════════════ */}

      {/* (6) Morphing lime green blob */}
      <div className="lp-bg-blobs">
        <div className="lp-morph-blob" />
      </div>

      {/* (7) Dot-grid pattern overlay */}
      <div className="lp-dot-grid" />

      {/* ══════════════════════════════════════════
          NAVBAR — slide-down fade-in on load
          ══════════════════════════════════════════ */}
      <nav className="lp-nav">
        <motion.div
          className="lp-nav-inner"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="lp-logo">
            <span className="lp-logo-icon">🌿</span>
            Armor.ai
          </Link>

          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>

          <Link to="/login" className="lp-nav-cta">Login</Link>
        </motion.div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════ */}
      <div className="lp-hero">

        {/* Background watermark */}
        <div className="lp-bg-title">Armor.ai</div>

        {/* ── LEFT SIDE — Hero content ── */}
        <div className="lp-left">

          <motion.div
            className="lp-tag"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="lp-tag-dot" />
            AI-POWERED FINANCE
          </motion.div>

          <motion.h1
            className="lp-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.01, delay: 0.2 }}
          >
            <StaggerWords text="Trade Smarter." delayStart={0.25} />
            <br />
            <LetterPop text="Protect More." delayStart={0.85} />
          </motion.h1>

          <motion.p
            className="lp-sub"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Armor.ai uses advanced AI to detect risks, surface insights,
            and help you make better financial decisions — in real time.
          </motion.p>

          <motion.div
            className="lp-actions"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to="/signup" className="lp-btn-primary" id="hero-get-started">
              Get Started
              <span className="lp-btn-arrow">
                <ArrowUpRight size={13} strokeWidth={2.5} />
              </span>
            </Link>

            <motion.button
              className={`lp-btn-secondary lp-btn-border-draw ${borderHover ? 'is-hovered' : ''}`}
              onMouseEnter={() => setBorderHover(true)}
              onMouseLeave={() => setBorderHover(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
              id="hero-see-how"
            >
              <span className="lp-btn-border-draw-text">See How It Works</span>
              <svg className="lp-btn-border-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
                <rect
                  className="lp-btn-border-rect"
                  x="1" y="1" width="198" height="54"
                  rx="28" ry="28"
                  fill="none"
                  strokeWidth="2"
                />
              </svg>
            </motion.button>
          </motion.div>

        </div>

        {/* ══════════════════════════════════════════
            RIGHT SIDE — Illustration + effects
            ══════════════════════════════════════════ */}
        <motion.div
          className="lp-right"
          ref={illustrationRef}
          style={{ y: illustrationY }}
        >

          {/* (5) Illustration — slides in from right with spring */}
          <motion.div
            className="lp-illust-wrapper"
            initial={{ opacity: 0, x: 120, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 60,
              damping: 18,
              mass: 1,
              delay: 0.3,
            }}
          >
            {/* (1) Float animation + (2) 3D tilt via mouse */}
            <div
              className="lp-illust-tilt lp-illust-float"
              style={{
                transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              }}
            >
              <img
                src={illustration}
                alt="AI Finance Robot Illustration"
                className="lp-illustration"
              />

              {/* (4) Chat bubble with typing indicator */}
              <div className="lp-chat-bubble">
                <div className="lp-typing-dots">
                  <span className="lp-dot lp-dot-1" />
                  <span className="lp-dot lp-dot-2" />
                  <span className="lp-dot lp-dot-3" />
                </div>
              </div>
            </div>

            {/* (3) Coin icons — orbiting around illustration */}
            <div className="lp-orbit-container">
              <div className="lp-orbit-coin lp-orbit-1"><CoinBTC /></div>
              <div className="lp-orbit-coin lp-orbit-2"><CoinDollar /></div>
              <div className="lp-orbit-coin lp-orbit-3"><CoinETH /></div>
              <div className="lp-orbit-coin lp-orbit-4"><CoinShield /></div>
            </div>
          </motion.div>

        </motion.div>

      </div>

      {/* ══════════════════════════════════════════
          (9) Bouncing chevron-down scroll indicator
          ══════════════════════════════════════════ */}
      <motion.div
        className="lp-scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <ChevronDown size={22} strokeWidth={2} className="lp-chevron-bounce" />
      </motion.div>

    </div>
  );
};

export default LandingPage;
