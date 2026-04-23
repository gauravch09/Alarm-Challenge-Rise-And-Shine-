"use client"

import { useEffect, useRef } from 'react';

export function MouseFollower() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const mouse = { x: 0, y: 0 };
    const dots: { x: number; y: number }[] = [];
    const numDots = 15;

    // Initialize dots
    for (let i = 0; i < numDots; i++) {
      dots.push({ x: 0, y: 0 });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    handleResize();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let x = mouse.x;
      let y = mouse.y;

      // Draw and update dots
      dots.forEach((dot, index) => {
        // Smooth interpolation for "motion" feel
        dot.x += (x - dot.x) * 0.4;
        dot.y += (y - dot.y) * 0.4;

        x = dot.x;
        y = dot.y;

        const size = (numDots - index) * 1.2;
        const opacity = 1 - index / numDots;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        
        // Use primary color from CSS variables (approximate HSL)
        ctx.fillStyle = `hsla(217, 100%, 57%, ${opacity * 0.4})`;
        ctx.fill();
        
        // Add a small inner glow
        if (index === 0) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] hidden md:block transition-opacity duration-1000"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
