import React, { useEffect, useState } from 'react';
import './TachPayLoadingDialog.css';

const TachPayLoadingDialog = ({
  message = 'Chargement de vos informations de paiement...',
  progress = null,
  size = 180,
}) => {
  const [colorIndex, setColorIndex] = useState(0);
  const colors = ['#ffffff', '#3b82f6', '#f59e0b'];

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [colors]);

  const bgStyle = {
    backgroundColor: colors[colorIndex],
  };

  const circleRadius = size / 2 - 20;
  const circumference = 2 * Math.PI * circleRadius;

  return (
    <div className="tachpay-loading-dialog" style={bgStyle}>
      <div
        className="tachpay-loading-circle"
        style={{
          width: size,
          height: size,
          padding: 20,
        }}
      >
        {progress !== null ? (
          <svg
            className="tachpay-loading-progress"
            width={size}
            height={size}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff40" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <circle
              className="tachpay-progress-track"
              cx={size / 2}
              cy={size / 2}
              r={circleRadius}
              strokeWidth={3}
            />
            <circle
              className="tachpay-progress-fill"
              cx={size / 2}
              cy={size / 2}
              r={circleRadius}
              strokeWidth={3}
              stroke="url(#progress-gradient)"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            className="tachpay-loading-progress tachpay-load-anim"
            width={size}
            height={size}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="anim-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff60" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <circle
              className="tachpay-progress-track"
              cx={size / 2}
              cy={size / 2}
              r={circleRadius}
              strokeWidth={3}
            />
            <circle
              className="tachpay-progress-fill"
              cx={size / 2}
              cy={size / 2}
              r={circleRadius}
              strokeWidth={3}
              stroke="url(#anim-gradient)"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.3}
            />
            <g
              className="tachpay-progress-arrow"
              transform={`translate(${size / 2}, ${size / 2 - circleRadius})`}
            >
              <polygon points="-8,-12 8,-12 0,2" />
            </g>
          </svg>
        )}
        <div
          className="tachpay-loading-logo"
          style={{
            width: size - 40,
            height: size - 40,
            marginTop: size / 2 - (size - 40) / 2 - 2,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <img
            src="/assets/TachPay-logo.png"
            alt="TachPay"
            className="tachpay-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent && !parent.querySelector('.tachpay-logo-fallback')) {
                const fallback = document.createElement('span');
                fallback.className = 'tachpay-logo-fallback';
                fallback.textContent = 'TachPay';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>
      </div>
      <p className="tachpay-loading-message">
        {message}
        <span className="tachpay-loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </p>
    </div>
  );
};

export default TachPayLoadingDialog;
