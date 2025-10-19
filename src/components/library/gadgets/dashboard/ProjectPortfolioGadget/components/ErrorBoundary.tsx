/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 * Prevents entire gadget from crashing
 */

import { Alert, Button } from "antd";
import React from "react";
import styles from "../PortfolioGadget.module.css";

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging (in development only)
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.portfolioContainer}>
          <Alert
            type="error"
            message="Something went wrong"
            description={
              <div>
                <p>
                  {this.state.error?.message ||
                    "An unexpected error occurred while rendering the portfolio."}
                </p>
                {process.env.NODE_ENV === "development" &&
                  this.state.errorInfo && (
                    <details style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>
                      <summary>Error Details (Development Only)</summary>
                      {this.state.errorInfo.componentStack}
                    </details>
                  )}
              </div>
            }
            showIcon
            action={
              <Button onClick={this.handleReset} type="primary" size="small">
                Try Again
              </Button>
            }
            style={{ margin: "20px 0" }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
