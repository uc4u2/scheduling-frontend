// src/components/marketing/CloudHero.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Chip,
  Stack,
  Avatar,
  useTheme,
  alpha,
  Button,
} from "@mui/material";

/* ===========================
   Keyframes & shared styles
   =========================== */
const styles = {
  globeWrap: {
    position: "relative",
    width: "min(78vw, 640px)",
    aspectRatio: "1 / 1",
    marginInline: "auto",
  },
  rotateSlow: { animation: "sched-rotate 60s linear infinite" },
  float: { animation: "sched-float 8s ease-in-out infinite" },
  keyframes: `
  @keyframes sched-rotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes sched-float {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes sched-orbit {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes sched-pulse {
    0%, 100% { stroke-opacity: .16; }
    50%      { stroke-opacity: .34; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none!important; transition: none!important }
  }
  `,
};

/* ===========================
   Minimal, monochrome glyphs
   =========================== */
const ICONS = [
  // Cloud
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'>
      <path d='M18 38h28a8 8 0 0 0 1.4-15.9A14 14 0 0 0 20 14a14 14 0 0 0-13.2 9A10 10 0 0 0 18 38Z'
        fill='none' stroke='%23fff' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'/>
    </svg>`
  )}`,
  // Shield
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'>
      <path d='M32 6l18 6v14c0 12-8 22-18 26C22 48 14 38 14 26V12l18-6Z'
        fill='none' stroke='%23fff' stroke-width='3.2' stroke-linejoin='round'/>
    </svg>`
  )}`,
  // Card
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox='0 0 64 40' xmlns='http://www.w3.org/2000/svg'>
      <rect x='2' y='4' width='60' height='32' rx='4' fill='none' stroke='%23fff' stroke-width='3.2'/>
      <rect x='10' y='18' width='18' height='5' rx='2' fill='%23fff'/>
    </svg>`
  )}`,
  // Gear
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'>
      <g fill='none' stroke='%23fff' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'>
        <circle cx='32' cy='32' r='8'/>
        <path d='M32 10v7M32 47v7M10 32h7M47 32h7M16 16l5 5M43 43l5 5M16 48l5-5M43 21l5-5'/>
      </g>
    </svg>`
  )}`,
  // Users
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'>
      <g fill='none' stroke='%23fff' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'>
        <circle cx='24' cy='22' r='8'/><circle cx='44' cy='26' r='6'/>
        <path d='M10 48a14 14 0 0 1 28 0M34 48a10 10 0 0 1 20 0'/>
      </g>
    </svg>`
  )}`,
  // Graph
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'>
      <polyline points='8,44 22,32 35,38 54,18' fill='none' stroke='%23fff' stroke-width='3.2' stroke-linecap='round'/>
      <circle cx='22' cy='32' r='3' fill='%23fff'/><circle cx='35' cy='38' r='3' fill='%23fff'/>
      <circle cx='54' cy='18' r='3' fill='%23fff'/>
    </svg>`
  )}`,
];

/* ===========================
   Utilities
   =========================== */
function useCountUp(target = 0, durationMs = 1500, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / durationMs);
      setValue(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs]);
  return value;
}

function Stat({ label, to, suffix = "", delay = 0 }) {
  const ref = useRef(null);
  const [start, setStart] = useState(false);
  const value = useCountUp(to, 1500, start);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const id = setTimeout(() => setStart(true), delay);
          io.disconnect();
          return () => clearTimeout(id);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Stack ref={ref} direction="column" alignItems="center" sx={{ minWidth: 140, px: 2, py: 1.5 }}>
      <Typography variant="h3" fontWeight={800} lineHeight={1.1}>
        {value}
        {suffix}
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {label}
      </Typography>
    </Stack>
  );
}

