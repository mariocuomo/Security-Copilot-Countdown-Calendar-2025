# Security Copilot Chat Extension

A Microsoft Edge extension that provides a side panel chat interface to interact with Microsoft Security Copilot through Microsoft Graph API.

## Features

- 🔐 **Microsoft Authentication** - OAuth 2.0 flow using Microsoft Identity Platform
- 💬 **Side Panel Interface** - Persistent chat experience in Edge's side panel
- 🔄 **Session Management** - Create, name, and manage conversation sessions
- 💾 **Persistent Storage** - Session data and authentication state preserved across browser sessions
- ⚙️ **Configurable** - Easy setup with Tenant ID, Client ID, and Workspace ID
- 🎨 **Modern UI** - Clean, intuitive interface with typing indicators and message history
- 📋 **Session ID Copy** - Quick copy session IDs for reference

## Prerequisites

Before using this extension, you need:

1. **Entra ID App Registration**
   - Navigate to [Azure Portal](https://portal.azure.com)
   - Go to **Entra ID** > **App registrations** > **New registration**
   - Set a name (e.g., "Security Copilot Chat Extension")
   - Select **Accounts in this organizational directory only** (single tenant)
   - For Redirect URI, select **Single-page application (SPA)** and enter: `https://<your-extension-id>.chromiumapp.org/`
   - After creation, note the **Application (client) ID** and **Directory (tenant) ID**

2. **API Permissions**
   - In your app registration, go to **API permissions**
   - Click **Add a permission** > **Microsoft Graph**
   - Select **Delegated permissions**
   - Add: `SecurityCopilotWorkspaces.ReadWrite.All`
   - Click **Grant admin consent** (requires admin privileges)

3. **Security Copilot Access**
   - Ensure you have access to Microsoft Security Copilot
   - Have appropriate licenses and permissions

## Installation

### Method 1: Load Unpacked Extension (Development)

1. Open Microsoft Edge
2. Navigate to `edge://extensions/`
3. Enable **Developer mode** (toggle in bottom-left corner)
4. Click **Load unpacked**
5. Select the extension folder containing these files
6. The extension icon will appear in your browser toolbar
7. Note the extension ID from the extension details page (needed for redirect URI)

### Method 2: Pack and Install

1. In Edge, go to `edge://extensions/`
2. Click **Pack extension**
3. Select the extension folder
4. Install the generated `.crx` file

## Configuration

1. Click the extension icon in your toolbar to open the side panel
2. Click the **⚙️ Settings** button
3. Enter your credentials:
   - **Tenant ID**: Your Entra ID tenant ID (from app registration)
   - **Client ID**: Your app registration client ID
   - **Workspace ID**: Default is `default` (or use your custom workspace ID)
4. Click **Save**

> **Note:** Configuration is stored locally in the browser and persists across sessions.

## Usage

1. Click **Sign In with Microsoft**
2. Complete the authentication flow in the popup window
3. Start chatting with Security Copilot:
   - Type your security question in the input box
   - Press **Enter** or click the send button (arrow icon)
   - View the response from Security Copilot
4. **New Session**: Click to start a fresh conversation with a custom name
5. **Session ID**: Click on the session ID to copy it to clipboard
6. **Sign Out**: Logout and clear authentication state

## Features in Detail

### Side Panel Interface
- Opens in Edge's side panel for a persistent experience
- Remains open while browsing other tabs
- Responsive design that adapts to panel width

### Chat Interface
- Send messages to Security Copilot via Microsoft Graph API
- Real-time responses with typing indicators
- Conversation history maintained within each session
- Distinct styling for user and assistant messages
- Auto-scroll to latest messages

### Session Management
- **Named Sessions**: Create custom-named sessions for different investigations
- **Session Persistence**: Sessions and their IDs are preserved across browser restarts
- **Session ID Access**: Click session ID to copy for external reference
- Create multiple sessions to organize different security queries

### Authentication
- OAuth 2.0 implicit flow using Microsoft Identity Platform
- Access tokens stored in browser's extension storage
- User email displayed when authenticated
- Token expiry handling

## File Structure

```
EdgeExtension/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup.html             # Side panel UI
├── popup.js               # Main application logic and API interactions
├── background.js          # Service worker for OAuth authentication
├── styles.css             # UI styling
├── README.md              # This documentation
└── icons/                 # Extension icons (16, 32, 48, 128px)
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Adding Icons

Create PNG icons with the following dimensions and place them in an `icons` folder:
- 16x16 pixels (icon16.png)
- 32x32 pixels (icon32.png)
- 48x48 pixels (icon48.png)
- 128x128 pixels (icon128.png)

Use a shield or security-themed icon that represents Security Copilot.

## API Reference

This extension uses the Microsoft Graph API for Security Copilot:

- **Base URL**: `https://graph.microsoft.com/beta/security/securityCopilot`
- **Key Endpoints**:
  - `POST /workspaces/{workspaceId}/sessions` - Create new session
  - `POST /workspaces/{workspaceId}/sessions/{sessionId}/prompts` - Submit prompt
  - `POST /workspaces/{workspaceId}/sessions/{sessionId}/prompts/{promptId}/evaluations` - Evaluate prompt
  - `GET /workspaces/{workspaceId}/sessions/{sessionId}/prompts/{promptId}/evaluations/{evaluationId}` - Get result

For more details, refer to [Microsoft Graph Security API documentation](https://learn.microsoft.com/graph/api/resources/security-api-overview).

## Security Considerations

### ⚠️ PROOF OF CONCEPT WARNING

**This extension is a proof of concept (POC) and should NOT be used in production environments without significant security enhancements.**

#### Current Security Limitations:

1. **Insecure Token Storage**: 
   - Access tokens are stored in `chrome.storage.local`, which is **not encrypted at rest**
   - Malicious extensions or local attackers with file system access could potentially read these tokens
   - Tokens persist until manually cleared or expired

2. **No Token Refresh Mechanism**: 
   - Uses OAuth 2.0 implicit flow without refresh token support
   - When tokens expire, users must manually re-authenticate
   - No automatic token renewal

3. **Client-Side Configuration Exposure**: 
   - Tenant ID and Client ID are stored in unencrypted browser storage
   - Configuration values could be extracted by malicious actors

4. **No Rate Limiting**: 
   - No protection against excessive API calls
   - Could potentially exhaust API quotas

5. **Limited Error Handling**: 
   - Some error scenarios may expose sensitive information in console logs
   - Stack traces and API responses logged to console

6. **No Certificate Pinning**: 
   - Vulnerable to man-in-the-middle (MITM) attacks if TLS is compromised

7. **Implicit Flow Vulnerabilities**:
   - Tokens exposed in browser redirect URLs
   - No additional layer of security provided by backend validation

#### Recommendations for Production Use:

To make this extension production-ready, implement the following security enhancements:

- **Secure Token Management**: 
  - Use **authorization code flow with PKCE** instead of implicit flow
  - Implement token refresh logic with secure refresh token storage
  - Consider using a secure backend service to handle authentication and proxy API calls
  - Implement token encryption before storing in browser storage
  
- **Enhanced Storage Security**: 
  - Encrypt sensitive data before storing in `chrome.storage.local`
  - Clear tokens from memory after use
  - Implement session timeout and automatic cleanup

- **Certificate Pinning**: 
  - Pin Microsoft Graph API certificates for additional MITM protection

- **Comprehensive Audit Logging**: 
  - Track all authentication events
  - Log API usage with timestamps and user context
  - Implement monitoring and alerting for suspicious activity

- **Input Validation & Sanitization**: 
  - Validate and sanitize all user inputs
  - Implement Content Security Policy (CSP) headers
  - Prevent XSS and injection attacks

- **Error Handling**: 
  - Sanitize error messages to avoid information disclosure
  - Implement proper error boundaries
  - Log errors securely without exposing sensitive data

- **Rate Limiting & Throttling**: 
  - Implement client-side rate limiting
  - Respect API quotas and throttling recommendations
  - Add exponential backoff for retries

- **Security Headers**: 
  - Review and strengthen Content Security Policy
  - Implement proper CORS handling

- **Code Obfuscation**: 
  - Obfuscate client-side code to make reverse engineering harder
  - Use webpack or similar bundlers with minification

**⚠️ IMPORTANT: Use this extension ONLY in development/testing environments. Never use it with production credentials, sensitive data, or in environments handling real security incidents.**

## Troubleshooting

### Authentication Fails
- Verify your Tenant ID and Client ID are correct
- Check that API permissions are granted and admin consent is provided
- Ensure the redirect URI in Entra ID matches your extension ID
- Verify your account has Security Copilot access

### Extension Not Loading
- Check that all required files are present
- Verify manifest.json syntax is valid (use JSON validator)
- Look for errors in `edge://extensions/` under your extension details
- Check browser console (F12) for error messages

### No Response from Copilot
- Check your network connection
- Verify your Security Copilot license is active
- Ensure API permissions are properly configured
- Check browser console for API error responses
- Verify workspace ID is correct

### Token Expired
- Sign out and sign in again to refresh the token
- Check token expiry in `chrome.storage.local` via DevTools

### Settings Not Saving
- Check browser console for storage errors
- Verify extension has storage permissions
- Clear browser cache and try again

## Development

To modify or extend the extension:

1. Make changes to the relevant files
2. Go to `edge://extensions/`
3. Find your extension and click the **Reload** button
4. Open browser DevTools (F12) to see console logs and debug
5. Test your changes in the side panel

### Debugging Tips
- Use `console.log()` statements in popup.js and background.js
- Monitor network requests in DevTools Network tab
- Check `chrome.storage.local` contents in DevTools Application tab
- Test authentication flow with different accounts

## Limitations

- Requires active internet connection
- Dependent on Security Copilot service availability
- Token expires periodically and requires re-authentication
- Works only with Microsoft Edge (Chromium-based browsers may work with modifications)
- Limited to delegated permissions (user context only)

## Future Enhancements

Potential improvements for future versions:
- Implement authorization code flow with PKCE
- Add token refresh mechanism
- Dark/light theme toggle

## License

This is a demonstration/educational project. Please ensure compliance with:
- Microsoft's terms of service
- Security Copilot usage policies
- Your organization's security policies

## Support

For issues related to:
- **Extension Development**: Check browser console and review manifest configuration
- **Security Copilot API**: Refer to [Microsoft Graph API documentation](https://learn.microsoft.com/graph/api/resources/security-api-overview)
- **Entra ID Authentication**: Refer to [Microsoft Identity Platform documentation](https://learn.microsoft.com/azure/active-directory/)
- **Microsoft Graph**: Visit [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer) for testing

## Contributing

This is a POC project. If you'd like to contribute improvements:
1. Focus on security enhancements first
2. Test thoroughly with non-production environments
3. Document all changes clearly
4. Follow secure coding practices

---

**⚠️ REMINDER**: This extension is a **PROOF OF CONCEPT**. It demonstrates integration with Security Copilot but lacks production-grade security features. Always follow your organization's security policies and never use with production credentials or sensitive data.
