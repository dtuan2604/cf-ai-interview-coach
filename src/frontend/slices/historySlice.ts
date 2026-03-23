import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { GetHistoryResponse, HistorySessionSummary } from '../../shared/types'
import { interviewApi } from '../services/interviewApi'
import { endInterviewSession } from './sessionSlice'

type HistoryState = {
  items: HistorySessionSummary[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: HistoryState = {
  items: [],
  status: 'idle',
  error: null,
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected history error.'
}

export const loadInterviewHistory = createAsyncThunk<
  GetHistoryResponse,
  void,
  { rejectValue: string }
>(
  'history/loadInterviewHistory',
  async (_, thunkApi) => {
    try {
      return await interviewApi.getHistory()
    } catch (error) {
      return thunkApi.rejectWithValue(toErrorMessage(error))
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { history: HistoryState }
      return state.history.status === 'idle' || state.history.status === 'failed'
    },
  },
)

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadInterviewHistory.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadInterviewHistory.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
      })
      .addCase(loadInterviewHistory.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Unable to load history.'
      })
      .addCase(endInterviewSession.fulfilled, (state, action) => {
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
