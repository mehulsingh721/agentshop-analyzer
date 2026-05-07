"use client";
import { create } from "zustand";
import axios from "axios";
import type { Audit, AuditInput } from "./types";

type State = {
  audit: Audit | null;
  starting: boolean;
  error: string | null;
};

type Actions = {
  startAudit: (input: AuditInput) => Promise<string | null>;
  resumePolling: (id: string) => void;
  stopPolling: () => void;
  reset: () => void;
};

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let abort: AbortController | null = null;

function clearPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  if (abort) {
    abort.abort();
    abort = null;
  }
}

export const useAuditStore = create<State & Actions>((set, get) => ({
  audit: null,
  starting: false,
  error: null,

  startAudit: async (input) => {
    set({ starting: true, error: null, audit: null });
    try {
      const { data } = await axios.post<{ id: string }>("/api/audits", input);
      get().resumePolling(data.id);
      set({ starting: false });
      return data.id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start audit";
      set({ starting: false, error: msg });
      return null;
    }
  },

  resumePolling: (id) => {
    clearPolling();
    abort = new AbortController();

    const tick = async () => {
      try {
        const { data } = await axios.get<Audit>(`/api/audits/${id}`, {
          signal: abort?.signal,
        });
        set({ audit: data, error: null });
        if (data.status === "completed" || data.status === "failed") {
          clearPolling();
          return;
        }
      } catch (e) {
        if (axios.isCancel(e)) return;
        const msg = e instanceof Error ? e.message : "Polling error";
        set({ error: msg });
      }
      pollTimer = setTimeout(tick, 2000);
    };

    tick();
  },

  stopPolling: () => clearPolling(),

  reset: () => {
    clearPolling();
    set({ audit: null, error: null, starting: false });
  },
}));
