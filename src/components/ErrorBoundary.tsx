import * as React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Something went wrong. Please try again later.';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Database Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path || 'unknown path'}`;
            isFirestoreError = true;
          }
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
          <div className="max-w-md w-full bg-surface-container p-8 rounded-3xl border border-white/5 shadow-2xl">
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-error" size={40} />
            </div>
            <h2 className="font-headline font-black text-3xl italic tracking-tighter text-white mb-4 uppercase">
              SYSTEM <span className="text-error">FAILURE</span>
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full kinetic-gradient py-4 rounded-xl font-headline font-extrabold text-on-primary-fixed uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <RefreshCcw size={18} />
              Reboot System
            </button>
            
            {isFirestoreError && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[10px] text-outline font-bold uppercase tracking-[0.2em]">
                  Database sync interrupted. Check console for logs.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
