export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-black transition-colors">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 dark:border-white/10 border-t-brand mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-white/70">Loading...</p>
      </div>
    </div>
  )
}
