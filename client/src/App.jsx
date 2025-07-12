import './App.css';
import { useEffect, useState } from "react";
import Header from './project-components/header.jsx';
import Pomodoro from './project-components/pomodoro.jsx';
import ToDoSection from "./project-components/to-do-section.jsx";
import { getOrCreateUser, clearUserData, getCurrentUserId, updateUser } from "@/api/users.js";

const DEFAULT_TIMER_SETTINGS = {
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  sessionsUntilLongBreak: 4,
  autoStart: false
};

function App() {
  //States
  const [isClockClicked, setIsClockClicked] = useState(false);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [isSessionRestarted, setIsSessionRestarted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [user, setUser] = useState({
    settings: DEFAULT_TIMER_SETTINGS,
    panels: [
      {name: "Pomodoro", sessions: 0},
      {name: "Rest", sessions: 0},
      {name: "Long Rest", sessions: 0}
    ],
    tasks: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async() => {
      const result = await initializeApp();
      if(result.success) {
        setUser(result.user);
      }
      setIsLoading(false);
    }
    loadUser();
  },[] );

  //User handlers
  const initializeApp = async() => {
    try {
      const userResult = await getOrCreateUser();
      if(userResult.success) {
        const userData = userResult.data;
        // Ensure settings have default values
        const settings = { ...DEFAULT_TIMER_SETTINGS, ...userData.settings };
        const panels = Array.isArray(userData.panels) ? userData.panels : [
          {name: "Pomodoro", sessions: 0},
          {name: "Rest", sessions: 0},
          {name: "Long Rest", sessions: 0}
        ];

        return {
          success: true,
          user: {
            ...userData,
            settings,
            panels
          }
        };
      } else {
        console.error('Failed to initialize user:', userResult.error);
        return { success: false, error: userResult.error };
      }
    } catch (e) {
      console.error('Failed to initialize user:', e);
      return { success: false, error: e.message };
    }
  };

  const updateUserData = async(updates) => {
    if(!user) {
      console.log('No user found, returning early');
      return;
    }

    try {
      // Store original user for rollback
      const originalUser = user;

      // Optimistic update - spread the updates properly
      const updatedUser = {...user, ...updates};
      setUser(updatedUser);

      // Sync with backend
      const userId = getCurrentUserId();
      const result = await updateUser(userId, updates);

      if(result.success) {
        // Ensure the returned data has proper structure
        const serverUser = {
          ...result.data,
          settings: { ...DEFAULT_TIMER_SETTINGS, ...result.data.settings },
          panels: {...result.data.panels}
        };
        setUser(serverUser);
      } else {
        // Rollback to original state
        setUser(originalUser);
      }
    } catch(e) {
      // Rollback to original state on error
      setUser(user);
    }
  }

  //Updaters
  const updateTimerSettings = async(newSettings) => {
    const updatedSettings = {...user.settings, ...newSettings};
    await updateUserData({settings: updatedSettings});
  };

  const updateAutoStartState = async(autoStart) => {
    const updatedSettings = {...user.settings, autoStart};
    await updateUserData({settings: updatedSettings});
  }
  const updatePanels = async(panelIndex, updatedPanelData) => {
    const currentPanels = Array.isArray(user.panels) ? [...user.panels] : [
      {name: "Pomodoro", sessions: 0},
      {name: "Rest", sessions: 0},
      {name: "Long Rest", sessions: 0}
    ];
    try {
      if(currentPanels[panelIndex]) {
        currentPanels[panelIndex] = {...currentPanels[panelIndex], ...updatedPanelData};
      }
      await updateUserData({panels: currentPanels});
    } catch (e) {
      console.log(e.message);
    }
  }
  const updateClockState = (state) => {
    setIsClockRunning(state);
  }

  const handleSessionRestart = async() => {
    try {
      const userId = getCurrentUserId();
      const resetedUser = {
        ...user,
        lastActive: Date.now(),
        settings: {
          workTime: 25,
          shortBreakTime: 5,
          longBreakTime: 15,
          sessionsUntilLongBreak: 4,
          autoStart: false,
        },
        panels: [
          {
            name: "Pomodoro",
            sessions: 0,
          },
          {
            name: "Rest",
            sessions: 0,
          },
          {
            name: "Long Rest",
            sessions: 0,
          },
        ],
        tasks: []
      }
      await updateUserData(resetedUser);
      setIsSessionRestarted(true);
      console.log("user has reseted");
    } catch (e) {
      console.error('Failed to restart session:', e);
      setIsLoading(false);
    } finally {
      setIsSessionRestarted(false);
    }
  }
  //to add tasks
  const updateTasks = async(task) => {
    const currentTasks = [...user.tasks, task]
    const updatedTasks = {tasks: currentTasks};
    try {
      await updateUserData(updatedTasks);
    } catch (e) {
      console.log(e.message);
    }
  };
  //to handle edits
  const updateTaskData = async(taskIndex, updatedTaskData) => {
    const currentTasks = Array.isArray(user.tasks) ? [...user.tasks] : []
    console.log(currentTasks);
    if(currentTasks[taskIndex]) {
      currentTasks[taskIndex] = {...currentTasks[taskIndex], ...updatedTaskData};
    }
    const updatedTasks = {tasks: currentTasks};
    await updateUserData(updatedTasks);
  }
  const deleteOneTask = async(taskIndex) => {
    const currentTasks = Array.isArray(user.tasks) ? [...user.tasks] : []
    const updatedTasks = currentTasks.filter((task, index) => index !== taskIndex);
    await updateUserData({tasks:  updatedTasks });
  }
  const deleteAllTasks = async() => {
    await updateUserData({tasks: []});
    //option 2:
    /*const deleteAllTasks = async() => {
  const currentTasks = Array.isArray(user.tasks) ? [...user.tasks] : [];
  const deletePromises = currentTasks.map((task, index) => {
    return deleteOneTask(index);
  });

  await Promise.all(deletePromises);
}*/
  }

  const deleteCompletedTasks = async() => {
    const remainingTasks = user.tasks.filter(task => !task.completed);
    await updateUserData({tasks: remainingTasks});
  }

  const updateReportState = (state) => {
    setIsReportOpen(state);
  }

  //Handlers
  const handleClockClick = () => {
    setIsClockClicked(!isClockClicked);
  }

  /*// Don't render until user data is loaded
  if (isLoading) {
    return <div></div>;
  }*/
   
   
   
  return (
      <div className={`h-auto max-w-full sm:h-[100vh] flex flex-col`}>
        <Header
            className={`h-[60px] w-full `}
            DEFAULT_TIMER_SETTINGS={DEFAULT_TIMER_SETTINGS}
            timerSettings={user.settings}
            autoStart={user.settings?.autoStart || false}
            onUpdateTimerSettings={updateTimerSettings}
            isClockClicked={isClockClicked}
            isClockRunning={isClockRunning}
            onUpdateClockState={updateClockState}
            onUpdateAutoStartState={updateAutoStartState}
            isSessionRestarted={isSessionRestarted}
            onUpdateSessionRestarted={handleSessionRestart}
            isReportOpen={isReportOpen}
            onUpdateReportState={updateReportState}
        />
        <div className="flex max-w-full flex-col sm:flex-row h-[calc(100%-60px-30px)]">
          <Pomodoro
              className="max-w-full sm:w-[75%] h-full"
              timerSettings={user.settings}
              autoStart={user.settings?.autoStart || false}
              userPanels={user.panels}
              onUpdatePanel={updatePanels}
              onClockClick={handleClockClick}
              isClockRunning={isClockRunning}
              onUpdateClockState={updateClockState}
              isSessionRestarted={isSessionRestarted}
              onSessionRestarted={handleSessionRestart}
          />
          <ToDoSection
            className="max-w-full sm:w-[25%] h-full border-l border-gray-300"
            userTasks={user.tasks}
            onUpdateTasks={updateTasks}
            onUpdateTaskData={updateTaskData}
            onDeleteOneTask={deleteOneTask}
            onDeleteAllTasks={deleteAllTasks}
            onDeleteCompletedTasks={deleteCompletedTasks}
          />
        </div>
      </div>
  );
}

export default App