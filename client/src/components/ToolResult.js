import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from '@fluentui/react-components';
import {
  ToolboxRegular,
  ChevronDownRegular,
  ChevronRightRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  ClockRegular,
  CopyRegular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  toolResult: {
    marginTop: '12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    overflow: 'hidden'
  },
  toolResultHeader: {
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  },
  toolResultTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  toolResultContent: {
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1
  },
  successResult: {
    borderLeft: `4px solid ${tokens.colorPaletteGreenBorder1}`
  },
  errorResult: {
    borderLeft: `4px solid ${tokens.colorPaletteRedBorder1}`
  },
  pendingResult: {
    borderLeft: `4px solid ${tokens.colorPaletteYellowBorder1}`
  },
  resultData: {
    fontFamily: 'monospace',
    fontSize: '14px',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: '12px',
    borderRadius: '4px',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '300px'
  },
  resultActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  },
  copyButton: {
    minWidth: 'auto'
  }
});

function ToolResult({ toolResult }) {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!toolResult) return null;

  const { tool, parameters, result } = toolResult;
  
  const getStatusIcon = () => {
    if (result.success === false) {
      return <ErrorCircleRegular color={tokens.colorPaletteRedForeground1} />;
    }
    if (result.success === true) {
      return <CheckmarkCircleRegular color={tokens.colorPaletteGreenForeground1} />;
    }
    return <ClockRegular color={tokens.colorPaletteYellowForeground1} />;
  };

  const getStatusColor = () => {
    if (result.success === false) {
      return 'danger';
    }
    if (result.success === true) {
      return 'success';
    }
    return 'warning';
  };

  const getStatusText = () => {
    if (result.success === false) {
      return 'Failed';
    }
    if (result.success === true) {
      return 'Success';
    }
    return 'Pending';
  };

  const getResultStyle = () => {
    if (result.success === false) {
      return styles.errorResult;
    }
    if (result.success === true) {
      return styles.successResult;
    }
    return styles.pendingResult;
  };

  const handleCopyResult = async () => {
    try {
      const resultText = typeof result.result === 'string' 
        ? result.result 
        : JSON.stringify(result.result, null, 2);
      
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy result:', error);
    }
  };

  const formatResultData = (data) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <Card className={`${styles.toolResult} ${getResultStyle()}`}>
      <Collapsible open={isExpanded} onOpenChange={(_, data) => setIsExpanded(data.value)}>
        <CollapsibleTrigger as="div">
          <div className={styles.toolResultHeader}>
            <div className={styles.toolResultTitle}>
              <ToolboxRegular />
              <Text weight="semibold">Tool: {tool}</Text>
              <Badge appearance="filled" color={getStatusColor()} icon={getStatusIcon()}>
                {getStatusText()}
              </Badge>
            </div>
            <div>
              {isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className={styles.toolResultContent}>
            {/* Parameters */}
            {parameters && Object.keys(parameters).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text weight="semibold" size={300} style={{ marginBottom: '8px', display: 'block' }}>
                  Parameters:
                </Text>
                <div className={styles.resultData}>
                  {formatResultData(parameters)}
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div>
                <Text weight="semibold" size={300} style={{ marginBottom: '8px', display: 'block' }}>
                  Result:
                </Text>
                <div className={styles.resultData}>
                  {formatResultData(result.result || result.error || 'No result data')}
                </div>
              </div>
            )}

            {/* Error Details */}
            {result && result.error && (
              <div style={{ marginTop: '16px' }}>
                <Text weight="semibold" size={300} style={{ marginBottom: '8px', display: 'block', color: tokens.colorPaletteRedForeground1 }}>
                  Error Details:
                </Text>
                <div className={styles.resultData} style={{ backgroundColor: tokens.colorPaletteRedBackground2 }}>
                  {result.error}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={styles.resultActions}>
              <Button
                size="small"
                appearance="subtle"
                icon={<CopyRegular />}
                onClick={handleCopyResult}
                className={styles.copyButton}
              >
                {copied ? 'Copied!' : 'Copy Result'}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default ToolResult;
