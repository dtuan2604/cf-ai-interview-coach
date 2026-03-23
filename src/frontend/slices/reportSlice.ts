import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { GetReportResponse, InterviewReport } from '../../shared/types'
import { interviewApi } from '../services/interviewApi'

type ReportState = {
  current: InterviewReport | null
  currentSessionId: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: ReportState = {
  current: null,
  currentSessionId: null,
  status: 'idle',
  error: null,
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected report error.'
}

export const loadInterviewReport = createAsyncThunk<
  GetReportResponse,
  string,
  { rejectValue: string }
>(
  'report/loadInterviewReport',
  async (sessionId, thunkApi) => {
    try {
      return await interviewApi.getReport(sessionId)
    } catch (error) {
      return thunkApi.rejectWithValue(toErrorMessage(error))
    }
  },
  {
    condition: (sessionId, { getState }) => {
      const state = getState() as { report: ReportState }
      if (state.report.status === 'loading' && state.report.currentSessionId === sessionId) {
        return false
      }

      if (state.report.status === 'succeeded' && state.report.currentSessionId === sessionId) {
        return false
      }

      return true
    },
  },
)

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadInterviewReport.pending, (state, action) => {
        state.status = 'loading'
        state.currentSessionId = action.meta.arg
        state.error = null
      })
      .addCase(loadInterviewReport.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.currentSessionId = action.meta.arg
        state.current = action.payload.report
      })
      .addCase(loadInterviewReport.rejected, (state, action) => {
        state.status = 'failed'
        state.currentSessionId = action.meta.arg
        state.error = action.payload ?? 'Unable to load the report.'
      })
  },
})

export const reportReducer = reportSlice.reducer
