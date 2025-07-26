import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import './index.css'
import App from './App.jsx'

// eslint-disable-next-line react-refresh/only-export-components
const AppErrorFallback = ({error, resetErrorBoundary}) => {
    return (
        <div className={`mt-20 flex flex-col justify-center items-center `}>
            <h3>Something went wrong!</h3>
            <pre>{error.message}</pre>
            <button
                className={`text-white bg-blue-600 p-2 rounded-md hover:opacity-80 cursor-pointer`}
                onClick={resetErrorBoundary}
            >
                Try again
            </button>
        </div>
    );
}

createRoot(document.getElementById('root')).render(
    <ReactErrorBoundary
        FallbackComponent={AppErrorFallback}
        onError={(error, errorInfo) => {
            console.log(error, errorInfo);
        }}
        onReset={() => {
            window.location.reload();
        }}
    >
      <StrictMode>
        <App />
      </StrictMode>
    </ReactErrorBoundary>
)
