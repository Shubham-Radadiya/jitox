import { useSelector } from "react-redux";

const initialState = {
    data: null,
    isLoading: false,
    error: null
};

const AuthReducer = (state = initialState, action) => {
    switch (action.type) {
        default:
            return state
    }
}

export default AuthReducer

export const useAuthSelecter = () => {
    return useSelector((state) => state.auth)
}