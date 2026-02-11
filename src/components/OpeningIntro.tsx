export default function OpeningIntro() {
  return (
    <div className="intro-overlay" aria-hidden="true">
      <div className="intro-stage">
        <div className="velas">
          <div className="fuego" />
          <div className="fuego" />
          <div className="fuego" />
          <div className="fuego" />
          <div className="fuego" />
        </div>

        <svg
          id="cake-intro"
          width="220"
          height="220"
          viewBox="0 0 220 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="110" cy="178" rx="82" ry="18" fill="#d6d3f2" />
          <ellipse cx="110" cy="165" rx="74" ry="14" fill="#5a3b16" />
          <rect x="36" y="95" width="148" height="70" rx="34" fill="#6a4518" />
          <ellipse cx="110" cy="95" rx="74" ry="23" fill="#835621" />
          <path
            d="M44 96C44 78 176 77 176 96V111C176 123 164 133 151 133C141 133 135 126 135 118C135 108 127 103 117 103C107 103 99 108 99 118C99 126 93 133 83 133C70 133 58 123 58 111V96H44Z"
            fill="#f7f1df"
          />
          <ellipse cx="110" cy="95" rx="66" ry="18" fill="#fff9ea" />
        </svg>

        <p className="intro-text">Hear Me Out</p>
      </div>
    </div>
  );
}
