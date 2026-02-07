export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/10 border-t-brand mx-auto mb-4"></div>
        <p className="text-white/70">Loading...</p>
      </div>
    </div>
  )
}
