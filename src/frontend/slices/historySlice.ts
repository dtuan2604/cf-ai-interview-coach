import { createSlice } from '@reduxjs/toolkit'
import type { HistorySessionSummary } from '../../shared/types'
import { endInterviewSession } from './sessionSlice'

type HistoryState = {
  items: HistorySessionSummary[]
}

const initialState: HistoryState = {
  items: [
    {
      id: 'session-demo-001',
      role: 'Frontend Engineer',
      interviewType: 'Technical',
      difficulty: 'Mid-level',
      mode: 'Text',
      status: 'completed',
      score: 7.6,
      completedAt: '2026-03-18T17:20:00.000Z',
      summary: 'Strong communication, but several answers stayed too high level.',
    },
    {
      id: 'session-demo-002',
      role: 'Product Manager',
      interviewType: 'Behavioral',
      difficulty: 'Senior',
      mode: 'Voice',
      status: 'completed',
      score: 8.4,
      completedAt: '2026-03-20T14:05:00.000Z',
      summary: 'Clear ownership examples and sharper prioritization tradeoff framing.',
    },
  ],
}

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(endInterviewSession.fulfilled, (state, action) => {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.payload.historyEntry.id,
      )

      if (existingIndex >= 0) {
        state.items.splice(existingIndex, 1)
      }

      state.items.unshift(action.payload.historyEntry)
    })
  },
})

export const historyReducer = historySlice.reducer