function Slider({ items = [], intervalMs = 2800 }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!items.length) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs]);
  if (!items.length) return null;
  return (
    <Box
      sx={{
        overflow: "hidden",
        borderRadius: 3,
        border: (t) => `1px solid ${alpha(t.palette.common.white, 0.08)}`,
        backdropFilter: "blur(6px)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: `${items.length * 100}%`,
          transform: `translateX(-${(idx * 100) / items.length}%)`,
          transition: "transform 600ms ease",
        }}
      >
        {items.map((slide, i) => (
          <Box
            key={i}
            sx={{
              width: `${100 / items.length}%`,
              p: 3,
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: 2,
              alignItems: "center",
            }}
          >
            <Avatar
              src={slide.logo}
              alt={slide.title}
              sx={{ width: 48, height: 48, bgcolor: "transparent" }}
              variant="rounded"
            />
            <Box>
              <Typography fontWeight={700}>{slide.title}</Typography>
              <Typography variant="body2" color="text.secondary">{slide.caption}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* =========================================
   Layout & edges (curved, minimal, graceful)
   ========================================= */
function useNetworkLayout({ seed = 17, radius = 250 }) {
  // deterministic PRNG
  function rnd() {
    let t = (seed = (seed + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const nodes = useMemo(() => {
    // 6 nodes max, keep sizes consistent
    const positions = Array.from({ length: 6 }).map((_, i) => {
      const r = radius - 60 - rnd() * 50; // stay inside
      const angle = (i / 6) * Math.PI * 2 + rnd() * 0.35; // evenly spread with small jitter
      const size = 44; // uniform for seriousness
      const speed = 26 + rnd() * 12; // slower = calmer
      const phase = rnd() * 360;
      const icon = ICONS[i % ICONS.length];
      return { r, angle, size, speed, phase, icon, id: i };
    });
    return positions;
  }, [radius]);

  // connect as a ring + two chords for structure
  const edges = useMemo(() => {
    const e = [];
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const b = nodes[(i + 1) % nodes.length];
      e.push([a, b]);
    }
    // two diagonals
    if (nodes.length >= 4) {
      e.push([nodes[0], nodes[3]]);
      e.push([nodes[1], nodes[4]]);
    }
    return e;
  }, [nodes]);

  return { nodes, edges };
}

/* ===========================
   Main
   =========================== */
export default function CloudHero() {
  const theme = useTheme();
  const bg = theme.palette.background.default;
  const brandA = theme.palette.primary.main;
  const brandB = theme.palette.warning.main;

  const gradientBG = `
    radial-gradient(1100px 520px at 70% -10%, ${alpha(brandA, 0.22)}, transparent),
    radial-gradient(820px 360px at 10% 55%, ${alpha(brandB, 0.14)}, transparent)
  `;

  const { nodes, edges } = useNetworkLayout({ radius: 260 });

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        color: theme.palette.getContrastText(bg),
        pt: { xs: 8, md: 12 },
        pb: { xs: 8, md: 12 },
        backgroundImage: gradientBG,
      }}
    >
      <style>{styles.keyframes}</style>

      <Container maxWidth="lg">
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Chip
            label="All-in-one scheduling • payroll • e-commerce"
            color="warning"
            variant="filled"
            sx={{ fontWeight: 700 }}
          />
          <Typography variant="h2" fontWeight={900}>
            Launch your site. Get booked. Get paid.
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth={820}>
            Schedulaa gives every small business a blazing-fast website,
            Stripe-powered checkout, staff scheduling, payroll, and analytics — in minutes.
          </Typography>

          {/* ================== Network Globe ================== */}
          <Box sx={styles.globeWrap}>
            {/* soft inner vignette for depth */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                boxShadow: `inset 0 0 120px ${alpha("#000", 0.25)}`,
              }}
            />

            {/* subtle outer ring */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `1px solid ${alpha(brandA, 0.22)}`,
                ...styles.float,
              }}
            />

            {/* base geo lines (muted) */}
            <Box sx={{ position: "absolute", inset: 0, ...styles.rotateSlow }}>
              <svg viewBox="0 0 600 600" width="100%" height="100%">
                <defs>
                  <linearGradient id="geo" x1="0" x2="1">
                    <stop offset="0%" stopColor={alpha(brandB, 0.9)} />
                    <stop offset="100%" stopColor={alpha(brandA, 0.9)} />
                  </linearGradient>
                  {/* glow for nodes and lines */}
                  <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {[...Array(18)].map((_, i) => {
                  const a = (i / 18) * Math.PI * 2;
                  const r1 = 210, r2 = 255;
                  const x1 = 300 + r1 * Math.cos(a);
                  const y1 = 300 + r1 * Math.sin(a);
                  const x2 = 300 + r2 * Math.cos(a + Math.PI / 3.2);
                  const y2 = 300 + r2 * Math.sin(a + Math.PI / 3.2);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="url(#geo)"
                      strokeOpacity="0.18"
                    />
                  );
                })}
              </svg>
            </Box>

            {/* curved, pulsing connections */}
            <svg viewBox="0 0 600 600" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="edge" x1="0" x2="1">
                  <stop offset="0%" stopColor={alpha(brandB, 0.95)} />
                  <stop offset="100%" stopColor={alpha(brandA, 0.95)} />
                </linearGradient>
              </defs>
              {edges.map(([a, b], i) => {
                const ax = 300 + a.r * Math.cos(a.angle);
                const ay = 300 + a.r * Math.sin(a.angle);
                const bx = 300 + b.r * Math.cos(b.angle);
                const by = 300 + b.r * Math.sin(b.angle);
                // control point for a smooth arc via midpoint with slight offset
                const mx = (ax + bx) / 2;
                const my = (ay + by) / 2;
                const nx = -(by - ay);
                const ny = bx - ax;
                const k = 0.12; // curvature tightness
                const cx = mx + nx * k;
                const cy = my + ny * k;

                return (
                  <path
                    key={i}
                    d={`M ${ax},${ay} Q ${cx},${cy} ${bx},${by}`}
                    fill="none"
                    stroke="url(#edge)"
                    strokeWidth="2"
                    style={{
                      filter: "url(#softGlow)",
                      animation: `sched-pulse ${10 + (i % 4) * 2}s ease-in-out ${(i % 3) * 0.7}s infinite`,
                    }}
                    opacity={0.7}
                  />
                );
              })}
            </svg>

            {/* orbiting nodes (polished cards) */}
            {nodes.map((n) => (
              <Box
                key={n.id}
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: n.size,
                  height: n.size,
                  transformOrigin: "center 0",
                  transform: `translate(-50%, -50%) rotate(${n.phase}deg) translate(${n.r}px)`,
                  animation: `sched-orbit ${n.speed}s linear infinite`,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    transform: `rotate(${-n.phase}deg)`,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${alpha("#ffffff", 0.14)}, ${alpha(
                      "#ffffff",
                      0.06
                    )})`,
                    border: (t) => `1px solid ${alpha(t.palette.common.white, 0.22)}`,
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    boxShadow: `0 6px 24px ${alpha("#000", 0.28)}`,
                    backdropFilter: "blur(4px)",
                    filter: "url(#softGlow)",
                  }}
                >
                  <img
                    src={n.icon}
                    alt=""
                    width={n.size - 12}
                    height={n.size - 12}
                    style={{ display: "block", userSelect: "none" }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
          {/* ================== /Network Globe ================== */}

          {/* Stats */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 3 }}
            justifyContent="center"
            alignItems="center"
            sx={{ pt: 2 }}
          >
            <Stat label="cloud services" to={60} suffix="+" />
            <Stat label="threats blocked daily" to={190} suffix="B" delay={200} />
            <Stat label="websites protected" to={16} suffix="%" delay={400} />
            <Stat label="cities in our network" to={99} suffix="+" delay={600} />
          </Stack>

          {/* Highlights slider */}
          <Box sx={{ width: "100%", maxWidth: 960, mt: 4 }}>
            <Slider
              items={[
                {
                  logo: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
                  title: "Instant website with custom domain",
                  caption: "Publish a branded site in minutes. Connect your domain with a few clicks.",
                },
                {
                  logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/Stripe_Logo%2C_revised_2016.svg",
                  title: "Stripe checkout & subscriptions",
                  caption: "Sell services and products. Tips, coupons, refunds — all built-in.",
                },
                {
                  logo: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Material_UI_logo.svg",
                  title: "Scheduling, payroll, & HR",
                  caption: "Manage shifts, requests, and payroll exports (T4/W2/ROE) in one place.",
                },
              ]}
            />
          </Box>

          <Stack direction="row" spacing={2} sx={{ pt: 3 }}>
            <Button size="large" variant="contained">Start free</Button>
            <Button size="large" variant="outlined">See live demo</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
