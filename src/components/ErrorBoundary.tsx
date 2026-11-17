import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, message: error?.message || 'Неизвестная ошибка'};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen kitty-bg flex items-center justify-center p-6 text-[#FFF8F3]">
          <div className="max-w-md w-full bg-[#281811]/90 border-2 border-white/80 rounded-2xl p-6 text-center shadow-[0_0_32px_rgba(255,255,255,0.25)]">
            <h1 className="font-serif text-2xl font-semibold mb-2">
              Произошла ошибка приложения
            </h1>
            <p className="text-xs text-[#DECAC0] mb-5 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-xs font-semibold text-[#181617] bg-[#FFF8F3] rounded-xl hover:bg-[#F3E5DB] transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
