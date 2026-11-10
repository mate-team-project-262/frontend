import { Component, type ErrorInfo, type ReactNode } from 'react';
import logo from '../../assets/landing/w2w-logo.svg';
import './ErrorBoundary.css';

/**
 * Catches a crash while rendering any page and shows a friendly screen instead of a white page.
 * (React still needs a class component for this.) Network/API errors are handled by the pages.
 */
interface Props {
  children: ReactNode;
}

interface State {
  error: unknown;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // Keep the details for developers; the user only sees the fallback.
    console.error('Render crash', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="error-boundary" role="alert">
        <img className="error-boundary__logo" src={logo} width="106" height="48" alt="W2W" />
        <h1 className="error-boundary__title">Something went wrong</h1>
        <p className="error-boundary__text">
          The page stopped working. Reload it to continue — your room and votes are saved.
        </p>
        <div className="error-boundary__actions">
          <button
            type="button"
            className="error-boundary__button"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
          <a className="error-boundary__link" href="/">
            Go to the home page
          </a>
        </div>
      </main>
    );
  }
}
