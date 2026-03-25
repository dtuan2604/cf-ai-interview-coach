import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type {
  ApiTransport,
  DeleteSessionRequest,
  DeleteSessionResponse,
  EndSessionRequest,
  EndSessionResponse,
  GetSessionResponse,
  InterviewSessionState,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitVoiceTurnRequest,
  SubmitVoiceTurnResponse,
} from '../../shared/types'
import { appConfig } from '../services/config'
import { interviewApi } from '../services/interviewApi'

type RequestState = 'idle' | 'loading' | 'failed'

type SessionState = {
  current: InterviewSessionState | null
  transport: ApiTransport
  loadStatus: RequestState
  startStatus: RequestState
  answerStatus: RequestState
  voiceStatus: RequestState
  endStatus: RequestState
  deleteStatus: RequestState
  deleteSessionId: string | null
  deleteError: string | null
  error: string | null
}

const initialState: SessionState = {
  current: null,
  transport: appConfig.apiTransport,
  loadStatus: 'idle',
  startStatus: 'idle',
  answerStatus: 'idle',
  voiceStatus: 'idle',
  endStatus: 'idle',
  deleteStatus: 'idle',
  deleteSessionId: null,
  deleteError: null,
  error: null,
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected session error.'
}

export const loadInterviewSession = createAsyncThunk<
  GetSessionResponse,
  string,
  { rejectValue: string }
>('session/loadInterviewSession', async (sessionId, thunkApi) => {
  try {
    return await interviewApi.getSession(sessionId)
  } catch (error) {
    return thunkApi.rejectWithValue(toErrorMessage(error))
  }
})

export const startInterviewSession = createAsyncThunk<
  StartSessionResponse,
  StartSessionRequest,
  { rejectValue: string }
>('session/startInterviewSession', async (payload, thunkApi) => {
  try {
    return await interviewApi.startSession(payload)
  } catch (error) {
    return thunkApi.rejectWithValue(toErrorMessage(error))
  }
})

export const submitInterviewAnswer = createAsyncThunk<
  SubmitAnswerResponse,
  SubmitAnswerRequest,
  { rejectValue: string }
>('session/submitInterviewAnswer', async (payload, thunkApi) => {
  try {
    return await interviewApi.submitAnswer(payload)
  } catch (error) {
    return thunkApi.rejectWithValue(toErrorMessage(error))
  }
})

export const endInterviewSession = createAsyncThunk<
  EndSessionResponse,
  EndSessionRequest,
  { rejectValue: string }
>('session/endInterviewSession', async (payload, thunkApi) => {
  try {
    return await interviewApi.endSession(payload)
  } catch (error) {
    return thunkApi.rejectWithValue(toErrorMessage(error))
  }
})

export const submitInterviewVoiceTurn = createAsyncThunk<
  SubmitVoiceTurnResponse,
  SubmitVoiceTurnRequest,
  { rejectValue: string }
>('session/submitInterviewVoiceTurn', async (payload, thunkApi) => {
  try {
    return await interviewApi.submitVoiceTurn(payload)
  } catch (error) {
    return thunkApi.rejectWithValue(toErrorMessage(error))
  }
})

export const deleteInterviewSession = createAsyncThunk<
  DeleteSessionResponse,
  DeleteSessionRequest,
  { rejectValue: string }
>('session/deleteInterviewSession', async (payload, thunkApi) => {
  try {
    return await interviewApi.deleteSession(payload)
  } catch (error) {
    return thunkApi.rejectWithValue(toErrorMessage(error))
  }
})

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    clearSessionError: (state) => {
      state.error = null
      state.deleteError = null
    },
    hydrateSessionFromHistory: (state, action: PayloadAction<InterviewSessionState | null>) => {
      state.current = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInterviewSession.pending, (state) => {
        state.loadStatus = 'loading'
        state.error = null
      })
      .addCase(loadInterviewSession.fulfilled, (state, action) => {
        state.loadStatus = 'idle'
        state.current = action.payload.session
        state.transport = action.payload.transport
      })
      .addCase(loadInterviewSession.rejected, (state, action) => {
        state.loadStatus = 'failed'
        state.error = action.payload ?? 'Unable to load the session.'
      })
      .addCase(startInterviewSession.pending, (state) => {
        state.startStatus = 'loading'
        state.error = null
      })
      .addCase(startInterviewSession.fulfilled, (state, action) => {
        state.startStatus = 'idle'
        state.current = action.payload.session
        state.transport = action.payload.transport
      })
      .addCase(startInterviewSession.rejected, (state, action) => {
        state.startStatus = 'failed'
        state.error = action.payload ?? 'Unable to start the session.'
      })
      .addCase(submitInterviewAnswer.pending, (state) => {
        state.answerStatus = 'loading'
        state.error = null
      })
      .addCase(submitInterviewAnswer.fulfilled, (state, action) => {
        state.answerStatus = 'idle'
        state.current = action.payload.session
        state.transport = action.payload.transport
      })
      .addCase(submitInterviewAnswer.rejected, (state, action) => {
        state.answerStatus = 'failed'
        state.error = action.payload ?? 'Unable to submit the answer.'
      })
      .addCase(submitInterviewVoiceTurn.pending, (state) => {
        state.voiceStatus = 'loading'
        state.error = null
      })
      .addCase(submitInterviewVoiceTurn.fulfilled, (state, action) => {
        state.voiceStatus = 'idle'
        state.current = action.payload.session
        state.transport = action.payload.transport
      })
      .addCase(submitInterviewVoiceTurn.rejected, (state, action) => {
        state.voiceStatus = 'failed'
        state.error = action.payload ?? 'Unable to submit the voice turn.'
      })
      .addCase(endInterviewSession.pending, (state) => {
        state.endStatus = 'loading'
        state.error = null
      })
      .addCase(endInterviewSession.fulfilled, (state, action) => {
        state.endStatus = 'idle'
        state.current = action.payload.session
        state.transport = action.payload.transport
      })
      .addCase(endInterviewSession.rejected, (state, action) => {
        state.endStatus = 'failed'
        state.error = action.payload ?? 'Unable to end the session.'
      })
      .addCase(deleteInterviewSession.pending, (state, action) => {
        state.deleteStatus = 'loading'
        state.deleteSessionId = action.meta.arg.sessionId
        state.deleteError = null
      })
      .addCase(deleteInterviewSession.fulfilled, (state, action) => {
        state.deleteStatus = 'idle'
        state.deleteSessionId = action.payload.sessionId
        if (state.current?.id === action.payload.sessionId) {
          state.current = null
        }
      })
      .addCase(deleteInterviewSession.rejected, (state, action) => {
        state.deleteStatus = 'failed'
        state.deleteError = action.payload ?? 'Unable to delete the session.'
      })
  },
})

export const { clearSessionError, hydrateSessionFromHistory } = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
