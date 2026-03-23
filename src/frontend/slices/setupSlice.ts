import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { InterviewMode } from '../../shared/types'

type SetupState = {
  role: string
  interviewType: string
  difficulty: string
  mode: InterviewMode
}

const initialState: SetupState = {
  role: 'Frontend Engineer',
  interviewType: 'Technical',
  difficulty: 'Mid-level',
  mode: 'text',
}

const setupSlice = createSlice({
  name: 'setup',
  initialState,
  reducers: {
    setRole: (state, action: PayloadAction<string>) => {
      state.role = action.payload
    },
    setInterviewType: (state, action: PayloadAction<string>) => {
      state.interviewType = action.payload
    },
    setDifficulty: (state, action: PayloadAction<string>) => {
      state.difficulty = action.payload
    },
    setMode: (state, action: PayloadAction<InterviewMode>) => {
      state.mode = action.payload
    },
    resetSetup: () => initialState,
  },
})

export const { resetSetup, setDifficulty, setInterviewType, setMode, setRole } =
  setupSlice.actions
export const setupReducer = setupSlice.reducer
