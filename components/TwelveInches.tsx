'use client';

export default function TwelveInches() {
  return (
    <div className="inches-moment">
      <div className="inches-inner">

        {/* ── Left: "12 inches." ──────────────────────── */}
        <div className="inches-left-text">
          <div className="inches-unit">12 inches.</div>
        </div>

        {/* ── Centre: scene ───────────────────────────── */}
        <div className="inches-scene">

          {/* Brain */}
          <div className="inches-organ brain-anim">
            <div className="organ-pulse-ring" />
            <div className="organ-pulse-ring ring-2" />
            <div className="organ-connect-ring" />
            <svg className="organ-svg organ-svg-lg" viewBox="0 0 120 104" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60,90 C36,90 16,75 13,57 C10,41 18,27 32,23 C29,13 36,6 45,6 C51,6 56,10 58,16 C60,11 64,8 70,8 C79,8 86,15 86,24 C93,22 102,27 104,36 C108,49 100,62 90,66 C93,74 89,83 81,86 C74,89 65,86 61,81 C60,86 60,90 60,90 Z"
                stroke="#AC3438" strokeWidth="2" fill="rgba(172,52,56,0.08)" strokeLinejoin="round"/>
              <path d="M60,90 C64,90 66,88 68,84 C72,80 74,74 73,68"
                stroke="#AC3438" strokeWidth="1.2" fill="none" opacity="0.4"/>
              <line x1="60" y1="19" x2="60" y2="86" stroke="#AC3438" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.45"/>
              <path d="M26,46 C33,40 35,52 27,54" stroke="#AC3438" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75"/>
              <path d="M20,63 C29,57 31,70 22,72" stroke="#AC3438" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75"/>
              <path d="M38,78 C45,73 46,82 39,83" stroke="#AC3438" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.55"/>
              <path d="M80,48 C73,42 72,53 79,55" stroke="#AC3438" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75"/>
              <path d="M87,65 C78,59 77,71 86,73" stroke="#AC3438" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75"/>
              <path d="M50,89 L49,98 Q60,103 71,98 L70,89" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.1)" strokeLinejoin="round"/>
            </svg>
            <span className="organ-label">Mind</span>
          </div>

          {/* Vertical wire */}
          <svg className="inches-wire-v" viewBox="0 0 60 180" preserveAspectRatio="xMidYMid meet">
            <line x1="30" y1="0" x2="30" y2="72" stroke="#AC3438" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.35"/>
            <line x1="30" y1="108" x2="30" y2="180" stroke="#AC3438" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.35"/>
            <path id="ekg" d="M 30,72 L 30,84 L 22,84 L 26,70 L 30,100 L 34,76 L 38,84 L 30,84 L 30,108"
              stroke="#AC3438" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <text x="44" y="92" fontFamily="'Cinzel',serif" fontSize="7" fill="#AC3438" opacity="0.55" letterSpacing="1">12 in</text>
            <circle r="4.5" fill="#AC3438" opacity="0.9">
              <animateMotion dur="2s" repeatCount="indefinite" calcMode="linear">
                <mpath href="#ekg" />
              </animateMotion>
            </circle>
            <circle r="2.5" fill="#AC3438" opacity="0.4">
              <animateMotion dur="2s" repeatCount="indefinite" begin="1s" calcMode="linear">
                <mpath href="#ekg" />
              </animateMotion>
            </circle>
          </svg>

          {/* Heart — anatomical anterior view */}
          <div className="inches-organ heart-anim">
            <div className="organ-pulse-ring" />
            <div className="organ-pulse-ring ring-2" />
            <div className="organ-connect-ring heart-connect" />
            <svg className="organ-svg organ-svg-lg" viewBox="0 0 120 124" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* main body */}
              <path d="M 56,20 C 50,14 42,12 36,16 C 26,22 16,36 16,52 C 16,68 24,82 40,92 C 46,98 50,108 52,116 C 54,108 62,98 72,90 C 84,80 98,66 102,50 C 106,34 100,20 88,16 C 82,12 74,12 68,16 C 64,20 60,22 56,20 Z"
                stroke="#AC3438" strokeWidth="2.2" fill="rgba(172,52,56,0.12)" strokeLinejoin="round"/>
              {/* aortic arch */}
              <path d="M 48,18 C 44,6 32,0 24,6 C 16,12 18,26 28,28 C 32,30 36,26 36,22"
                stroke="#AC3438" strokeWidth="3" strokeLinecap="round" fill="none"/>
              {/* pulmonary trunk */}
              <path d="M 66,16 C 70,4 82,0 88,8 C 90,12 86,20 80,20"
                stroke="#AC3438" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              {/* superior vena cava */}
              <path d="M 92,28 C 98,20 110,22 112,34"
                stroke="#AC3438" strokeWidth="2" strokeLinecap="round" fill="none"/>
              {/* interventricular groove */}
              <path d="M 58,24 C 66,44 68,76 52,116"
                stroke="#AC3438" strokeWidth="1" strokeDasharray="2 3" opacity="0.45" fill="none"/>
              {/* left anterior descending coronary artery */}
              <path d="M 54,26 C 52,54 50,82 52,110"
                stroke="#AC3438" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55"/>
              {/* left circumflex artery */}
              <path d="M 32,22 C 18,36 14,58 20,76"
                stroke="#AC3438" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.5"/>
              {/* right coronary artery */}
              <path d="M 80,20 C 96,34 102,56 90,74"
                stroke="#AC3438" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.5"/>
              {/* left atrium hint (top-left surface) */}
              <path d="M 22,44 C 18,38 20,30 28,28"
                stroke="#AC3438" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
            </svg>
            <span className="organ-label">Heart</span>
          </div>

        </div>

        {/* ── Right: subtitle + truth ─────────────────── */}
        <div className="inches-text-col">
          <div className="inches-divider" />
          <div className="inches-subtitle">The longest journey a human will ever take.</div>
          <div className="inches-truth">From the mind — to the heart.</div>
        </div>

      </div>
    </div>
  );
}
