import React, { useEffect, useRef } from 'react';

export function GlobeCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let rotation = 0;
    let satAngle1 = 0;
    let satAngle2 = Math.PI / 2;

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Generate globe points (Fibonacci sphere)
    const numPoints = 280;
    const points = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      // Assign thermal intensity to some points
      const isThermalHotspot = i % 18 === 0 || i % 29 === 0;
      const heatIntensity = isThermalHotspot ? 0.6 + Math.random() * 0.4 : 0;

      points.push({ x, y, z, isThermalHotspot, heatIntensity });
    }

    // Render loop
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const globeRadius = Math.min(width, height) * 0.38;

      ctx.clearRect(0, 0, width, height);

      // 1. Radial atmospheric space glow behind the globe
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        globeRadius * 0.2,
        centerX,
        centerY,
        globeRadius * 1.5
      );
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      glowGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.08)');
      glowGrad.addColorStop(1, 'rgba(12, 17, 25, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Outer Orbital Rings
      ctx.save();
      ctx.translate(centerX, centerY);

      // Ring 1 (Equatorial / Tilted Orbit - VIIRS SNPP)
      ctx.beginPath();
      ctx.ellipse(0, 0, globeRadius * 1.35, globeRadius * 0.48, Math.PI / 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();

      // Ring 2 (Polar Orbit - MODIS Aqua/Terra)
      ctx.beginPath();
      ctx.ellipse(0, 0, globeRadius * 1.42, globeRadius * 0.42, -Math.PI / 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      ctx.restore();

      // 3. Render Globe Points with 3D rotation
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      // Sort points from back to front for proper depth rendering
      const projected = points.map((p) => {
        // Rotate around Y axis
        const xRot = p.x * cosR - p.z * sinR;
        const zRot = p.z * cosR + p.x * sinR;
        const yRot = p.y;

        // Apply slight tilt on X axis (orbital inclination)
        const tilt = 0.25;
        const yTilted = yRot * Math.cos(tilt) - zRot * Math.sin(tilt);
        const zTilted = zRot * Math.cos(tilt) + yRot * Math.sin(tilt);

        return {
          px: centerX + xRot * globeRadius,
          py: centerY + yTilted * globeRadius,
          pz: zTilted,
          isThermalHotspot: p.isThermalHotspot,
          heatIntensity: p.heatIntensity,
        };
      });

      projected.sort((a, b) => a.pz - b.pz);

      // Draw points
      projected.forEach((p) => {
        const isFront = p.pz > -0.15;
        const depthAlpha = Math.max(0.1, (p.pz + 1) / 2);

        ctx.beginPath();
        const baseSize = isFront ? (p.pz > 0.4 ? 2.6 : 1.8) : 1.2;
        ctx.arc(p.px, p.py, baseSize, 0, Math.PI * 2);

        if (p.isThermalHotspot && isFront) {
          // Glowing thermal anomaly marker
          const pulse = (Math.sin(Date.now() * 0.005 + p.px) + 1) / 2;
          ctx.fillStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
          ctx.fill();

          // Outer pulse wave ring
          ctx.beginPath();
          ctx.arc(p.px, p.py, baseSize + 4 + pulse * 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(249, 115, 22, ${0.4 - pulse * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Standard geospatial grid node
          ctx.fillStyle = isFront
            ? `rgba(56, 189, 248, ${depthAlpha * 0.8})`
            : `rgba(100, 116, 139, ${depthAlpha * 0.3})`;
          ctx.fill();
        }
      });

      // 4. Render Satellite 1 (VIIRS Orbit)
      const sat1Dist = globeRadius * 1.35;
      const s1X = centerX + Math.cos(satAngle1) * sat1Dist * Math.cos(Math.PI / 6) - Math.sin(satAngle1) * (globeRadius * 0.48) * Math.sin(Math.PI / 6);
      const s1Y = centerY + Math.cos(satAngle1) * sat1Dist * Math.sin(Math.PI / 6) + Math.sin(satAngle1) * (globeRadius * 0.48) * Math.cos(Math.PI / 6);

      // Satellite Scan Cone
      const coneGrad = ctx.createRadialGradient(s1X, s1Y, 2, centerX, centerY, globeRadius);
      coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.beginPath();
      ctx.moveTo(s1X, s1Y);
      ctx.lineTo(centerX - 40, centerY - 20);
      ctx.lineTo(centerX + 40, centerY + 20);
      ctx.closePath();
      ctx.fillStyle = coneGrad;
      ctx.fill();

      // Satellite Icon
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s1X, s1Y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Satellite Tag
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.fillText('NOAA-20 VIIRS [NRT]', s1X + 8, s1Y - 4);

      // 5. Render Satellite 2 (MODIS Thermal Orbit)
      const sat2Dist = globeRadius * 1.42;
      const s2X = centerX + Math.cos(satAngle2) * sat2Dist * Math.cos(-Math.PI / 3) - Math.sin(satAngle2) * (globeRadius * 0.42) * Math.sin(-Math.PI / 3);
      const s2Y = centerY + Math.cos(satAngle2) * sat2Dist * Math.sin(-Math.PI / 3) + Math.sin(satAngle2) * (globeRadius * 0.42) * Math.cos(-Math.PI / 3);

      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s2X, s2Y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(249, 115, 22, 0.9)';
      ctx.fillText('TERRA MODIS [IR-FRP]', s2X + 8, s2Y + 12);

      // Increment rotations
      rotation += 0.0035;
      satAngle1 += 0.012;
      satAngle2 += 0.009;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      <canvas ref={canvasRef} className="w-full h-full max-w-[650px] max-h-[650px]" />
    </div>
  );
}
