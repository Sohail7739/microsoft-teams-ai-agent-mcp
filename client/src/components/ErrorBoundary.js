import React from 'react';
import {
  Button,
  Text,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle
} from '@fluentui/react-components';
import { ErrorCircleRegular, RefreshRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '32px',
    textAlign: 'center'
  },
  errorIcon: {
    fontSize: '48px',
    color: tokens.colorPaletteRedForeground1,
    marginBottom: '16px'
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '8px',
    color: tokens.colorNeutralForeground1
  },
  errorMessage: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '24px',
    maxWidth: '500px'
  },
  errorDetails: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontFamily: 'monospace',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '24px',
    maxWidth: '600px',
    wordBreak: 'break-word'
  }
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const styles = useStyles();
    
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <ErrorCircleRegular className={styles.errorIcon} />
          <Text className={styles.errorTitle}>
            Something went wrong
          </Text>
          <Text className={styles.errorMessage}>
            The application encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </Text>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className={styles.errorDetails}>
              <Text weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>
                Error Details:
              </Text>
              <Text size={200}>
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <>
                  <Text weight="semibold" style={{ display: 'block', marginTop: '12px', marginBottom: '8px' }}>
                    Component Stack:
                  </Text>
                  <Text size={200}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </>
              )}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              appearance="primary"
              icon={<RefreshRegular />}
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
            <Button
              appearance="secondary"
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
