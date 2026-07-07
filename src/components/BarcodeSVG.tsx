import React from "react";

interface BarcodeSVGProps {
  value: string;
  lightMode?: boolean;
}

export default function BarcodeSVG({ value, lightMode = false }: BarcodeSVGProps) {
  // Simple deterministic pattern generator based on the text string
  const getPattern = (str: string) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    
    const bars: boolean[] = [];
    // Standard barcode start character sequence (11010010000 approx)
    bars.push(true, false, true, true, false, false, true);
    
    // Generate middle bars based on hash bits
    for (let i = 0; i < 30; i++) {
      const bit = (hash >> (i % 31)) & 1;
      if (bit === 1) {
        bars.push(true, true, false, false);
      } else {
        bars.push(true, false, false, true);
      }
    }
    
    // Stop character sequence
    bars.push(true, true, false, true, true, false, true);
    return bars;
  };

  const pattern = getPattern(value);

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 ${
      lightMode 
        ? "bg-white border-slate-200 text-slate-900 shadow-sm" 
        : "bg-zinc-950/80 border-[#00FF41]/30 text-white shadow-[0_0_15px_rgba(0,255,65,0.1)]"
    }`}>
      <svg 
        viewBox={`0 0 ${pattern.length * 2.5} 60`} 
        className="w-full h-12 max-h-[48px]"
        preserveAspectRatio="none"
      >
        <g fill={lightMode ? "#0f172a" : "#00FF41"}>
          {pattern.map((isBar, index) => {
            if (isBar) {
              return (
                <rect
                  key={index}
                  x={index * 2.5}
                  y={0}
                  width={2.5}
                  height={60}
                />
              );
            }
            return null;
          })}
        </g>
      </svg>
      <span className={`font-mono text-[10px] tracking-widest mt-2 font-bold ${
        lightMode ? "text-slate-600" : "text-[#00FF41]"
      }`}>
        *{value}*
      </span>
    </div>
  );
}
