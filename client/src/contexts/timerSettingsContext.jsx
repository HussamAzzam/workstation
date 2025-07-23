import { createContext } from 'react';

const DEFAULT_TIMER_SETTINGS = {
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    sessionsUntilLongBreak: 4,
    autoStart: false
};

export const TimerSettingsContext = createContext(DEFAULT_TIMER_SETTINGS);
export { DEFAULT_TIMER_SETTINGS };