import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import illustration from '../../../assets/illustration.png';
import './index.css';

/* ─── Stagger variants ─── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/* ═══════════════════════════════════════════ */
const LandingPage = () => {
  const glowCtrl = useAnimation();

  useEffect(() => {
    glowCtrl.start({
      scale: [1, 1.1, 1],
      opacity: [0.55, 1, 0.55],
      transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [glowCtrl]);

  return (
    <div className="lp-root">

      {/* ── NAVBAR ── */}
      <nav className="lp-nav">
        <motion.div
          className="lp-nav-inner"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Link to="/" className="lp-logo">
            <span className="lp-logo-leaf">🌿</span>
            Armor.ai
          </Link>

          <Link to="/login" className="lp-nav-cta">Login</Link>
        </motion.div>
      </nav>

      {/* ── HERO ── */}
      <div className="lp-hero">

        {/* BG watermark */}
        <div className="lp-bg-title">Armor.ai</div>

        {/* ── LEFT TEXT ── */}
        <motion.div className="lp-left" variants={stagger} initial="hidden" animate="show">

          <motion.div className="lp-tag" variants={fadeUp}>
            <span className="lp-tag-dot" />
            AI-Powered Finance
          </motion.div>

          <motion.h1 className="lp-title" variants={fadeUp}>
            Trade Smarter.<br />
            <span className="accent">Protect More.</span>
          </motion.h1>

          <motion.p className="lp-sub" variants={fadeUp}>
            Armor.ai uses advanced AI to detect risks, surface insights, and help you make better financial decisions — in real time.
          </motion.p>

          <motion.div className="lp-actions" variants={fadeUp}>
            <Link to="/signup" className="lp-btn-primary">
              Get Started
              <span className="lp-btn-arrow"><ArrowUpRight size={13} strokeWidth={2.5} /></span>
            </Link>
            <button className="lp-btn-secondary">See How It Works</button>
          </motion.div>

        </motion.div>

        {/* ── CENTER ILLUSTRATION ── */}
        <div className="lp-center">

          {/* Glow blob */}
          <motion.div className="lp-glow-ring" animate={glowCtrl} initial={{ opacity: 0.55, scale: 1 }} />

          {/* Illustration */}
          <motion.img
            src={illustration}
            alt="AI Finance Illustration"
            className="lp-illustration"
            initial={{ opacity: 0, scale: 0.86, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>



      </div>
    </div>
  );
};

export default LandingPage;
