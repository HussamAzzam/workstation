import './App.css';
import { useCallback, useEffect, useMemo, useReducer, useState} from "react";
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { TimerSettingsContext , DEFAULT_TIMER_SETTINGS} from "@/contexts/timerSettingsContext.jsx";
import { Provider } from "react-redux";
import { store } from "./store"
import { useClockState } from "@/hooks/useClockState.jsx";
import Header from './project-components/header.jsx';
import Pomodoro from './project-components/pomodoro.jsx';
import ToDoSection from "./project-components/to-do-section.jsx";
import { getCurrentUserId, getOrCreateUser, updateUser } from "@/api/users.js";

/*
  Why React.memo is beneficial here?
  Your App component has complex state management and passes many props to child components.
  When the App re-renders (due to state changes), all child components re-render even if their specific props haven't changed.

  When NOT to use React.memo:
  1.Components that always receive different props
  2.Very simple/cheap components
  3.Components that rarely re-render
  4. Root/top-level components such as App component
*/

//Error Boundaries
const HeaderErrorFallback = ({error, resetErrorBoundary}) => {
  return (
      <div className={`flex gap-5 mt-2 justify-center items-center `}>
        <h3>Something went wrong!</h3>
        <pre>{error.message}</pre>
        <button
            className={`text-white bg-blue-600 p-2  rounded-md hover:opacity-80 cursor-pointer`}
            onClick={resetErrorBoundary}
        >
          Try again
        </button>
      </div>
  )
}
const PomodoroErrorFallback = ({error, resetErrorBoundary}) => {
  return (
      <div className={`mt-20 flex flex-col justify-center items-center `}>
        <h3>Something went wrong!</h3>
        <pre>{error.message}</pre>
        <button
            className={`text-white bg-blue-600 p-2 rounded-md hover:opacity-80 cursor-pointer`}
            onClick={resetErrorBoundary}
        >
          Try again
        </button>
      </div>
  )
}
const TodoErrorFallback = ({error, resetErrorBoundary}) => {
  return (
      <div className={`mt-20 flex flex-col justify-center items-center `}>
        <h3>Something went wrong!</h3>
        <pre>{error.message}</pre>
        <button
            className={`text-white bg-blue-600 p-2 rounded-md hover:opacity-80 cursor-pointer`}
            onClick={resetErrorBoundary}
        >
          Try again
        </button>
      </div>
  )
}

const DEFAULT_PANELS = [
  { name: "Pomodoro", sessions: 0 },
  { name: "Rest", sessions: 0 },
  { name: "Long Rest", sessions: 0 }
];

// Action types for user reducer
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
};

// User state reducer
function userReducer(state, action) {
  switch (action.type) {
    case USER_ACTIONS.SET_USER:
      return {
        ...action.payload
      };

    case USER_ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case USER_ACTIONS.UPDATE_PANELS:
      { const updatedPanels = [...state.panels];
      if (updatedPanels[action.payload.index]) {
        updatedPanels[action.payload.index] = {
          ...updatedPanels[action.payload.index],
          ...action.payload.data
        };
      }
      return {
        ...state,
        panels: updatedPanels
      }; }

    case USER_ACTIONS.ADD_TASK:
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };

    case USER_ACTIONS.UPDATE_TASK:
      { const updatedTasks = [...state.tasks];
      if (updatedTasks[action.payload.index]) {
        updatedTasks[action.payload.index] = {
          ...updatedTasks[action.payload.index],
          ...action.payload.data
        };
      }
      return {
        ...state,
        tasks: updatedTasks
      }; }

    case USER_ACTIONS.DELETED_TASK:
      return {
        ...state,
        tasks: state.tasks.filter((_, index) => index !== action.payload.index)
      };

    case USER_ACTIONS.DELETE_ALL_TASKS:
      return {
        ...state,
        tasks: []
      };

    case USER_ACTIONS.DELETE_COMPLETED_TASKS:
      return {
        ...state,
        tasks: state.tasks.filter(task => !task.completed)
      };

    case USER_ACTIONS.RESET_SESSION:
      return {
        ...state,
        lastActive: Date.now(),
        settings: DEFAULT_TIMER_SETTINGS,
        panels: DEFAULT_PANELS,
        tasks: []
      };

    default:
      return state;
  }
}

