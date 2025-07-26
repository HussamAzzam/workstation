import { createSlice } from "@reduxjs/toolkit";

const DEFAULT_TIMER_SETTINGS = {
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    sessionsUntilLongBreak: 4,
    autoStart: false
};
const DEFAULT_PANELS = [
    { name: "Pomodoro", sessions: 0 },
    { name: "Rest", sessions: 0 },
    { name: "Long Rest", sessions: 0 }
];

const userStore = createSlice({
    name: "user",
    initialState: {
        settings: DEFAULT_TIMER_SETTINGS,
        panels: DEFAULT_PANELS,
        tasks: []
    }
})