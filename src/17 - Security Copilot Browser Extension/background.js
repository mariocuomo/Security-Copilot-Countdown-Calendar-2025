// Background Service Worker for Authentication

// Handle authentication requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'authenticate') {
        handleAuthentication(request.tenantId, request.clientId)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Indicates async response
    }
});

async function handleAuthentication(tenantId, clientId) {
    try {
        // Use Chrome Identity API to get OAuth token
        // For Microsoft Graph, we need to construct the proper auth URL
        const redirectUrl = chrome.identity.getRedirectURL();
        const scopes = 'https://graph.microsoft.com/SecurityCopilotWorkspaces.ReadWrite.All';
        
        const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
            `client_id=${clientId}` +
            `&response_type=token` +
            `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&response_mode=fragment`;

        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
                {
                    url: authUrl,
                    interactive: true
                },
                (responseUrl) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (!responseUrl) {
                        reject(new Error('No response from authentication'));
                        return;
                    }

                    // Parse the response URL to extract the access token
                    const params = new URLSearchParams(responseUrl.split('#')[1]);
                    const accessToken = params.get('access_token');
                    const expiresIn = params.get('expires_in');

                    if (!accessToken) {
                        reject(new Error('No access token received'));
                        return;
                    }

                    // Decode the token to get user information
                    const tokenPayload = parseJwt(accessToken);
                    const userEmail = tokenPayload.preferred_username || tokenPayload.upn || tokenPayload.email || 'User';

                    resolve({
                        success: true,
                        accessToken: accessToken,
                        expiry: Date.now() + (parseInt(expiresIn) * 1000),
                        userEmail: userEmail
                    });
                }
            );
        });
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper function to parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return {};
    }
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Security Copilot Chat extension installed');
    } else if (details.reason === 'update') {
        console.log('Security Copilot Chat extension updated');
    }
});
