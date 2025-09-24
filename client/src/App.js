import React, { useState, useEffect, useRef } from 'react';
import { 
  FluentProvider, 
  webLightTheme,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  Button,
  Input,
  Textarea,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarIntent
} from '@fluentui/react-components';
import { 
  SendRegular,
  HistoryRegular,
  SettingsRegular,
  PersonRegular,
  BotRegular,
  ToolboxRegular
} from '@fluentui/react-icons';
import * as microsoftTeams from '@microsoft/teams-js';
import ChatInterface from './components/ChatInterface';
import SidePanel from './components/SidePanel';
import ErrorBoundary from './components/ErrorBoundary';
import AuthService from './services/AuthService';
import AgentService from './services/AgentService';
import './App.css';

const useStyles = makeStyles({
  app: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: '48px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flexDirection: 'column',
    gap: '16px'
  },
  error: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
});

function App() {
  const styles = useStyles();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeTeams();
  }, []);

  const initializeTeams = async () => {
    try {
      setIsLoading(true);
      
      // Initialize Microsoft Teams SDK
      await microsoftTeams.app.initialize();
      
      // Get Teams context
      const context = await microsoftTeams.app.getContext();
      console.log('Teams context:', context);
      
      // Initialize authentication
      await initializeAuth();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Teams:', error);
      setError('Failed to initialize Microsoft Teams. Please ensure you are running this app within Teams.');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAuth = async () => {
    try {
      // Get authentication token from Teams
      const token = await microsoftTeams.authentication.getAuthToken();
      
      if (token) {
        // Validate token with backend
        const authResult = await AuthService.validateToken(token);
        
        if (authResult.success) {
          setUser(authResult.user);
          setIsAuthenticated(true);
          
          // Set up authentication headers for future requests
          AuthService.setAuthToken(token);
        } else {
          throw new Error('Token validation failed');
        }
      } else {
        throw new Error('No authentication token received');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setError('Authentication failed. Please try refreshing the app.');
    }
  };

  const handleSidePanelToggle = () => {
    setShowSidePanel(!showSidePanel);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleErrorDismiss = () => {
    setError(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <div>Initializing Teams AI Agent...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
        <Button 
          appearance="primary" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <div>Setting up authentication...</div>
      </div>
    );
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <ErrorBoundary>
        <div className={styles.app}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <BotRegular fontSize={24} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>AI Agent</div>
                <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                  Powered by AWS Bedrock & MCP Gateway
                </div>
              </div>
            </div>
            <div className={styles.headerRight}>
              <Button
                icon={<HistoryRegular />}
                appearance="subtle"
                onClick={handleSidePanelToggle}
                title="Chat History"
              />
              <Button
                icon={<SettingsRegular />}
                appearance="subtle"
                title="Settings"
              />
              <Button
                icon={<PersonRegular />}
                appearance="subtle"
                title={user?.name || 'User'}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.main}>
            <div className={styles.content}>
              <ChatInterface 
                user={user}
                onError={handleError}
              />
            </div>
            
            {showSidePanel && (
              <SidePanel 
                user={user}
                onClose={() => setShowSidePanel(false)}
              />
            )}
          </div>
        </div>
      </ErrorBoundary>
    </FluentProvider>
  );
}

export default App;