function App() {
  // Main user state using reducer
  const [user, dispatch] = useReducer(userReducer, {
    settings: DEFAULT_TIMER_SETTINGS,
    panels: DEFAULT_PANELS,
    tasks: []
  });

  // Component states
  const [isSessionRestarted, setIsSessionRestarted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const {isClockClicked, isClockRunning ,updateClockState, handleClockClick} = useClockState();

  // Initialize app on mount
  useEffect(() => {
    const loadUser = async () => {
      const result = await initializeApp();
      if (result.success) {
        dispatch({ type: USER_ACTIONS.SET_USER, payload: result.user });
      }
    };
    loadUser();
  }, []);

  // Initialize app and load user data
  const initializeApp = async () => {
    try {
      const userResult = await getOrCreateUser();
      if (userResult.success) {
        const userData = userResult.data;

        // Ensure settings have default values
        const settings = { ...DEFAULT_TIMER_SETTINGS, ...userData.settings };
        const panels = Array.isArray(userData.panels) ? userData.panels : [
          { name: "Pomodoro", sessions: 0 },
          { name: "Rest", sessions: 0 },
          { name: "Long Rest", sessions: 0 }
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

  // Sync user data with backend
  const syncUserData = async (updatedUser) => {
    if (!user) {
      console.log('No user found');
      return;
    }

    try {
      const userId = getCurrentUserId();
      const result = await updateUser(userId, updatedUser);

      if (result.success) {
        dispatch({ type: USER_ACTIONS.SET_USER, payload: result.data });
      } else {
        console.log("Failed to update user", result.error);
      }
    } catch (e) {
      console.log("Failed to update user", e.message);
    }
  };

  // Timer settings updaters
  const updateTimerSettings = useCallback(async (newSettings) => {
    dispatch({ type: USER_ACTIONS.UPDATE_SETTINGS, payload: { ...newSettings } });

    const updatedUser = { ...user, settings: { ...user.settings, ...newSettings } };
    await syncUserData(updatedUser);
  }, [syncUserData, user]);

  const updateAutoStartState = useCallback(async (autoStartState) => {
    dispatch({
      type: USER_ACTIONS.UPDATE_SETTINGS,
      payload: { ...user.settings, autoStart: autoStartState }
    });

    const updatedUser = {
      ...user,
      settings: { ...user.settings, autoStart: autoStartState }
    };
    await syncUserData(updatedUser);
  }, [syncUserData, user]);

  // Panel updaters
  const updatePanels = useCallback(async (panelIndex, updatedPanelData) => {
    const panelsRollback = [...user.panels];
    try {
      dispatch({
        type: USER_ACTIONS.UPDATE_PANELS,
        payload: { index: panelIndex, data: updatedPanelData }
      });

      const currentPanels = [...user.panels];
      if (currentPanels[panelIndex]) {
        currentPanels[panelIndex] = { ...currentPanels[panelIndex], ...updatedPanelData };
      }
      const updatedUser = { ...user, panels: currentPanels };
      await syncUserData(updatedUser);
    } catch (e) {
      dispatch({ type: USER_ACTIONS.SET_USER, payload: { ...user, panels: panelsRollback } });
      console.log(e.message);
    }
  }, [syncUserData, user]);

  // Session restart handler
  const handleSessionRestart = useCallback(async () => {
    try {
      setIsSessionRestarted(true);
      dispatch({ type: USER_ACTIONS.RESET_SESSION });

      const restedUser = {
        ...user,
        lastActive: Date.now(),
        settings: DEFAULT_TIMER_SETTINGS,
        panels: DEFAULT_PANELS,
        tasks: []
      };
      await syncUserData(restedUser);
      console.log("user has rested");
    } catch (e) {
      console.error('Failed to restart session:', e);
    } finally {
      setIsSessionRestarted(false);
    }
  }, [syncUserData, user]);

  // Task management handlers
  const updateTasks = useCallback(async (task) => {
    try {
      dispatch({ type: USER_ACTIONS.ADD_TASK, payload: task });

      const currentTasks = [...user.tasks, task];
      const updatedUser = { ...user, tasks: currentTasks };
      await syncUserData(updatedUser);
    } catch (e) {
      console.log(e.message);
    }
  }, [syncUserData, user]);

  const updateTaskData = useCallback(async (taskIndex, updatedTaskData) => {
    const tasksRollback = [...user.tasks];
    try {
      dispatch({
        type: USER_ACTIONS.UPDATE_TASK,
        payload: { index: taskIndex, data: updatedTaskData }
      });

      const currentTasks = [...user.tasks];
      if (currentTasks[taskIndex]) {
        currentTasks[taskIndex] = { ...currentTasks[taskIndex], ...updatedTaskData };
      }
      const updatedUser = { ...user, tasks: currentTasks };
      await syncUserData(updatedUser);
    } catch (e) {
      dispatch({ type: USER_ACTIONS.SET_USER, payload: { ...user, tasks: tasksRollback } });
      console.log(e.message);
    }
  }, [syncUserData, user]);

  const deleteOneTask = useCallback(async (taskIndex) => {
    try {
      dispatch({
        type: USER_ACTIONS.DELETED_TASK,
        payload: { index: taskIndex }
      });

      const currentTasks = Array.isArray(user.tasks) ? [...user.tasks] : [];
      const updatedTasks = currentTasks.filter((task, index) => index !== taskIndex);
      const updatedUser = { ...user, tasks: updatedTasks };
      await syncUserData(updatedUser);
    } catch (e) {
      console.log(e.message);
    }
  }, [user]);

  const deleteAllTasks = useCallback(async () => {
    try {
      dispatch({ type: USER_ACTIONS.DELETE_ALL_TASKS });

      const updatedUser = { ...user, tasks: [] };
      await syncUserData(updatedUser);
    } catch (e) {
      console.log(e.message);
    }

    // Alternative implementation using deleteOneTask:
    /*
    const deleteAllTasks = async() => {
      const currentTasks = safeUserTasks;
      const deletePromises = currentTasks.map((task, index) => {
        return deleteOneTask(index);
      });

      await Promise.all(deletePromises);
    }
    */
  }, [syncUserData, user]);

  const deleteCompletedTasks = useCallback(async () => {
    try {
      dispatch({ type: USER_ACTIONS.DELETE_COMPLETED_TASKS });

      const remainingTasks = user.tasks.filter(task => !task.completed);
      const updatedUser = { ...user, tasks: remainingTasks };
      await syncUserData(updatedUser);
    } catch (e) {
      console.log(e.message);
    }
  }, [syncUserData, user]);

  // Report state handler
  const updateReportState = useCallback((state) => {
    setIsReportOpen(state);
  }, []);

  //Before Unload
  useEffect(() => {
   const handleBeforeUnload = (e) => {
     if(isClockRunning) {
       e.preventDefault();
       e.returnValue = '';
       return ''; //for old browsers
     }
   }
     addEventListener("beforeunload", handleBeforeUnload);

     return () => removeEventListener("beforeunload", handleBeforeUnload);
  }, [isClockRunning]);
  // Memoized computed values
  const autoStartEnabled = useMemo(() => {
    return user.settings?.autoStart || false;
  }, [user.settings?.autoStart]);

  // Memoized component props
  const headerProps = useMemo(() => ({
    className: `h-full w-full `,
    DEFAULT_TIMER_SETTINGS: DEFAULT_TIMER_SETTINGS,
    autoStart: user.settings?.autoStart || false,
    onUpdateTimerSettings: updateTimerSettings,
    onUpdateAutoStartState: updateAutoStartState,
    isClockClicked: isClockClicked,
    isClockRunning: isClockRunning,
    onUpdateClockState: updateClockState,
    isSessionRestarted: isSessionRestarted,
    onUpdateSessionRestarted: handleSessionRestart,
    isReportOpen: isReportOpen,
    onUpdateReportState: updateReportState
  }), [
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
    className: "min-w-full sm:w-[75%] h-full",
    userPanels: user.panels,
    onUpdatePanel: updatePanels,
    onClockClick: handleClockClick,
    isClockRunning,
    onUpdateClockState: updateClockState,
    isSessionRestarted,
    onSessionRestarted: handleSessionRestart,
  }), [
    user.settings,
    user.panels,
    autoStartEnabled,
    updatePanels,
    handleClockClick,
    isClockRunning,
    updateClockState,
    isSessionRestarted,
    handleSessionRestart,
  ]);

  const todoProps = useMemo(() => ({
    className: "min-h-full min-w-full",
    userTasks: user.tasks,
    onUpdateTasks: updateTasks,
    onUpdateTaskData: updateTaskData,
    onDeleteOneTask: deleteOneTask,
    onDeleteAllTasks: deleteAllTasks,
    onDeleteCompletedTasks: deleteCompletedTasks,
  }), [
    user.tasks,
    updateTasks,
    updateTaskData,
    deleteOneTask,
    deleteAllTasks,
    deleteCompletedTasks,
  ]);

  return (
      <Provider store={store}>
        <TimerSettingsContext.Provider value={{timerSettings: user.settings, autoStart: autoStartEnabled}}>
          <div className={`h-auto max-w-full sm:h-[100vh] flex flex-col `}>
            <div className="h-[60px] w-full ">
              <ReactErrorBoundary
                  FallbackComponent={HeaderErrorFallback}
                  onReset={() => {
                    window.location.reload();
                  }}
              >
                <Header {...headerProps} />
              </ReactErrorBoundary>
            </div>
            <div className="flex max-w-full flex-col sm:flex-row h-[calc(100%-60px-30px)]">
              <div className="max-w-full sm:w-[75%] min-  h-full">
                <ReactErrorBoundary
                    FallbackComponent={PomodoroErrorFallback}
                    onReset={() => {
                      window.location.reload();
                    }}
                >
                  <Pomodoro {...pomodoroProps} />
                </ReactErrorBoundary>
              </div>
              <div className="max-w-full sm:w-[25%] min-h-full border-l border-gray-300">
                <ReactErrorBoundary
                    FallbackComponent={TodoErrorFallback}
                    onReset={() => {
                      window.location.reload();
                    }}
                >
                  <ToDoSection {...todoProps} />
                </ReactErrorBoundary>
              </div>

            </div>
          </div>
        </TimerSettingsContext.Provider>
      </Provider>
  );
}

export default App;