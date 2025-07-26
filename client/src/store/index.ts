import { configureStore } from "@reduxjs/toolkit";
import timerSettingsReducer from "./timerSettingsStore.js"

export const store = configureStore({
    reducer: {
        timerSettings: timerSettingsReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
