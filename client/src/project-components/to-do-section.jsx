import React from "react";
import { useState, useRef, useEffect } from "react";
import { Trash2, Pencil, Check, Ellipsis, EyeOff, Eye } from 'lucide-react';

function ToDoSectionComponent({ className, userTasks, onUpdateTasks, onDeleteAllTasks, onDeleteOneTask, onUpdateTaskData, onDeleteCompletedTasks }) {
  // State
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [newlyAddedTask, setNewlyAddedTask] = useState(new Set());
  const [completedTasks, setCompletedTasks] = useState(new Set());

  // Refs
  const dropDownRef = useRef(null);
  const dropDownButtonRef = useRef(null);
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const editFormRef = useRef(null);
  const editInputRef = useRef(null);
  const lastTaskRef = useRef(null);
  const ulRef = useRef(null);

  useEffect(() => {
    loadTasks();
  }, [userTasks]);

  const loadTasks = async() => {
    try {
      const tasksWithIndexes = userTasks.map((task, index) => ({
        ...task,
        index: index
      }))
      setTasks(prevTasks => tasksWithIndexes);
    } catch(error) {
      setError("Failed to load tasks");
    }
  };

  // Menu configuration
  const menu = [
    {
      id: 1,
      text: hideCompleted ? "Show completed tasks" : "Hide completed tasks",
      action: hideCompleted ? "show" : "hide",
      icon: hideCompleted ? Eye : EyeOff
    },
    {
      id: 3,
      text: "Remove completed list",
      action: "removeCompletedList",
      icon: Trash2
    },
    {
      id: 2,
      text: "Remove to do list",
      action: "removeList",
      icon: Trash2,
      danger: true
    }
  ];

  // Computed values - FIXED SORTING
  const sortedTasks = tasks
    .filter((task) => hideCompleted ? !task.completed : true)
    .sort((a, b) => {
      // First sort by completion status (incomplete tasks first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // If both are completed, sort by completion time (most recent first)
      if (a.completed && b.completed) {
        return (b.completedAt || 0) - (a.completedAt || 0);
      }
      // If both are incomplete, sort by original index
      return a.index - b.index;
    })
    .map((task, displayIndex) => ({
      ...task,
      displayIndex // Add display index for UI purposes
    }));

  const activeTasks = tasks.filter(task => !task.completed);

  // Helper Functions
  const needsScrolling = (element) => {
    if (!element) return false;
    return element.scrollHeight > element.clientHeight;
  }

  // Find original task index from display index
  const getOriginalTaskIndex = (displayIndex) => {
    const task = sortedTasks[displayIndex];
    return task ? task.index : -1;
  };

  // Menu handlers
  const handleShowOptions = () => {
    setDropDownOpen(!dropDownOpen);
  }

  const hideCompletedOption = () => {
    setHideCompleted(true);
  };

  const showCompletedOption = () => {
    setHideCompleted(false);
  };

  const deleteCompletedOption = async() => {
    const confirmDialog = "Are you sure you want to delete completed tasks? This action cannot be undone.";
    if(window.confirm(confirmDialog)) {
      setHideCompleted(false);
      setTasks(prevTasks => prevTasks.filter(task => !task.completed));
      const completedTasks = tasks.filter(task => task.completed);
      await onDeleteCompletedTasks(completedTasks);
    }
  };

  const deleteListOption = async() => {
    const confirmDialog = "Are you sure you want to delete all tasks? This action cannot be undone.";
    if (window.confirm(confirmDialog)) {
      setTasks([]);
      await onDeleteAllTasks();
    }
  };

  const handleOptionClick = (option) => {
    const chosenOption = option.action;

    if (chosenOption === "hide") {
      hideCompletedOption();
    } else if (chosenOption === "show") {
      showCompletedOption();
    } else if (chosenOption === "removeCompletedList") {
      deleteCompletedOption();
    } else if (chosenOption === "removeList") {
      deleteListOption();
    }

    setDropDownOpen(false);
  };

  // Task Validation
  const validateTask = (text) =>{
    const trimmed = text.trim();
    if(!trimmed){
      inputRef.current.value = "";
      return "Please enter a valid task";
    }
    if(trimmed.length > 200){
      inputRef.current.value = "";
      return "Task is too long (max 200 character)";
    }
    return null;
  }

  // Task handlers - FIXED TO USE ORIGINAL INDEX
  const handleCompleteTask = async(displayIndex) => {
    const originalIndex = getOriginalTaskIndex(displayIndex);
    if (originalIndex === -1) return;

    const currentTask = tasks[originalIndex];
    const updatedTaskData = {
      completed: !currentTask.completed,
      completedAt: !currentTask.completed ? Date.now() : null
    };

    setTasks(prevTasks => prevTasks.map((task, index) =>
      index === originalIndex
        ? { ...task, ...updatedTaskData }
        : task
    ));

    await onUpdateTaskData(originalIndex, updatedTaskData); // Use this instead
  };

  const handleDeleteTask = async(displayIndex) => {
    const originalIndex = getOriginalTaskIndex(displayIndex);
    if (originalIndex === -1) return;

    setTasks(prevTasks => prevTasks.filter((task, index) => index !== originalIndex));
    await onDeleteOneTask(originalIndex);
  };

  const handleEditTask = (displayIndex) => {
    const originalIndex = getOriginalTaskIndex(displayIndex);
    if (originalIndex === -1) return;

    setEditingTaskIndex(originalIndex);
    setError("");
  };

  // Form handlers
  const handleSubmit = async(e) => {
    e.preventDefault();
    setError("");
    const taskText = inputRef.current.value;
    const validationError = validateTask(taskText);

    if(validationError){
      setError(validationError);
      return;
    }

    inputRef.current.value = "";

    try {
      const tempId = tasks.length;
      let createdTask = {
        index: tempId,
        text: taskText.trim(),
        completed: false,
        completedAt: null
      };
      setTasks(prevTasks => [...prevTasks, createdTask]);

      setNewlyAddedTask(prevSet => {
        const newSet = new Set(prevSet);
        newSet.add(tempId);
        return newSet;
      })
      setTimeout(() => {
        setNewlyAddedTask(prevSet => {
          const newSet = new Set(prevSet);
          newSet.delete(tempId);
          return newSet;
        })
      }, 500);

      await onUpdateTasks({
        text: taskText,
        completed: false,
        completedAt: null
      });
    } catch(error) {
      setError(error.message || "Failed to create task");
      inputRef.current.value = taskText;
      setShowForm(true);
    }
  };

  const handleCancel = () => {
    inputRef.current.value = "";
    setError("");
    setShowForm(false);
  };

  const handleEditingSubmit = async(e, originalTaskIndex) => {
    e.preventDefault();
    setError("");
    const updatedTaskText = editInputRef.current.value;
    const validationError = validateTask(updatedTaskText);

    if(validationError){
      setError(validationError);
      return;
    }
    const trimmedText = updatedTaskText.trim();

    const previousTasks = [...tasks];

    setTasks(prevTasks =>
      prevTasks.map((task, index) =>
        index === originalTaskIndex
          ? { ...task, text: trimmedText }
          : task
      )
    )
    setEditingTaskIndex(null);
    setError("");
    try {
      await onUpdateTaskData(originalTaskIndex, {text: trimmedText});
    } catch (error) {
      setTasks(previousTasks);
      setEditingTaskIndex(originalTaskIndex);
      setError(error.message || "Failed to update task");
    }
  };

  const handleEditingCancel = () => {
    editInputRef.current.value = "";
    setError("");
    setEditingTaskIndex(null);
  };

  // Effects
  useEffect(() => {
    const handleClickOutSideDropDown = (e) => {
      if (dropDownRef.current && !dropDownRef.current.contains(e.target)
        && !dropDownButtonRef.current.contains(e.target)) {
        setDropDownOpen(false);
      }
    };

    if (dropDownOpen) {
      document.addEventListener('mousedown', handleClickOutSideDropDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutSideDropDown);
    };
  }, [dropDownOpen]);

  useEffect(() => {
    const handleClickOutSideForm = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setShowForm(false);
      }
    };

    if (showForm) {
      document.addEventListener('mousedown', handleClickOutSideForm);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutSideForm);
    };
  }, [showForm]);

  useEffect(() => {
    if (showForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showForm]);

  useEffect(() => {
    if (editingTaskIndex !== null && editInputRef.current) {
      const currentTask = tasks[editingTaskIndex];
      editInputRef.current.value = currentTask?.text || "";
      editInputRef.current.focus();
    }
  }, [editingTaskIndex, tasks]);

  useEffect(() => {
    const scrollToLastTask = () => {
      if(needsScrolling(ulRef.current)){
        lastTaskRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }

    const timeOutId = setTimeout(scrollToLastTask, 150);

    return () => clearTimeout(timeOutId);
  }, [tasks]);

  return (
    <div className={`tasks-list-container flex flex-col gap-5 p-5 overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center text-3xl font-bold select-none">
        <span>
          Tasks <span className="text-2xl font-medium ">{activeTasks.length}</span>
        </span>

        {/* Dropdown Menu */}
        <div className="relative transition-all duration-300 ease-linear">
          <button
            ref={dropDownButtonRef}
            onClick={handleShowOptions}
            className="group flex justify-center items-center w-9 h-9 bg-gray-200 hover:bg-blue-200 rounded-full cursor-pointer transition-all duration-200 ease-in-out"
          >
            <Ellipsis
              size={28}
              className="text-gray-600 group-hover:text-blue-600"
            />
          </button>

          {dropDownOpen && (
            <div
              ref={dropDownRef}
              className="absolute right-0 z-10 w-[250px] h-[180px] bg-white rounded-xl shadow-lg"
            >
              <div className="flex flex-col justify-between items-start h-full gap-1 py-5 px-3">
                {menu.map((option) => {
                  const ComponentIcon = option.icon;
                  return (
                    <button
                      onClick={() => handleOptionClick(option)}
                      key={option.id}
                      className={`group flex flex-1 items-center w-full gap-1 px-1 text-sm font-md text-gray-600 rounded-md cursor-pointer transition-all duration-300 ease-in-out ${
                        option.danger ? "hover:bg-red-200" : "hover:bg-blue-200"
                      }`}
                    >
                      <ComponentIcon className={option.danger ? "group-hover:text-red-600" : "group-hover:text-blue-600"} />
                      <span className={option.danger ? "group-hover:text-red-600" : "group-hover:text-blue-600"}>
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex flex-col flex-1 items-start gap-2 overflow-y-auto">
        <ul
          ref={ulRef}
          className="list-container flex flex-col  w-full gap-1 overflow-y-auto">
          {sortedTasks.map((task, displayIndex) => (
            <li
              ref={displayIndex === sortedTasks.length - 1 && !task.completed ? lastTaskRef : null}
              key={task.index} // Use original index as key for stability
              className={`${task.completed ? "bg-gray-100" : ""} ${newlyAddedTask.has(task.index)
                ? "task-animate"
                : ""
              } ${
                task.index === editingTaskIndex
                  ? ""
                  : "group/task flex flex-shrink-0 justify-between items-center w-full min-h-[70px] px-4 border border-gray-200 rounded-xl shadow-sm overflow-hidden cursor-pointer"
              }
            `}
            >
              {task.index === editingTaskIndex ? (
                // Edit Form
                <div
                  ref={editFormRef}
                  className="relative flex flex-col w-full h-[110px] gap-3 p-5 border border-gray-300 rounded-xl"
                >
                  <input
                    ref={editInputRef}
                    type="text"
                    name="task-text"
                    placeholder="Edit Task"
                    className="outline-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEditingSubmit(e, task.index);
                      } else if (e.key === "Escape") {
                        handleEditingCancel();
                      }
                    }}
                    onChange={() => setError("")}
                  />
                  {error && (
                    <p className="absolute top-7 right-5 text-xs text-red-500">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleEditingSubmit(e, task.index)}
                      className="px-6 py-1 bg-blue-600 text-white rounded-md cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditingCancel}
                      className="px-6 py-1 text-black hover:bg-blue-200 hover:text-blue-600 rounded-md cursor-pointer duration-100 ease-linear"
                    >
                      cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Task Display
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      onClick={() => handleCompleteTask(displayIndex)}
                      className={`group flex justify-center items-center w-6 h-6 pt-[1px] border border-gray-600 rounded-full cursor-pointer ${
                        task.completed
                          ? "bg-gray-600"
                          : "hover:bg-blue-200 hover:border-gray-300 transition-all duration-300"
                      }`}
                    >
                      <Check
                        size={15}
                        className={`flex-shrink-0 transition-all duration-300 ${
                          task.completed
                            ? "text-white"
                            : "opacity-0 group-hover:opacity-100 group-hover:text-blue-600"
                        }`}
                      />
                    </div>
                    <span
                      className={`flex-1 min-w-0 leading-relaxed break-words break-all overflow-wrap-anywhere ${
                        task.completed ? "line-through text-gray-600" : ""
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover/task:opacity-100 transition-all duration-200 ease-in-out">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(displayIndex);
                      }}
                      className="flex justify-center items-center w-10 h-10 bg-gray-200 hover:bg-blue-200 hover:text-blue-600 rounded-full cursor-pointer transition-all duration-300 ease-in-out"
                    >
                      <Trash2 size={24} />
                    </div>
                    <div
                      onClick={() => handleEditTask(displayIndex)}
                      className="flex justify-center items-center w-10 h-10 bg-gray-200 hover:bg-blue-200 hover:text-blue-600 rounded-full cursor-pointer transition-all duration-300 ease-in-out"
                    >
                      <Pencil size={24} />
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        {/* Add Task Section */}
        <div className="w-full">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex justify-start items-center w-[calc(100%-1%)] h-[80px] py-3 px-5 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100 rounded-xl cursor-pointer focus:outline-0 focus:border-gray-400"
            >
              + Add here the task you will focus on
            </button>
          ) : (
            // Add Task Form
            <div
              ref={formRef}
              className="relative flex flex-col w-[calc(100%-1%)] h-[110px] gap-3 p-5 border border-gray-300 rounded-xl"
            >
              <input
                ref={inputRef}
                type="text"
                name="task-text"
                placeholder="Add Task"
                className="outline-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit(e);
                  } else if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
                onChange={() => setError("")}
              />
              {error && (
                <p className="absolute top-7 right-5 text-xs text-red-500">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-1 bg-blue-600 text-white rounded-md cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-1 text-black hover:bg-blue-200 hover:text-blue-600 rounded-md cursor-pointer duration-100 ease-linear"
                >
                  cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ToDoSection = React.memo(ToDoSectionComponent);
export default ToDoSection;