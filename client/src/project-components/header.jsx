import Logo from './logo.jsx';
import { Switch } from "@/components/ui/switch";
import ReportForm from "@/project-components/report-form.jsx";
import React from "react";
import { useEffect, useState, useRef } from "react";

function HeaderComponent({ className,DEFAULT_TIMER_SETTINGS,  timerSettings, onUpdateTimerSettings, isClockClicked, isClockRunning,
                  onUpdateClockState, autoStart, onUpdateAutoStartState, onUpdateSessionRestarted, isSessionRestarted
                  , isReportOpen, onUpdateReportState}) {
  //States
  const [tempTimerSettings, setTempTimerSettings] = useState(timerSettings);
  const [showSettings, setShowSettings] = useState(false);

  //Refs
  const settingsRef = useRef(null);
  const settingsButtonRef = useRef(null);

  //Handlers
  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  }
  const handleInputChange = async(field, value) => {
    if(isClockRunning){
      onUpdateClockState(false);
    }
    const newSettings = {
      ...tempTimerSettings,
      [field]: parseInt(value)
    }
    setTempTimerSettings(newSettings);
    await onUpdateTimerSettings(newSettings);a
  }
  const handelRestartSession = () => {
    const message = "It will reset the counters of your pomodoros and rests, do you want to continue?";
    if(window.confirm(message)){
      onUpdateSessionRestarted();
    }
  }

  //Effects
  useEffect(() => {
    setTempTimerSettings(timerSettings);
  }, [timerSettings]);

  useEffect(() => {
    const handleClickOutSettings = (e) => {
      if(settingsRef.current && !settingsRef.current.contains(e.target)
          && !settingsButtonRef.current.contains(e.target)){
        setShowSettings(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutSettings);

    return () => document.removeEventListener("mousedown", handleClickOutSettings);
  },[])

  useEffect(() => {
    if(isClockClicked)
      setShowSettings(true);
    else
      setShowSettings(false);
  },[isClockClicked]);
  useEffect(() => {
    if(isSessionRestarted){
      setTempTimerSettings({
        workTime: DEFAULT_TIMER_SETTINGS.workTime,
        shortBreakTime: DEFAULT_TIMER_SETTINGS.shortBreakTime,
        longBreakTime: DEFAULT_TIMER_SETTINGS.longBreakTime,
        sessionsUntilLongBreak: DEFAULT_TIMER_SETTINGS.sessionsUntilLongBreak
      })
    }
  }, [isSessionRestarted]);
    return (
      <header
        className={`flex justify-between items-center px-2 py-2 sm:px-6 sm:py-4 cursor-default  ${className}`}
      >
        <div className="left">
          <Logo />
        </div>
        <div className="right  flex items-center sm:gap-4 relative">
          <button
            ref={settingsButtonRef}
            className="header-btn "
            onClick={handleSettingsClick}
          >Customize</button>
          {showSettings && (
            <div
              ref={settingsRef}
              className={`bg-white h-90 w-80 flex flex-col px-8 py-4 rounded-xl shadow-lg shadow-gray-400 absolute top-full right-62 z-10`}
            >
              <div className={`flex-1`}>
                <div className={`flex flex-col`}>
                  <div className={`text-gray-400`}>
                    <span>Pomodoro</span>
                    <span className={`float-right`}>{tempTimerSettings.workTime}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={90}
                    value={tempTimerSettings.workTime}
                    step={1}
                    onChange={e => handleInputChange('workTime', e.target.value)}
                  />
                </div>
              </div>
              <div className={`flex-1`}>
                <div className={`flex flex-col`}>
                  <div className={`text-gray-400`}>
                    <span>Rest</span>
                    <span className={`float-right`}>{tempTimerSettings.shortBreakTime}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={90}
                    value={tempTimerSettings.shortBreakTime}
                    step={1}
                    onChange={e => handleInputChange('shortBreakTime', e.target.value)}
                  />
                </div>
              </div>
              <div className={`flex-1`}>
                <div className={`flex flex-col`}>
                  <div className={`text-gray-400`}>
                    <span>Long Rest</span>
                    <span className={`float-right`}>{tempTimerSettings.longBreakTime}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={90}
                    value={tempTimerSettings.longBreakTime}
                    step={1}
                    onChange={e => handleInputChange('longBreakTime', e.target.value)}
                  />
                </div>
              </div>
              <div className={`flex-1`}>
                <div className={`flex flex-col`}>
                  <div className={`text-gray-400`}>
                    <span>Sessions</span>
                    <span className={`float-right`}>{tempTimerSettings.sessionsUntilLongBreak}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={tempTimerSettings.sessionsUntilLongBreak}
                    step={1}
                    onChange={e => handleInputChange('sessionsUntilLongBreak', e.target.value)}
                  />
                </div>
              </div>
              <div className={`h-[20%] flex items-center justify-between border-t border-gray-300 pt-1`}>
                <p className={`text-lg font-medium`}>auto start</p>
                <Switch
                    checked={autoStart}
                    onCheckedChange={() => onUpdateAutoStartState(!autoStart)}
                    className="data-[state=checked]:bg-blue-600 h-6.5 w-12 [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-6 cursor-pointer"
                />
              </div>
            </div>
          )}
          <button
            onClick={handelRestartSession}
            className="header-btn "
          >Restart session</button>
          <div
            className={`my-1 sm:mx-2`}>
            <ReportForm
              isReportOpen={isReportOpen}
              onUpdateReportState={onUpdateReportState}
            />
          </div>
        </div>
      </header>
    );
}
const Header = React.memo(HeaderComponent);
export default Header;