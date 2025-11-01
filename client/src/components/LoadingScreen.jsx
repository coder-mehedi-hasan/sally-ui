const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)]/75 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-[var(--fg)] opacity-80">Loading...</p>
        </div>
    );
};

export default LoadingScreen;