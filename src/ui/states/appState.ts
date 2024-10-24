import { create } from "zustand";
import { setupStateProxy } from "../utils/setup";
import type { IAppStateBase } from "@/shared/interfaces";
import { networks } from "bitcoinjs-lib";
import { immer } from "zustand/middleware/immer";

const proxy = setupStateProxy();

export interface IAppState extends IAppStateBase {
  updateAppState: (
    app: Partial<IAppState>,
    updateBack?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAppState = create<IAppState>()(
  immer((set) => ({
    isReady: false,
    isUnlocked: false,
    addressBook: [],
    language: "en",
    activeTabs: [],
    network: networks.bitcoin,
    updateAppState: async (app: Partial<IAppState>, updateBack = true) => {
      if (updateBack) {
        await proxy.updateAppState(app);
      } else {
        set(app);
      }
    },
    logout: async () => {
      await proxy.updateAppState({ password: undefined, isUnlocked: false });
      set({ password: undefined, isUnlocked: false });
    },
  }))
);
