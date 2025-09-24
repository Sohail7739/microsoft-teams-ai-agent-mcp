# Microsoft Teams AI Agent Tab App with MCP Gateway Integration

A production-ready Microsoft Teams Tab application that provides conversational AI capabilities using AWS Bedrock and Topcoder MCP Gateway for tool orchestration.

## Features

### 🤖 AI Agent Capabilities
- **AWS Bedrock Integration**: Powered by Claude 3 Sonnet for intelligent responses
- **Streaming Responses**: Real-time token-by-token streaming like ChatGPT
- **Tool Orchestration**: Seamless integration with MCP Gateway tools
- **Conversation Memory**: Maintains context across interactions
- **Retry/Fallback**: Robust error handling and retry mechanisms

### 🔐 Security & Authentication
- **Azure AD SSO**: Seamless single sign-on integration
- **Tenant-aware**: Only users from the same Microsoft 365 tenant can access
- **Token Validation**: Secure JWT token validation for all requests
- **Secrets Management**: Azure Key Vault integration for secure credential storage

### 💬 User Experience
- **Responsive UI**: Built with Fluent UI for native Teams experience
- **Chat Interface**: Intuitive chat-like interface with message history
- **Tool Results**: Rich display of tool execution results with structured data
- **Status Indicators**: Real-time feedback on AI processing and tool execution
- **Chat History**: Side panel with searchable conversation history

### 🛠️ Tool Integration
- **MCP Gateway**: Secure connection to Topcoder MCP Gateway
- **Tool Selection**: AI automatically selects appropriate tools based on user requests
- **Parameter Handling**: Intelligent parameter extraction and validation
- **Batch Execution**: Support for executing multiple tools in sequence
- **Error Handling**: Graceful error handling with user-friendly messages

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Teams Client  │    │   React Frontend│    │  Node.js Backend│
│                 │◄──►│                 │◄──►│                 │
│  - SSO Auth     │    │  - Fluent UI    │    │  - Express API  │
│  - Tab Interface│    │  - Chat UI      │    │  - Auth Middleware│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐            │
                       │   AWS Bedrock   │◄───────────┤
                       │                 │            │
                       │  - Claude 3     │            │
                       │  - LangChain JS │            │
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │  MCP Gateway    │◄───────────┘
                       │                 │
                       │  - Tool Registry│
                       │  - Execution    │
                       │  - Results      │
                       └─────────────────┘
```

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Fluent UI**: Microsoft's design system for consistent Teams experience
- **Teams SDK**: Microsoft Teams JavaScript SDK for integration
- **Axios**: HTTP client for API communication

### Backend
- **Node.js**: Server runtime
- **Express**: Web framework
- **LangChain JS**: AI orchestration and streaming
- **AWS SDK**: Bedrock integration
- **Azure SDK**: Key Vault integration

### AI & Tools
- **AWS Bedrock**: Claude 3 Sonnet for AI responses
- **MCP Gateway**: Tool orchestration and execution
- **LangChain**: Prompt management and streaming

### Security
- **Azure AD**: SSO authentication
- **JWT**: Token-based authentication
- **Azure Key Vault**: Secrets management
- **CORS**: Cross-origin resource sharing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure AD tenant with app registration
- AWS account with Bedrock access
- Topcoder MCP Gateway access
- Microsoft Teams development environment

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd teams-ai-agent-mcp
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up Azure AD App Registration**
   - Create a new app registration in Azure Portal
   - Configure redirect URIs for Teams
   - Generate client secret
   - Configure API permissions

5. **Configure AWS Bedrock**
   - Set up AWS credentials
   - Enable Bedrock access for Claude models
   - Configure IAM permissions

6. **Set up MCP Gateway**
   - Obtain API key from Topcoder
   - Configure gateway URL
   - Test tool connectivity

### Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Start production server**
   ```bash
   npm start
   ```

### Teams App Configuration

1. **Update manifest**
   - Replace `{{APP_ID}}` with your Azure AD app ID
   - Replace `{{BASE_URL}}` with your app URL
   - Replace `{{BASE_URL_DOMAIN}}` with your domain

2. **Package the app**
   ```bash
   # Create app package
   zip -r teams-app.zip teams-app-manifest.json color.png outline.png
   ```

3. **Upload to Teams**
   - Go to Teams Admin Center
   - Upload the app package
   - Configure permissions and policies

## API Endpoints

### Authentication
- `POST /api/auth/validate` - Validate Teams SSO token
- `GET /api/auth/user` - Get current user info
- `GET /api/auth/context` - Get Teams context

### AI Agent
- `POST /api/agent/chat` - Send message to AI agent
- `POST /api/agent/chat/stream` - Stream AI response
- `GET /api/agent/history/:userId` - Get conversation history
- `DELETE /api/agent/history/:userId` - Clear conversation history

### MCP Tools
- `GET /api/mcp/tools` - Get available tools
- `GET /api/mcp/tools/:toolName/schema` - Get tool schema
- `POST /api/mcp/execute` - Execute single tool
- `POST /api/mcp/execute/batch` - Execute multiple tools
- `GET /api/mcp/history` - Get execution history

## Deployment

### Azure Deployment

1. **Create Azure App Service**
   ```bash
   az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myAppName --runtime "NODE|18-lts"
   ```

2. **Configure Application Settings**
   ```bash
   az webapp config appsettings set --resource-group myResourceGroup --name myAppName --settings @appsettings.json
   ```

3. **Deploy the application**
   ```bash
   az webapp deployment source config-zip --resource-group myResourceGroup --name myAppName --src deployment.zip
   ```

### AWS Deployment

1. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name teams-ai-agent
   ```

2. **Build and push Docker image**
   ```bash
   docker build -t teams-ai-agent .
   docker tag teams-ai-agent:latest your-account.dkr.ecr.region.amazonaws.com/teams-ai-agent:latest
   docker push your-account.dkr.ecr.region.amazonaws.com/teams-ai-agent:latest
   ```

3. **Deploy with ECS**
   ```bash
   aws ecs create-service --cluster teams-ai-agent --service-name teams-ai-agent-service --task-definition teams-ai-agent:1 --desired-count 1
   ```

## Security Considerations

### Authentication
- All API endpoints require valid Azure AD tokens
- Tokens are validated against Azure AD on each request
- Tenant isolation ensures users can only access their organization's data

### Secrets Management
- All sensitive configuration stored in Azure Key Vault
- No secrets in code or environment variables
- Automatic secret rotation support

### Data Privacy
- Conversation history stored per user
- No cross-tenant data access
- GDPR compliant data handling

## Monitoring and Logging

### Application Insights
- Integrated with Azure Application Insights
- Custom metrics for AI response times
- Tool execution monitoring
- Error tracking and alerting

### Logging
- Structured logging with Winston
- Request/response logging
- Security event logging
- Performance metrics

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify Azure AD configuration
   - Check token expiration
   - Validate tenant ID

2. **AI Response Issues**
   - Check AWS Bedrock access
   - Verify model availability
   - Review rate limits

3. **Tool Execution Failures**
   - Validate MCP Gateway connection
   - Check API key permissions
   - Review tool schemas

### Debug Mode

Enable debug logging:
```bash
DEBUG=teams-ai-agent:* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Advanced tool chaining
- [ ] Custom tool development
- [ ] Analytics dashboard
- [ ] Voice input support
- [ ] Mobile optimization

### Version History
- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Enhanced tool integration
- **v1.2.0**: Performance optimizations
- **v2.0.0**: Multi-tenant support (planned)
