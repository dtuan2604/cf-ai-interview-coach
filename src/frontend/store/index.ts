import { configureStore } from '@reduxjs/toolkit'
import { historyReducer } from '../slices/historySlice'
import { sessionReducer } from '../slices/sessionSlice'
import { setupReducer } from '../slices/setupSlice'

export const store = configureStore({
  reducer: {
    history: historyReducer,
    session: sessionReducer,
    setup: setupReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
