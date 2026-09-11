import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  MapPin,
  Satellite,
  Flame,
  Trees,
  Sun,
  Moon,
  Bell,
  AlertTriangle,
  ShieldAlert,
  X,
  ChevronRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { REGIONS, SENSORS } from '../constants/taxonomy';

export function Navbar({
  mode = 'auto',
  onToggleMode,
  dataSource = 'firms', // 'firms' | 'fsi'
  onToggleDataSource,
  selectedRegion,
  onSelectRegion,
  selectedSensor,
  onSelectSensor,
  mapMode = 'hybrid',
  onSelectMapMode,
  theme = 'dark',
  onToggleTheme,
  onRefresh,
  loading = false,
  stats = { totalHotspots: 0, totalClusters: 0, totalAlerts: 0, avgFrp: 0 },
  alerts = [],
  hotspots = [],
  onSelectNotification,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState(() => new Set());
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  // Derive notifications list: alerts first, then any critical/high-radiance hotspots
  const notifications = useMemo(() => {
    const list = [];
    if (alerts && alerts.length > 0) {
      alerts.forEach((a, idx) => {
        list.push({
          id: a.alert_id || `alert-${idx}`,
          title: a.facility_name || 'Thermal Excursion Anomaly',
          category: a.classification || 'INDUSTRIAL_FIRE',
          severity: a.severity || 'CRITICAL',
          message: a.message || 'Statistical thermal excursion detected exceeding process baseline.',
          frp: a.current_frp,
          zScore: a.z_score,
          timestamp: a.timestamp,
          latitude: a.latitude,
          longitude: a.longitude,
          rawEvent: a,
        });
      });
    }

    if (list.length < 5 && hotspots && hotspots.length > 0) {
      const highHotspots = hotspots
        .filter((h) => h.classification === 'INDUSTRIAL_FIRE' || h.classification === 'WILDFIRE' || Number(h.frp) >= 50)
        .slice(0, 5 - list.length);

      highHotspots.forEach((h, idx) => {
        const id = h.id || `hotspot-notif-${idx}`;
        if (!list.some((item) => item.id === id || (item.latitude === h.latitude && item.longitude === h.longitude))) {
          list.push({
            id,
            title: h.facility_name || h.forest_name || `Active Hotspot (${Number(h.latitude).toFixed(2)}, ${Number(h.longitude).toFixed(2)})`,
            category: h.classification || 'HOTSPOT',
            severity: h.risk_level?.toUpperCase() || (Number(h.frp) >= 80 ? 'CRITICAL' : 'HIGH'),
            message: h.explanation || `Elevated radiative power of ${h.frp} MW detected by satellite pass.`,
            frp: h.frp,
            timestamp: h.timestamp,
            latitude: h.latitude,
            longitude: h.longitude,
            rawEvent: h,
          });
        }
      });
    }

    return list;
  }, [alerts, hotspots]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readAlertIds.has(n.id)).length;
  }, [notifications, readAlertIds]);

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadAlertIds(allIds);
  };

  const handleSelectNotificationItem = (item) => {
    setReadAlertIds((prev) => new Set([...prev, item.id]));
    setShowNotifications(false);
    if (onSelectNotification && item.rawEvent) {
      onSelectNotification(item.rawEvent);
    }
  };
  return (
    <header className="relative z-[5000] h-14 bg-dark-900 border-b border-dark-700 px-4 flex items-center justify-between gap-4 select-none shadow-sm transition-colors duration-200">
      {/* Left: Brand & Ingestion Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-600/20">
            <Flame className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-black tracking-wider uppercase text-slate-100 font-sans">
                OTIP
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Orbital Thermal Intelligence Platform</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-dark-700 mx-1 hidden sm:block" />

        {/* Live Feed Status Pill */}
        <div className="flex items-center bg-dark-850 border border-dark-700 p-0.5 rounded-lg">
          {dataSource === 'firms' ? (
            <button
              type="button"
              onClick={() => onToggleMode(mode === 'demo' ? 'auto' : 'demo')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-300 hover:text-white"
              title="Toggle Live / Demo feed"
            >
              <span className={`w-2 h-2 rounded-full ${mode !== 'demo' ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
              <span className="text-xs font-medium text-slate-200">
                {mode !== 'demo' ? 'Live Feed' : 'Demo Feed'}
              </span>
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>FSI Forest Fire</span>
            </span>
          )}
        </div>

        {/* Ingestion Source Switcher */}
        <div className="hidden md:flex items-center bg-dark-850 border border-dark-700 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onToggleDataSource('firms')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              dataSource === 'firms'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>NASA FIRMS</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleDataSource('fsi')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              dataSource === 'fsi'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>FSI</span>
          </button>
        </div>
      </div>

      {/* Center Controls: Scope, Sensor, Refresh */}
      <div className="flex items-center gap-2.5">
        {/* Region Scope Select */}
        <div className="flex items-center gap-1.5 bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
          >
            {Object.entries(REGIONS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-dark-850 text-slate-200">
                {cfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sensor Select (for FIRMS) */}
        {dataSource === 'firms' && (
          <div className="flex items-center gap-1.5 bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedSensor}
              onChange={(e) => onSelectSensor(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
            >
              {SENSORS.map((s) => (
                <option key={s.id} value={s.id} className="bg-dark-850 text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Force Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 bg-dark-850 hover:bg-dark-750 border border-dark-700 rounded-lg text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh satellite feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Right Controls: Notifications & Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Notifications Icon with Badge and Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications((prev) => !prev);
            }}
            className={`relative p-1.5 rounded-lg border transition-all ${
              showNotifications
                ? 'bg-dark-750 border-sky-500 text-white shadow-sm'
                : 'bg-dark-850 hover:bg-dark-750 border-dark-700 text-slate-300 hover:text-white'
            }`}
            title={unreadCount > 0 ? `${unreadCount} Critical Incident Notifications` : 'Notifications & Alerts'}
          >
            <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-400' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl z-[5000] overflow-hidden select-text">
              {/* Popover Header */}
              <div className="px-4 py-3 bg-dark-850 border-b border-dark-750 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Notifications & Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Popover Body: Notifications List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-dark-750/70">
                {notifications.length > 0 ? (
                  notifications.map((item) => {
                    const isRead = readAlertIds.has(item.id);
                    const isCritical = item.severity === 'CRITICAL';
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectNotificationItem(item)}
                        className={`p-3 cursor-pointer transition-colors flex items-start gap-2.5 ${
                          isRead
                            ? 'bg-dark-900/60 hover:bg-dark-850 opacity-75'
                            : 'bg-dark-850/90 hover:bg-dark-800'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                            isCritical
                              ? 'bg-red-500/20 border-red-500/40 text-red-400'
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          }`}
                        >
                          {isCritical ? (
                            <Flame className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-100 truncate">
                              {item.title}
                            </h4>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 border ${
                                isCritical
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              }`}
                            >
                              {item.severity}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                            {item.message}
                          </p>

                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                            <span className="font-mono text-sky-400 font-semibold">
                              {item.frp ? `${item.frp} MW` : ''} {item.zScore ? `(+${item.zScore}σ)` : ''}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              <span>
                                {item.timestamp
                                  ? (item.timestamp.length >= 16 ? item.timestamp.slice(11, 16) : item.timestamp.slice(0, 10))
                                  : 'Orbital Pass'}
                              </span>
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-2" />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                    <p className="text-xs font-medium text-slate-200">
                      No active emergency alerts
                    </p>
                    <p className="text-[11px] text-slate-500">
                      All monitored Indian industrial and environmental thermal sources operating within normal parameters.
                    </p>
                  </div>
                )}
              </div>

              {/* Popover Footer */}
              <div className="px-4 py-2 bg-dark-850/90 border-t border-dark-750 flex items-center justify-between text-[10.5px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>NASA FIRMS & FSI Active</span>
                </span>
                <span className="text-slate-500 text-[10px]">
                  Click any event to investigate
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-750 border border-dark-700 transition-all text-slate-300 hover:text-white"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>
    </header>
  );
}
