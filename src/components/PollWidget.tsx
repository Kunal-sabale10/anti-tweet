"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  expiresAt: string;
  options: PollOption[];
  myVote: string | null;
  totalVotes: number;
}

export interface PollWidgetProps {
  poll: Poll;
  tweetId: string;
  onVoted?: (updatedPoll: Poll) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isPollExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

function getTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Final results";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days >= 1) return `${days} day${days !== 1 ? "s" : ""} left`;
  if (hours >= 1) return `${hours} hour${hours !== 1 ? "s" : ""} left`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} min${minutes !== 1 ? "s" : ""} left`;
}

function pct(voteCount: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return Math.round((voteCount / totalVotes) * 100);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ResultsViewProps {
  poll: Poll;
}

function ResultsView({ poll }: ResultsViewProps) {
  const expired = isPollExpired(poll.expiresAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {poll.options.map((opt) => {
        const percentage = pct(opt.voteCount, poll.totalVotes);
        const isMyVote = poll.myVote === opt.id;

        return (
          <div key={opt.id} style={{ position: "relative" }}>
            {/* Bar track */}
            <div
              style={{
                height: "40px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${isMyVote ? "rgba(99,102,241,0.5)" : "var(--card-border)"}`,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Animated fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  height: "100%",
                  background:
                    "linear-gradient(90deg, rgba(59,130,246,0.45), rgba(139,92,246,0.45))",
                  borderRadius: "7px",
                }}
              />

              {/* Text overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 0.75rem",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontWeight: isMyVote ? 700 : 400,
                    fontSize: "0.9rem",
                    color: isMyVote ? "#a5b4fc" : "var(--foreground)",
                  }}
                >
                  {isMyVote && (
                    <Check
                      size={14}
                      strokeWidth={3}
                      style={{ color: "#818cf8", flexShrink: 0 }}
                    />
                  )}
                  {opt.text}
                </span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: isMyVote ? "#a5b4fc" : "var(--muted)",
                    whiteSpace: "nowrap",
                    marginLeft: "0.5rem",
                  }}
                >
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "0.25rem",
          fontSize: "0.78rem",
          color: "var(--muted)",
          alignItems: "center",
        }}
      >
        <span>
          {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
        </span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span style={{ color: expired ? "var(--muted)" : "#60a5fa" }}>
          {getTimeLeft(poll.expiresAt)}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function PollWidget({ poll, tweetId, onVoted }: PollWidgetProps) {
  const [localPoll, setLocalPoll] = useState<Poll>(poll);
  const [loading, setLoading] = useState<string | null>(null); // option id being voted on
  const [voteError, setVoteError] = useState<string | null>(null);

  const showResults =
    localPoll.myVote !== null || isPollExpired(localPoll.expiresAt);

  const handleVote = async (optionId: string) => {
    if (loading) return;
    setLoading(optionId);
    setVoteError(null);

    try {
      const res = await fetch(`/api/tweets/${tweetId}/poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollOptionId: optionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Vote failed. Please try again.");
      }

      const data = await res.json();

      // Build optimistic/server-driven updated poll
      const updatedPoll: Poll = data?.poll ?? {
        ...localPoll,
        myVote: optionId,
        totalVotes: localPoll.totalVotes + 1,
        options: localPoll.options.map((o) =>
          o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
        ),
      };

      setLocalPoll(updatedPoll);
      onVoted?.(updatedPoll);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Vote failed. Please try again.";
      setVoteError(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid var(--card-border)",
        borderRadius: "14px",
        padding: "1rem 1.1rem",
        marginTop: "0.75rem",
      }}
    >
      <AnimatePresence mode="wait">
        {showResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ResultsView poll={localPoll} />
          </motion.div>
        ) : (
          <motion.div
            key="vote"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}
          >
            {localPoll.options.map((opt) => {
              const isLoading = loading === opt.id;

              return (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleVote(opt.id)}
                  disabled={!!loading}
                  style={{
                    width: "100%",
                    padding: "0.6rem 1rem",
                    borderRadius: "9px",
                    border: "1px solid rgba(99,102,241,0.4)",
                    background: isLoading
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(255,255,255,0.04)",
                    color: "var(--foreground)",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    cursor: loading ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition: "background 0.2s, border-color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {isLoading ? (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      style={{ color: "#818cf8" }}
                    >
                      Voting…
                    </motion.span>
                  ) : (
                    opt.text
                  )}
                </motion.button>
              );
            })}

            {voteError && (
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--error)",
                  marginTop: "0.25rem",
                }}
              >
                {voteError}
              </p>
            )}

            {/* Footer */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.1rem",
                fontSize: "0.78rem",
                color: "var(--muted)",
                alignItems: "center",
              }}
            >
              <span>
                {localPoll.totalVotes} vote
                {localPoll.totalVotes !== 1 ? "s" : ""}
              </span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: "#60a5fa" }}>
                {getTimeLeft(localPoll.expiresAt)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
