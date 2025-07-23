import React from "react";
import { useState, useEffect, useRef, useContext } from "react";
import { TimerSettingsContext } from "@/App.jsx";
import Clock from './clock.jsx';


function PomodoroComponent({ className, onClockClick, isClockRunning, onUpdateClockState, userPanels, onUpdatePanel, isSessionRestarted}) {
  //States
  const {timerSettings, autoStart} = useContext(TimerSettingsContext);
  const safePanels = Array.isArray(userPanels) ? userPanels : [
    {name: "Pomodoro", sessions: 0},
    {name: "Rest", sessions: 0},
    {name: "Long Rest", sessions: 0}
  ]
  const [progressPanel, setProgressPanel] = useState([
      {
        orderID: 0,
        name: safePanels[0]?.name,
        sessions: safePanels[0]?.sessions,
        state: "stopped",
        active: true,
        duration: timerSettings.workTime,
        styles: "text-blue-600",
        clockStyles: "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600"
      },
      {
        orderID: 1,
        name: safePanels[1]?.name,
        sessions:  safePanels[1]?.sessions,
        state: "stopped",
        active: false,
        duration: timerSettings.shortBreakTime,
        styles: "text-green-500",
        clockStyles: "border-green-200 bg-green-50 hover:bg-green-100 text-green-600"
      },
      {
        orderID: 2,
        name: safePanels[2]?.name,
        sessions:  safePanels[2]?.sessions,
        state: "stopped",
        active: false,
        duration: timerSettings.longBreakTime,
        styles: "text-green-500",
        clockStyles: "border-green-200 bg-green-50 hover:bg-green-100 text-green-600"
      }
    ]
  );
  const [isReseted, setIsReseted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [sessionEndTriggered, setSessionEndTriggered] = useState(false);

  const triggerSessionEnd = () => {
    setSessionEndTriggered(true);
  };

  useEffect(() => {
    if(Array.isArray(userPanels) && userPanels.length > 0) {
      setProgressPanel(prevPanels =>
        prevPanels.map((panel, index) => ({
          ...panel,
          name: userPanels[index]?.name || panel.name,
          sessions: userPanels[index].sessions !== undefined ? userPanels[index].sessions : panel.sessions,
        }))
        );
    }
  }, [userPanels]);

  // Refs
  const audioRef = useRef(null);
  const progressPanelRef = useRef(progressPanel);
  const autoStartRef = useRef(autoStart);

  //Computed Values
  const activePanel = progressPanel.find(panel => panel.active);

  const getButtonText = () => {
    switch (activePanel.state){
      case "stopped":
        return "Start";
      case "running":
        return "Stop";
      case "paused":
        return "Resume";
      default:
        return "Start";
    }
  }

  //Progress Handlers
  const handlePanelClick = (panelID) => {
    setProgressPanel(prevPanels =>
      prevPanels.map(panel => ({
        ...panel,
        active: panel.orderID === panelID,
        state: panel.orderID === panelID ? panel.state : "stopped"
      }))
    );
    setIsActive(false);
    setIsReseted(true);
    onUpdateClockState(false);
  }

  const handleSessionControl = () => {
    setIsReseted(false);
    switch(activePanel.state){
      case "stopped":
        setIsActive(true);
        setProgressPanel(prevPanels =>
          prevPanels.map(panel =>
            panel.orderID === activePanel.orderID
              ? {...panel, state: "running"}
              : panel
          )
        );
        onUpdateClockState(true);
        break;
      case "running":
        setIsActive(false);
        setProgressPanel(prevPanels =>
          prevPanels.map(panel =>
            panel.orderID === activePanel.orderID
              ? {...panel, state: "paused"}
              : panel
          )
        );
        onUpdateClockState(false);
        break;
      case "paused":
        setIsActive(true);
        setProgressPanel(prevPanels =>
          prevPanels.map(panel =>
            panel.orderID === activePanel.orderID
              ? {...panel, state: "running"}
              : panel
          )
        );
        onUpdateClockState(true);
        break;
      default:
        setProgressPanel(prevPanels =>
          prevPanels.map(panel =>
            panel.orderID === activePanel.orderID
              ? {...panel, state: "stopped"}
              : panel
          )
        );
    }
  }

  const handleReset = () => {
    setIsReseted(true);
    setIsActive(false);
  }

  const playSound = () => {
    if(audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    // Stop the sound after 3 second
    setTimeout(() => {
      if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 3000);
  }

  //useEffects
  useEffect(() => {
    if (sessionEndTriggered) {
      setSessionEndTriggered(false); // Reset the trigger

      // play the alarm
      playSound();

      // Stop everything first
      setIsActive(false);
      setIsReseted(true);
      onUpdateClockState(false);

      // Update sessions count and set current panel to stopped
      setProgressPanel(prevPanels => {
        const updatedPanels = prevPanels.map(panel =>
          panel.orderID === activePanel.orderID
            ? { ...panel, sessions: panel.sessions + 1, state: "stopped" }
            : panel
        );

        // Get the updated session count from the modified panel
        const updatedActivePanel = updatedPanels.find(p => p.orderID === activePanel.orderID);

        // Update parent state
        setTimeout(() => {
          onUpdatePanel(updatedActivePanel.orderID, {
            name: updatedActivePanel.name,
            sessions: updatedActivePanel.sessions
          });
        }, 0)

        let nextPanelId;

        if (activePanel.orderID === 0) {
          // Pomodoro session ended - switch to appropriate break
          const currentPomodoroSessions = updatedPanels.find(p => p.orderID === 0).sessions;
          nextPanelId = currentPomodoroSessions % timerSettings.sessionsUntilLongBreak === 0 ? 2 : 1;
        } else {
          // Break session ended - switch back to Pomodoro
          nextPanelId = 0;
        }

        // Switch to next panel
        const panelsWithNewActive = updatedPanels.map(panel => ({
          ...panel,
          active: panel.orderID === nextPanelId,
          state: "stopped"
        }));

        // Schedule auto-start if enabled
        if (autoStartRef.current) {
          setTimeout(() => {
            setIsReseted(true);
            setTimeout(() => {
              setProgressPanel(prevPanels =>
                prevPanels.map(panel => ({
                  ...panel,
                  state: panel.active ? "running" : panel.state
                }))
              );
              setIsActive(true);
              setIsReseted(false);
              onUpdateClockState(true);
            }, 100);
          }, 200);
        } else {
          setIsReseted(true);
        }

        return panelsWithNewActive;
      });
    }
  }, [sessionEndTriggered, activePanel?.orderID, timerSettings.sessionsUntilLongBreak, autoStartRef, onUpdatePanel, onUpdateClockState]);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/alarm-clock-2.mp3');

    return () => {
      if(audioRef.current){
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    progressPanelRef.current = progressPanel;
  }, [progressPanel]);

  useEffect(() => {
    autoStartRef.current = autoStart;
  }, [autoStart]);

  useEffect(() => {
    if(isReseted) {
      setProgressPanel(prevPanels =>
        prevPanels.map(panel =>
          panel.orderID === activePanel.orderID
            ? {...panel, state: "stopped"}
            : panel
        )
      );
    }
  }, [isReseted, activePanel?.orderID]);

  useEffect(() => {
    setProgressPanel(prevPanels =>
      prevPanels.map(panel =>({
        ...panel,
        duration: panel.name === "Pomodoro" ? timerSettings.workTime :
        panel.name === "Rest" ? timerSettings.shortBreakTime :
        timerSettings.longBreakTime
      }))
    );
  }, [timerSettings]);

  useEffect(() => {
    if(!isClockRunning && isActive){
      setIsActive(false);
      setIsReseted(true);
      // Update panel state to stopped
      setProgressPanel(prevPanels =>
        prevPanels.map(panel =>
          panel.orderID === activePanel.orderID
            ? {...panel, state: "stopped"}
            : panel
        )
      );
    }
  }, [isClockRunning, isActive, activePanel?.orderID]);
  useEffect(() => {
    if(isSessionRestarted){
      setIsActive(false);
      setIsReseted(true);
      onUpdateClockState(false);
      setProgressPanel(prevPanels => prevPanels.map(panel => ({
        ...panel,
        sessions: 0,
        state: "stopped",
        active: panel.orderID === 0
      })))
    }
  }, [isSessionRestarted, onUpdateClockState]);
  return (
    <div className={`${className} flex flex-col items-center gap-0 pb-5 mt-[-15px]`}>
      <div className={`h-[10%] w-[40%] flex items-end justify-between px-5`}>
        {
          progressPanel.map(panel => (
              <button
                onClick={() => handlePanelClick(panel.orderID)}
                key={panel.orderID}
                className={`${panel.styles} 
              ${panel.active? "border-b border-black cursor-default"
                  : "border-b-transparent cursor-pointer"}
               flex flex-1 justify-center items-end gap-2 text-xl font-light py-3 px-3 hover:bg-blue-100 rounded-t-md transition-all duration-300 ease-in-out`}>
                <span>{panel.name}</span>
                <span className={`font-bold`}>{panel.sessions}</span>
              </button>
            )
          )
        }
      </div>
      <Clock
        className={`w-[40%] flex-1`}
        panel={activePanel}
        isActive={isActive}
        onSessionEnd={triggerSessionEnd}
        isReseted={isReseted}
        onClockClick={onClockClick}
      />
      <div className={`h-[20%] w-[35%] flex flex-col items-center gap-3`}>
        <button
          onClick={handleSessionControl}
          className={`
          ${activePanel.state !== "running"? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white text-blue-600 border-2 border-blue-600 shadow-md shadow-gray-300 "}
          w-full flex items-center justify-center flex-1 text-3xl cursor-pointer font-medium rounded-full hover:scale-102 transition-all duration-300 ease-in-out`}
        >
          {getButtonText()}
        </button>
        <button
          onClick={handleReset}
          className={`h-[35%] w-[50%] flex justify-center items-center font-bold rounded-full cursor-pointer text-blue-600 bg-white border-4 border-blue-600 
          hover:text-white hover:bg-blue-600 shadow-md shadow-gray-300  transition-all duration-300 ease-in-out`}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
const Pomodoro = React.memo(PomodoroComponent);
export default Pomodoro;