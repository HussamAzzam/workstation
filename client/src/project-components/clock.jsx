import { useState, useEffect, useRef } from 'react';
import { Circle } from'lucide-react';

function Clock({className, panel, isActive , onSessionEnd, isReseted, onClockClick}) {
  //States
  const [timeLeft, setTimeLeft] = useState(panel.duration * 60); //Default 25 minutes

  //Computed values
  const timeFormat = (totalTime) => {
    const minutes = Math.floor(totalTime / 60);
    const seconds = Math.floor(totalTime % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  //Refs
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const originalTitleRef = useRef(document.title);

  //Effects
  useEffect(() => {
    setTimeLeft(panel.duration * 60);
  }, [panel.duration, panel.id]);

  useEffect(() => {
    if(isReseted){
      setTimeLeft(panel.duration * 60);
      if(intervalRef.current){
        clearInterval(intervalRef.current);
      }
    }
  }, [isReseted])

  useEffect(() => {
    if(isActive){
      startTimeRef.current = Date.now();
      endTimeRef.current = startTimeRef.current + (timeLeft * 1000);

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
        setTimeLeft(remaining);

        if(remaining === 0){
          onSessionEnd();
          clearInterval(intervalRef.current);
        }
      }

      // Use setInterval instead of requestAnimationFrame for consistent timing
      intervalRef.current = setInterval(updateTimer, 1000);

      const handleVisibilityChange = () => {
        if (!document.hidden && isActive) {
          updateTimer();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if(intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
    else {
      if(intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if(isActive && timeLeft > 0) {
      document.title = `${panel.name} - ${timeFormat(timeLeft)}`
    } else if(!isActive) {
      document.title = originalTitleRef.current;
    }
  }, [timeLeft, isActive, panel.name]);

  useEffect(() => {
    return () => {
      if(intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  },[])

  //handlers
  return (
    <div
      className={`${className} flex justify-center items-center`}
    >
      <div
        onClick={onClockClick}
        className={`
            ${panel.clockStyles}
            h-[90%] aspect-square flex flex-col justify-center items-center border-6 rounded-full cursor-pointer transition-all duration-100 ease-in-out `}>
        <p style={{ fontVariantNumeric: 'tabular-nums' }} className={` text-[7rem] select-none`}>{timeFormat(timeLeft)}</p>
      </div>
    </div>
  );
}

export default Clock;