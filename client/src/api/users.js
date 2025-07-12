import axios from "axios";

const PORT = import.meta.env.VITE_PORT || 3000;
const URL = `http://localhost:${PORT}`;

// Generate or retrieve user ID from localStorage
export const getUserId = () => {
  let userId = localStorage.getItem("pomodoroUserId");
  if (!userId) {
    userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("pomodoroUserId", userId);
  }
  return userId;
};

export const getOrCreateUser = async () => {
  try {
    const userId = getUserId();
    const existingUser = await getUserByCustomId(userId);
    if (existingUser.success) {
      return existingUser;
    }
    return await createUserWithCustomId(userId);
  } catch (e) {
    console.error("getOrCreateUser error:", e);
    return { success: false, error: "Failed to get or create user" };
  }
};

export const getUserByCustomId = async (userId) => {
  try {
    // Changed route to match backend
    const response = await axios.get(`${URL}/users/${userId}`);
    return { success: true, data: response.data };
  } catch (e) {
    let errorMessage = "Something went wrong!";
    if (e.response) {
      switch (e.response.status) {
        case 404:
          errorMessage = "user not found";
          break;
        case 500:
          errorMessage = "Server error. Please try again later";
          break;
        default:
          errorMessage = `Error ${e.response.status}`;
      }
    } else if (e.request) {
      errorMessage = "Unable to connect to server";
    }
    return { success: false, error: errorMessage };
  }
};

export const createUserWithCustomId = async (userId) => {
  try {
    const newUser = {
      _id: userId,
      createdAt: Date.now(),
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
    };
    const response = await axios.post(`${URL}/users`, newUser);
    return { success: true, data: response.data };
  } catch (e) {
    let errorMessage = "Something went wrong!";
    if (e.response) {
      switch (e.response.status) {
        case 409:
          errorMessage = "User already exists";
          break;
        case 500:
          errorMessage = "Server error. Please try again later";
          break;
        default:
          errorMessage = `Error ${e.response.status}`;
      }
    } else if (e.request) {
      errorMessage = "Unable to connect to server";
    }
    return { success: false, error: errorMessage };
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    const response = await axios.patch(`${URL}/users/${userId}`, updatedData);
    if (response) {
      return { success: true, data: response.data };
    }
  } catch (e) {
    let errorMessage = "Something went wrong!";
    if (e.response) {
      switch (e.response.status) {
        case 404:
          errorMessage = "User not found";
          break;
        case 500:
          errorMessage = "Server error. Please try again later";
          break;
        default:
          errorMessage = `Error ${e.response.status}`;
      }
    } else if (e.request) {
      errorMessage = "Unable to connect to server";
    }
    return { success: false, error: errorMessage };
  }
};

export const clearUserData = () => {
  localStorage.removeItem("pomodoroUserId");
};

export const getCurrentUserId = () => {
  return localStorage.getItem("pomodoroUserId");
};

export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${URL}/users/${userId}`);
    return { success: true, data: response.data };
  } catch (e) {
    let errorMessage = "Something went wrong!";
    if (e.response) {
      switch (e.response.status) {
        case 404:
          errorMessage = "User not found";
          break;
        case 500:
          errorMessage = "Server error. Please try again later";
          break;
        default:
          errorMessage = `Error ${e.response.status}`;
      }
    } else if (e.request) {
      errorMessage = "Unable to connect to server";
    }
    return { success: false, error: errorMessage };
  }
};