import React, { useState } from "react";
import { useAuth } from "../context/useAuth";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars

/**
 * Wraps premium features (save, export, dashboard access).
 * - Authenticated users → renders children normally
 * - Guest users → renders a styled lock overlay / login prompt
 *
 * Usage:
 *   <ProtectedFeature action="save your experiment">
 *     <SaveButton onClick={handleSave} />
 *   </ProtectedFeature>
 */
export default function ProtectedFeature({
  children,
  action = "use this feature",
  onAuthPrompt,
  compact = false,
}) {
  const { isAuthenticated } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Guest: wrap children with a lock overlay
  if (compact) {
    // Compact mode — just a tooltip on hover
    return (
      <div
        className="relative inline-flex"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="opacity-50 pointer-events-none select-none"
          style={{ filter: "grayscale(0.5)" }}
        >
          {children}
        </div>

        {/* Lock icon overlay */}
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-transparent border-0"
          onClick={() => {
            if (onAuthPrompt) {
              onAuthPrompt();
            } else {
              // Scroll to auth dock on landing page
              document
                .getElementById("auth-dock")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
          aria-label={`Sign in to ${action}`}
        >
          <span className="text-base opacity-80">🔒</span>
        </button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 px-3 py-1.5 text-[10px] font-mono tracking-wider text-[#00F2FF] border border-[#00F2FF]/20 bg-[#0A0A0A]/95 backdrop-blur-md"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              }}
            >
              Sign in to {action}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full block mode — replaces content with a styled prompt
  return (
    <div className="relative">
      <div
        className="opacity-30 pointer-events-none select-none blur-[2px]"
      >
        {children}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="text-2xl">🔒</div>
        <p className="text-[#94A3B8] text-sm font-mono tracking-wider text-center">
          Sign in to {action}
        </p>
        <button
          type="button"
          className="px-5 py-2 text-xs font-bold tracking-[0.2em] uppercase border border-[#00F2FF]/30 text-[#00F2FF] bg-[#00F2FF]/5 hover:bg-[#00F2FF]/10 hover:border-[#00F2FF]/50 transition-all duration-300 cursor-pointer"
          onClick={() => {
            if (onAuthPrompt) {
              onAuthPrompt();
            } else {
              document
                .getElementById("auth-dock")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
          style={{
            clipPath:
              "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
