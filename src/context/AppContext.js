import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subjectsData } from '../data/subjectsData';

export const AppContext = createContext();

export const ACTION_TYPES = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SET_BRANCH: 'SET_BRANCH',
  MARK_ATTENDANCE: 'MARK_ATTENDANCE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  RESTORE_STATE: 'RESTORE_STATE',
};

const STORAGE_KEY = '@iiit_nr_workspace_state_v1';

export const generateRealisticAttendance = (branch = 'CSE') => {
  const subjects = subjectsData[branch] || subjectsData.CSE;
  const attendance = {};

  subjects.forEach((subject, index) => {
    // Alternate between safe (>80%) and warning (70-74%)
    const isWarning = index === 1 || index === 3;
    const total = 28 + (index % 5);
    let present;

    if (isWarning) {
      // 70% to 74%
      present = Math.round(total * (0.71 + (index % 3) * 0.015));
    } else {
      // 82% to 92%
      present = Math.round(total * (0.84 + (index % 4) * 0.025));
    }

    if (present > total) present = total;

    attendance[subject.id] = {
      present,
      total,
    };
  });

  return attendance;
};

const initialState = {
  user: null, // { name, email, rollNo, semester, branch, avatar }
  isAuthenticated: false,
  currentBranch: 'CSE',
  attendance: generateRealisticAttendance('CSE'),
  isLoading: true,
};

function appReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.LOGIN: {
      const branch = action.payload.branch || state.currentBranch || 'CSE';
      const branchAttendance = generateRealisticAttendance(branch);

      const user = {
        name: action.payload.name || 'Student Name',
        email: action.payload.email || 'student@iiitnr.edu.in',
        rollNo: action.payload.rollNo || '21100BT001',
        semester: action.payload.semester || '6th Semester',
        branch: branch,
        avatar:
          action.payload.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        ...action.payload,
      };

      return {
        ...state,
        isAuthenticated: true,
        user,
        currentBranch: branch,
        attendance: {
          ...state.attendance,
          ...branchAttendance,
          ...(action.payload.attendance || {}),
        },
        isLoading: false,
      };
    }

    case ACTION_TYPES.LOGOUT: {
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    }

    case ACTION_TYPES.SET_BRANCH: {
      const branch = action.payload;
      const updatedUser = state.user ? { ...state.user, branch } : null;
      const hasAttendanceForBranch = subjectsData[branch]?.every(
        (sub) => state.attendance[sub.id]
      );

      const newAttendance = hasAttendanceForBranch
        ? state.attendance
        : {
            ...state.attendance,
            ...generateRealisticAttendance(branch),
          };

      return {
        ...state,
        currentBranch: branch,
        user: updatedUser,
        attendance: newAttendance,
      };
    }

    case ACTION_TYPES.MARK_ATTENDANCE: {
      const { subjectId, status } = action.payload;
      const current = state.attendance[subjectId] || { present: 0, total: 0 };
      const isPresent = status === 'present';

      const updated = {
        present: current.present + (isPresent ? 1 : 0),
        total: current.total + 1,
      };

      return {
        ...state,
        attendance: {
          ...state.attendance,
          [subjectId]: updated,
        },
      };
    }

    case ACTION_TYPES.UPDATE_PROFILE: {
      const updatedUser = state.user
        ? { ...state.user, ...action.payload }
        : { ...action.payload };

      const branch = updatedUser.branch || state.currentBranch;

      return {
        ...state,
        user: updatedUser,
        currentBranch: branch,
      };
    }

    case ACTION_TYPES.RESTORE_STATE: {
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
    }

    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Restore state from AsyncStorage on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          dispatch({
            type: ACTION_TYPES.RESTORE_STATE,
            payload: {
              user: parsed.user || null,
              isAuthenticated: !!parsed.isAuthenticated,
              currentBranch: parsed.currentBranch || 'CSE',
              attendance: parsed.attendance || generateRealisticAttendance('CSE'),
            },
          });
          return;
        }
      } catch (e) {
        console.warn('Failed to load session from storage:', e);
      }
      dispatch({
        type: ACTION_TYPES.RESTORE_STATE,
        payload: { isLoading: false },
      });
    };

    restoreSession();
  }, []);

  // Save session to AsyncStorage when state changes
  useEffect(() => {
    if (!state.isLoading) {
      const persistSession = async () => {
        try {
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              user: state.user,
              isAuthenticated: state.isAuthenticated,
              currentBranch: state.currentBranch,
              attendance: state.attendance,
            })
          );
        } catch (e) {
          console.warn('Failed to save session to storage:', e);
        }
      };

      persistSession();
    }
  }, [state.user, state.isAuthenticated, state.currentBranch, state.attendance, state.isLoading]);

  // Context Actions
  const login = (userData) => {
    dispatch({ type: ACTION_TYPES.LOGIN, payload: userData });
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove session on logout:', e);
    }
    dispatch({ type: ACTION_TYPES.LOGOUT });
  };

  const setBranch = (branch) => {
    dispatch({ type: ACTION_TYPES.SET_BRANCH, payload: branch });
  };

  const markAttendance = (subjectId, status) => {
    dispatch({ type: ACTION_TYPES.MARK_ATTENDANCE, payload: { subjectId, status } });
  };

  const updateProfile = (data) => {
    dispatch({ type: ACTION_TYPES.UPDATE_PROFILE, payload: data });
  };

  // Helper calculation functions
  const getSubjectAttendance = (subjectId) => {
    const record = state.attendance[subjectId] || { present: 0, total: 0 };
    const percentage = record.total > 0 ? (record.present / record.total) * 100 : 0;

    // Minimum 75% calculation
    let classesNeededFor75 = 0;
    let safeBunks = 0;

    if (percentage < 75) {
      // (present + x) / (total + x) >= 0.75 => x >= 3*total - 4*present
      classesNeededFor75 = Math.max(0, 3 * record.total - 4 * record.present);
    } else {
      // present / (total + x) >= 0.75 => 4*present >= 3*total + 3*x => x <= (4*present - 3*total)/3
      safeBunks = Math.max(0, Math.floor((4 * record.present - 3 * record.total) / 3));
    }

    return {
      present: record.present,
      total: record.total,
      percentage: Number(percentage.toFixed(1)),
      isWarning: percentage < 75,
      classesNeededFor75,
      safeBunks,
    };
  };

  const calculateOverallAttendance = (branch = state.currentBranch) => {
    const subjects = subjectsData[branch] || subjectsData.CSE;
    let totalPresent = 0;
    let totalClasses = 0;

    subjects.forEach((subj) => {
      const record = state.attendance[subj.id];
      if (record) {
        totalPresent += record.present;
        totalClasses += record.total;
      }
    });

    const percentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

    return {
      totalPresent,
      totalClasses,
      percentage: Number(percentage.toFixed(1)),
      isWarning: percentage < 75,
    };
  };

  const value = {
    state,
    dispatch,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    currentBranch: state.currentBranch,
    attendance: state.attendance,
    isLoading: state.isLoading,
    login,
    logout,
    setBranch,
    markAttendance,
    updateProfile,
    getSubjectAttendance,
    calculateOverallAttendance,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
