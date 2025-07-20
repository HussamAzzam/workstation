import './App.css';
import {useCallback, useEffect, useMemo, useState} from "react";
import Header from './project-components/header.jsx';
import Pomodoro from './project-components/pomodoro.jsx';
import ToDoSection from "./project-components/to-do-section.jsx";
import {getCurrentUserId, getOrCreateUser, updateUser} from "@/api/users.js";

const DEFAULT_TIMER_SETTINGS = {
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  sessionsUntilLongBreak: 4,
  autoStart: false
};

const DEFAULT_PANELS = [
  {name: "Pomodoro", sessions: 0},
  {name: "Rest", sessions: 0},
  {name: "Long Rest", sessions: 0}
];

const USER_ACTIONS = {
  SET_USER: 'SET_USER',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_PANELS: 'UPDATE_PANELS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETED_TASK: 'DELETED_TASK',
  DELETE_ALL_TASKS: 'DELETE_ALL_TASKS',
  DELETE_COMPLETED_TASKS: 'DELETE_COMPLETED_TASKS',
  RESET_SESSION: 'RESET_SESSION',
  ROLLBACK: 'ROLLBACK',
};

function userReducer(state, action) {
  switch(action.type) {
    case USER_ACTIONS.SET_USER: return {

    }
    case USER_ACTIONS.UPDATE_SETTINGS: return {

    }
    case USER_ACTIONS.UPDATE_PANELS: return {

    }
    case USER_ACTIONS.ADD_TASK: return {

    }
    case USER_ACTIONS.UPDATE_TASK: return {

    }
    case USER_ACTIONS.DELETED_TASK: return {

    }
    case USER_ACTIONS.DELETE_ALL_TASKS: return {

    }
    case USER_ACTIONS.DELETE_COMPLETED_TASKS: return {

    }
    case USER_ACTIONS.RESET_SESSION: return {

    }
    case USER_ACTIONS.ROLLBACK: return {

    }
    default : return state;
  };
};

