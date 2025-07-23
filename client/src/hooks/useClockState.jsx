import { useCallback, useState } from "react";

export const useClockState = () => {
    const [isClockClicked, setIsClockClicked] = useState(false);
    const [isClockRunning, setIsClockRunning] = useState(false);

    const updateClockState = useCallback((state) => {
        setIsClockRunning(state);
    }, []);

    const handleClockClick = useCallback(() => {
        setIsClockClicked(prev => !prev);
    }, []);

    return {
        isClockClicked,
        isClockRunning,
        updateClockState,
        handleClockClick
    };
};