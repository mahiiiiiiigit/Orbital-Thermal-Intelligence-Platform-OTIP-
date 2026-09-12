import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingHowItWorks } from './LandingHowItWorks';
import { LandingUseCases } from './LandingUseCases';
import { LandingLivePreview } from './LandingLivePreview';
import { LandingCTA } from './LandingCTA';
import { LandingFooter } from './LandingFooter';

export function LandingPage({ onLaunchDashboard, onNavigateAnalytics }) {
  return (
    <div className="min-h-screen w-full bg-[#0c1119] text-slate-100 flex flex-col selection:bg-orange-500/30 selection:text-orange-200">
      {/* Sticky Space-Tech Navigation */}
      <LandingNavbar
        onLaunchDashboard={onLaunchDashboard}
        onNavigateAnalytics={onNavigateAnalytics}
      />

      {/* Main Landing Sections */}
      <main className="flex-1 w-full">
        {/* 1. Hero Section with 3D Orbital Canvas */}
        <LandingHero onLaunchDashboard={onLaunchDashboard} />

        {/* 2. Core Features Section */}
        <LandingFeatures />

        {/* 3. How It Works Pipeline Diagram */}
        <LandingHowItWorks />

        {/* 4. Domain Use Cases Section */}
        <LandingUseCases />

        {/* 5. Live Preview Mock Dashboard */}
        <LandingLivePreview onLaunchDashboard={onLaunchDashboard} />

        {/* 6. Call To Action Section */}
        <LandingCTA onLaunchDashboard={onLaunchDashboard} />
      </main>

      {/* 7. Footer */}
      <LandingFooter />
    </div>
  );
}
