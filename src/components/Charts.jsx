import React, { useState, useRef, useEffect } from 'react';

// 1. SPARKLINE CHART (For coin list cards and columns)
export const Sparkline = ({ data = [], isPositive = true, width = 120, height = 40 }) => {
  if (data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height * 0.8 - height * 0.1; // pad 10%
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Monochrome Luxury Palette: positive light grey-green, negative light grey-red
  const strokeColor = isPositive ? '#D4FFD6' : '#FFB5B5';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

// 2. INTERACTIVE AREA CHART (For main dashboards and coin detail grids)
export const AreaChart = ({ data = [], height = 300 }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [containerWidth, setContainerWidth] = useState(500);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      setContainerWidth(containerRef.current.clientWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (data.length === 0) return <div className="h-full flex items-center justify-center text-slate-500">No data</div>;

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
  const padding = height * 0.15;
  const chartHeight = height - padding * 2;

  const points = data.map((d, index) => {
    const x = (index / (data.length - 1)) * containerWidth;
    const y = height - ((d.value - minVal) / range) * chartHeight - padding;
    return { x, y, value: d.value, label: d.label };
  });

  const pathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaString = `${pathString} L ${containerWidth} ${height} L 0 ${height} Z`;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / containerWidth;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(percent * (data.length - 1))));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const selectedPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div 
      ref={containerRef} 
      className="relative select-none" 
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg width={containerWidth} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padding + p * chartHeight;
          return (
            <line 
              key={i} 
              x1="0" 
              y1={y} 
              x2={containerWidth} 
              y2={y} 
              stroke="rgba(255, 255, 255, 0.04)" 
              strokeDasharray="4 4" 
            />
          );
        })}

        {/* X Grid Lines */}
        {[0.2, 0.4, 0.6, 0.8].map((p, i) => {
          const x = p * containerWidth;
          return (
            <line 
              key={i} 
              x1={x} 
              y1="0" 
              x2={x} 
              y2={height} 
              stroke="rgba(255, 255, 255, 0.02)" 
            />
          );
        })}

        {/* Main Area Path */}
        <path d={areaString} fill="url(#chart-area-grad)" />

        {/* Main Outline Stroke */}
        <path 
          d={pathString} 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Interactive hover guides */}
        {selectedPoint && (
          <>
            {/* Vertical guide line */}
            <line 
              x1={selectedPoint.x} 
              y1="0" 
              x2={selectedPoint.x} 
              y2={height} 
              stroke="rgba(255, 255, 255, 0.15)" 
              strokeDasharray="3 3" 
            />
            {/* Intersection point glow */}
            <circle 
              cx={selectedPoint.x} 
              cy={selectedPoint.y} 
              r="6" 
              fill="#FFFFFF" 
              fillOpacity="0.3" 
            />
            <circle 
              cx={selectedPoint.x} 
              cy={selectedPoint.y} 
              r="3" 
              fill="#FFFFFF" 
              stroke="#0B0B0B" 
              strokeWidth="1.5" 
            />
          </>
        )}
      </svg>

      {/* Floating HTML Tooltip */}
      {selectedPoint && (
        <div 
          className="absolute z-10 p-2.5 rounded-lg glass-panel text-xs pointer-events-none shadow-xl border border-white/5"
          style={{
            left: Math.min(containerWidth - 140, Math.max(10, selectedPoint.x - 70)),
            top: Math.max(10, selectedPoint.y - 65)
          }}
        >
          <div className="text-slate-400 font-medium mb-0.5">{selectedPoint.label}</div>
          <div className="text-white font-bold text-sm">
            ${selectedPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. CANDLESTICK CHART (For full CoinDetails view)
export const CandlestickChart = ({ data = [], height = 300 }) => {
  const [containerWidth, setContainerWidth] = useState(500);
  const [hoverData, setHoverData] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      setContainerWidth(containerRef.current.clientWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (data.length === 0) return <div className="h-full flex items-center justify-center text-slate-500">No data</div>;

  const minLow = Math.min(...data.map(d => d.low));
  const maxHigh = Math.max(...data.map(d => d.high));
  const range = maxHigh - minLow === 0 ? 1 : maxHigh - minLow;
  const padding = height * 0.15;
  const chartHeight = height - padding * 2;

  const candleCount = data.length;
  const candleSpacing = containerWidth / candleCount;
  const candleWidth = candleSpacing * 0.7;

  const getCoordinates = (val) => {
    return height - ((val - minLow) / range) * chartHeight - padding;
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const candleIndex = Math.max(0, Math.min(candleCount - 1, Math.floor(x / candleSpacing)));
    setHoverData(data[candleIndex]);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative select-none w-full" 
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverData(null)}
    >
      <svg width={containerWidth} height={height}>
        {/* Horizontal grids */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padding + p * chartHeight;
          return <line key={i} x1="0" y1={y} x2={containerWidth} y2={y} stroke="rgba(255,255,255,0.03)" />;
        })}

        {data.map((item, index) => {
          const isGreen = item.close >= item.open;
          const strokeColor = isGreen ? '#D4FFD6' : '#FFB5B5';
          
          const x = index * candleSpacing + candleSpacing / 2;
          const yHigh = getCoordinates(item.high);
          const yLow = getCoordinates(item.low);
          const yOpen = getCoordinates(item.open);
          const yClose = getCoordinates(item.close);
          
          const yRect = Math.min(yOpen, yClose);
          const rectHeight = Math.max(1.5, Math.abs(yOpen - yClose));

          return (
            <g key={index}>
              {/* Wick */}
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={strokeColor} strokeWidth="1" />
              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={yRect}
                width={candleWidth}
                height={rectHeight}
                fill={isGreen ? strokeColor : 'none'}
                stroke={strokeColor}
                strokeWidth={isGreen ? '0' : '1'}
                rx="1"
              />
            </g>
          );
        })}
      </svg>

      {/* Candlestick Tooltip overlay */}
      {hoverData && (
        <div className="absolute top-2 left-2 z-10 glass-panel p-2 rounded flex gap-4 text-[10px] text-slate-300 font-mono border border-white/5">
          <div>DATE: <span className="text-white">{hoverData.label}</span></div>
          <div>OPEN: <span className={hoverData.close >= hoverData.open ? "text-emerald-400" : "text-rose-300"}>${hoverData.open.toFixed(2)}</span></div>
          <div>HIGH: <span className="text-white">${hoverData.high.toFixed(2)}</span></div>
          <div>LOW: <span className="text-white">${hoverData.low.toFixed(2)}</span></div>
          <div>CLOSE: <span className={hoverData.close >= hoverData.open ? "text-emerald-400" : "text-rose-300"}>${hoverData.close.toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );
};

// 4. PORTFOLIO RADIAL DONUT CHART (For visual asset allocation summary)
export const PortfolioAllocationChart = ({ holdings = [], size = 200 }) => {
  if (holdings.length === 0) return <div className="text-slate-500">No holdings</div>;

  // Monochrome tones for segment slices (White, Silver, Greys)
  const colors = ['#FFFFFF', '#E5E5E5', '#CCCCCC', '#B3B3B3', '#999999', '#808080', '#666666'];
  const radius = size * 0.35;
  const strokeWidth = size * 0.08;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  const segments = holdings.map((h, i) => {
    const percent = h.value / totalValue;
    const strokeDashoffset = circumference - (percent * circumference);
    const prevValueSum = holdings.slice(0, i).reduce((sum, prev) => sum + prev.value, 0);
    const prevPercentSum = prevValueSum / totalValue;
    const rotationAngle = prevPercentSum * 360;

    return {
      ...h,
      percent,
      color: colors[i % colors.length],
      strokeDashoffset,
      rotationAngle
    };
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={seg.strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(${seg.rotationAngle} ${center} ${center})`}
            className="transition-all duration-500 ease-out"
          />
        ))}
      </svg>
      
      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center font-display text-center">
        <span className="text-xs text-slate-400 font-medium tracking-wide">TOTAL</span>
        <span className="text-base font-bold text-white leading-tight">
          ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
};