function App() {
  //States
  const [isClockClicked, setIsClockClicked] = useState(false);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [isSessionRestarted, setIsSessionRestarted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [user, setUser] = useState({
    settings: DEFAULT_TIMER_SETTINGS,
    panels: DEFAULT_PANELS,
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
  const updateTimerSettings = useCallback(async(newSettings) => {
    const updatedSettings = {...user.settings, ...newSettings};
    await updateUserData({settings: updatedSettings});
  }, [user.settings]);

  const updateAutoStartState = useCallback(async(autoStart) => {
    const updatedSettings = {...user.settings, autoStart};
    await updateUserData({settings: updatedSettings});
  }, [autoStartEnabled]);
  const updatePanels = useCallback(async(panelIndex, updatedPanelData) => {
    const currentPanels = safeUserPanels;
    try {
      if(currentPanels[panelIndex]) {
        currentPanels[panelIndex] = {...currentPanels[panelIndex], ...updatedPanelData};
      }
      await updateUserData({panels: currentPanels});
    } catch (e) {
      console.log(e.message);
    }
  }, [user.panels]);
  const updateClockState = useCallback((state) => {
    setIsClockRunning(state);
  }, [isClockRunning])

  const handleSessionRestart = useCallback(async() => {
    try {
      const userId = getCurrentUserId();
      const restedUser = {
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
      await updateUserData(restedUser);
      setIsSessionRestarted(true);
      console.log("user has reseted");
    } catch (e) {
      console.error('Failed to restart session:', e);
      setIsLoading(false);
    } finally {
      setIsSessionRestarted(false);
    }
  }, [isSessionRestarted]);
  //Add task
  const updateTasks = useCallback(async(task) => {
    const currentTasks = [...user.tasks, task]
    const updatedTasks = {tasks: currentTasks};
    try {
      await updateUserData(updatedTasks);
    } catch (e) {
      console.log(e.message);
    }
  }, [user.tasks]);
  //update task
  const updateTaskData = useCallback(async(taskIndex, updatedTaskData) => {
    const currentTasks = safeUserTasks
    console.log(currentTasks);
    if(currentTasks[taskIndex]) {
      currentTasks[taskIndex] = {...currentTasks[taskIndex], ...updatedTaskData};
    }
    const updatedTasks = {tasks: currentTasks};
    await updateUserData(updatedTasks);
  }, [user.tasks]);
  const deleteOneTask = useCallback(async(taskIndex) => {
    const updatedTasks = safeUserTasks.filter((task, index) => index !== taskIndex);
    await updateUserData({tasks:  updatedTasks });
  }, [user.tasks])
  const deleteAllTasks = useCallback(async() => {
    await updateUserData({tasks: []});
    //option 2:
    /*
      const deleteAllTasks = async() => {
      const currentTasks = safeUserTasks;
      const deletePromises = currentTasks.map((task, index) => {
        return deleteOneTask(index);
      });

      await Promise.all(deletePromises);
    }
  */
  }, [user.tasks])

  const deleteCompletedTasks = useCallback(async() => {
    const remainingTasks = user.tasks.filter(task => !task.completed);
    await updateUserData({tasks: remainingTasks});
  }, [user.tasks]);

  const updateReportState = useCallback((state) => {
    setIsReportOpen(state);
  }, [isReportOpen]);

  //Handlers
  const handleClockClick = useCallback(() => {
    setIsClockClicked(!isClockClicked);
  }, [isClockClicked]);

  //Memoized computed values
  const autoStartEnabled = useMemo(() => {
    return user.settings?.autoStart || false;
  }, [user.settings?.autoStart]);

  const safeUserTasks = useMemo(() => {
    return safeUserTasks;
  }, [user.tasks]);

  const safeUserPanels = useMemo(() => {
    return Array.isArray(user.panels) ? [...user.panels] : DEFAULT_PANELS;
  }, []);

  //Memoized components props
  const headerProps = useMemo(() => ({
    className:`h-[60px] w-full `,
    DEFAULT_TIMER_SETTINGS:DEFAULT_TIMER_SETTINGS,
    timerSettings:user.settings,
    autoStart:user.settings?.autoStart || false,
    onUpdateTimerSettings:updateTimerSettings,
    isClockClicked:isClockClicked,
    isClockRunning:isClockRunning,
    onUpdateClockState:updateClockState,
    onUpdateAutoStartState:updateAutoStartState,
    isSessionRestarted:isSessionRestarted,
    onUpdateSessionRestarted:handleSessionRestart,
    isReportOpen:isReportOpen,
    onUpdateReportState:updateReportState
  }), [
    user.settings,
    autoStartEnabled,
    updateTimerSettings,
    isClockClicked,
    isClockRunning,
    updateClockState,
    updateAutoStartState,
    isSessionRestarted,
    handleSessionRestart,
    isReportOpen,
    updateReportState,
  ]);

  const pomodoroProps = useMemo(() => ({
    className: "max-w-full sm:w-[75%] h-full",
    timerSettings: user.settings,
    autoStart: autoStartEnabled,
    userPanels: safeUserPanels,
    onUpdatePanel: updatePanels,
    onClockClick: handleClockClick,
    isClockRunning,
    onUpdateClockState: updateClockState,
    isSessionRestarted,
    onSessionRestarted: handleSessionRestart,
  }), [
    user.settings,
    autoStartEnabled,
    safeUserPanels,
    updatePanels,
    handleClockClick,
    isClockRunning,
    updateClockState,
    isSessionRestarted,
    handleSessionRestart,
  ]);

  const todoProps = useMemo(() => ({
    className: "max-w-full sm:w-[25%] h-full border-l border-gray-300",
    userTasks: safeUserTasks,
    onUpdateTasks: updateTasks,
    onUpdateTaskData: updateTaskData,
    onDeleteOneTask: deleteOneTask,
    onDeleteAllTasks: deleteAllTasks,
    onDeleteCompletedTasks: deleteCompletedTasks,
  }), [
    safeUserTasks,
    updateTasks,
    updateTaskData,
    deleteOneTask,
    deleteAllTasks,
    deleteCompletedTasks,
  ]);
  return (
      <div className={`h-auto max-w-full sm:h-[100vh] flex flex-col `}>
        <Header {...headerProps} />
        <div className="flex max-w-full flex-col sm:flex-row h-[calc(100%-60px-30px)]">
          <Pomodoro {...pomodoroProps} />
          <ToDoSection {...todoProps} />
        </div>
      </div>
  );
}

export default App