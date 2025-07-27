/**
 * =================================================================================
 * LiveClock Component (components/shared/LiveClock.js)
 * ---------------------------------------------------------------------------------
 * A self-contained component that displays the current date and time in the
 * specified timezone (UTC+8).
 * =================================================================================
 */
function LiveClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        // Update the time every second
        const timerId = setInterval(() => setTime(new Date()), 1000);
        // Cleanup the interval when the component unmounts
        return () => clearInterval(timerId);
    }, []);

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TIMEZONE };
    const timeOptions = { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: TIMEZONE };

    return (
        <div className="text-right">
            <div className="text-sm font-medium text-gray-800">{time.toLocaleDateString('en-US', dateOptions)}</div>
            <div className="text-xs text-gray-500">{time.toLocaleTimeString('en-US', timeOptions)}</div>
        </div>
    );
}