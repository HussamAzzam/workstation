import { createSlice } from '@reduxjs/toolkit';

const DEFAULT_TIMER_SETTINGS = {
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    sessionsUntilLongBreak: 4,
    autoStart: false
};

const timerSettingsSlice = createSlice({
    name: 'timerSettings',
    initialState: DEFAULT_TIMER_SETTINGS,
    reducers: {
        updateWorkTime: (state, action) => {
            state.workTime = action.payload;
        },
        updateShortBreakTime: (state, action) => {
            state.shortBreakTime = action.payload;
        },
        updateLongBreakTime: (state, action) => {
            state.longBreakTime = action.payload;
        },
        updateSessionsUntilLongBreak: (state, action) => {
            state.sessionsUntilLongBreak = action.payload;
        },
        toggleAutoStart: (state) => {
            state.autoStart = !state.autoStart;
        },
        updateAllSettings: (state, action) => {
            return { ...state, ...action.payload };
        },
        resetToDefaults: () => {
            return DEFAULT_TIMER_SETTINGS;
        }
    }
});

export { DEFAULT_TIMER_SETTINGS };
export default timerSettingsSlice.reducer;