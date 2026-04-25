// store.js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import AuthReducer from './auth/AuthReducer';

// Custom thunk middleware (compatible with ES modules)
const thunkMiddleware = (store) => (next) => (action) => {
    if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
    }
    return next(action);
};

const rootReducer = combineReducers({
    auth: AuthReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunkMiddleware));

export default store;