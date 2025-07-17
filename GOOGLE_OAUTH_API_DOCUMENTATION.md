# Google OAuth API Documentation

This documentation provides comprehensive details for implementing Google OAuth authentication with step-by-step onboarding for the Clippers platform.

## Overview

The Google OAuth flow supports:

- Authentication with Google accounts
- Automatic user detection (existing vs new users)
- Role-based onboarding for creators and clippers
- Step-by-step profile completion
- Secure token management

## Environment Variables Required

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
# Note: No additional JWT secrets needed - uses Supabase's native token system
```

## API Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message: string;
}
```

## Authentication Flow

### 1. Get Google OAuth URL

**Endpoint:** `GET /auth/google/url`

**Response:**

```typescript
{
  status: 'success',
  data: {
    authUrl: string // Google OAuth URL for redirection
  },
  message: 'Google OAuth URL generated successfully'
}
```

**Frontend Implementation:**

```typescript
const response = await fetch('/auth/google/url');
const { data } = await response.json();
window.location.href = data.authUrl; // Redirect to Google
```

### 2. Handle Google Callback

**Endpoint:** `POST /auth/google/callback`

**Request Body:**

```typescript
interface GoogleCallbackDto {
  code: string; // Authorization code from Google
  state?: string; // Optional state parameter
}
```

**Response:**

```typescript
interface GoogleAuthResponse {
  requiresOnboarding: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    profile: any;
  };
  onboardingToken?: string; // Present if requiresOnboarding is true
  token?: string; // Supabase access token (present if user exists)
  refreshToken?: string; // Present if user exists
}
```

### 3. Direct Token Authentication

**Endpoint:** `POST /auth/google/token`

**Request Body:**

```typescript
interface GoogleAuthDto {
  idToken: string; // Google ID token from client-side authentication
}
```

**Response:** Same as callback endpoint

**Frontend Implementation (using Google Sign-In Library):**

```typescript
// After user signs in with Google
const response = await gapi.auth2
  .getAuthInstance()
  .currentUser.get()
  .getAuthResponse();
const idToken = response.id_token;

const authResponse = await fetch('/auth/google/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken }),
});
```

## Onboarding Flow

When `requiresOnboarding` is `true`, the user must complete the following steps:

### Step 1: Brand Name

**Endpoint:** `POST /auth/onboarding/step-1`

**Request Body:**

```typescript
interface OnboardingStep1Dto {
  onboardingToken: string;
  brandName: string; // 2-50 characters
}
```

**Response:**

```typescript
interface OnboardingStepResponse {
  success: boolean;
  message: string;
  nextStep?: number;
  totalSteps: number;
  currentStep: number;
}
```

### Step 2: Social Media Details

**Endpoint:** `POST /auth/onboarding/step-2`

**Request Body:**

```typescript
interface OnboardingStep2Dto {
  onboardingToken: string;
  socialMediaHandle: string; // 3-50 characters, alphanumeric with . and _
  platform: Platform; // 'instagram' | 'tiktok' | 'youtube' | 'x'
}
```

### Step 3: Niche and Location

**Endpoint:** `POST /auth/onboarding/step-3`

**Request Body:**

```typescript
interface OnboardingStep3Dto {
  onboardingToken: string;
  niche: Niche; // See Niche enum below
  country: string; // 2-50 characters
}
```

### Step 4: Clipper-Specific Details (Clippers Only)

**Endpoint:** `POST /auth/onboarding/step-4-clipper`

**Request Body:**

```typescript
interface OnboardingStep4ClipperDto {
  onboardingToken: string;
  followerCount: number; // 0-500,000,000
  pricePerPost: number; // 0-500,000,000
}
```

### Final Step: Complete Onboarding

**Endpoint:** `POST /auth/onboarding/complete`

**Request Body:**

```typescript
interface CompleteOnboardingDto {
  onboardingToken: string;
  password: string; // Min 8 chars, must contain letter and number
}
```

**Response:** User registration response with tokens

## Utility Endpoints

### Get Onboarding Status

**Endpoint:** `GET /auth/onboarding/status/:token`

**Response:**

```typescript
{
  currentStep: number;
  totalSteps: number;
  role: 'creator' | 'clipper';
}
```

### Initiate Custom Onboarding

**Endpoint:** `POST /auth/google/initiate-onboarding`

**Request Body:**

```typescript
interface InitiateOnboardingDto {
  email: string;
  name: string;
  picture: string;
  role: 'creator' | 'clipper';
}
```

## Enums and Types

### Platform Enum

```typescript
enum Platform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  X = 'x',
}
```

### Niche Enum

```typescript
enum Niche {
  TRAVEL = 'travel',
  FOOD = 'food',
  ENTERTAINMENT = 'entertainment',
  SPORT = 'sport',
  FASHION = 'fashion',
  TECHNOLOGY = 'technology',
  GAMING = 'gaming',
  BEAUTY = 'beauty',
  FITNESS = 'fitness',
  OTHER = 'other',
}
```

## Frontend Implementation Example

### Complete React Implementation

```typescript
import React, { useState, useEffect } from 'react';

interface OnboardingData {
  onboardingToken: string;
  currentStep: number;
  totalSteps: number;
  role: 'creator' | 'clipper';
}

const GoogleAuthFlow: React.FC = () => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [formData, setFormData] = useState({
    brandName: '',
    socialMediaHandle: '',
    platform: '',
    niche: '',
    country: '',
    followerCount: 0,
    pricePerPost: 0,
    password: ''
  });

  // 1. Initiate Google OAuth
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/auth/google/url');
      const { data } = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to get Google OAuth URL:', error);
    }
  };

  // 2. Handle callback from Google (in a separate component/page)
  const handleGoogleCallback = async (code: string) => {
    try {
      const response = await fetch('/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const result = await response.json();

      if (result.data.requiresOnboarding) {
        setOnboardingData({
          onboardingToken: result.data.onboardingToken,
          currentStep: 0,
          totalSteps: 4, // Will be updated based on role
          role: 'creator' // Default, user will select
        });
      } else {
        // User exists, store tokens and redirect to dashboard
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Google callback failed:', error);
    }
  };

  // 3. Process onboarding steps
  const processStep = async (stepNumber: number) => {
    if (!onboardingData) return;

    try {
      let endpoint = '';
      let payload: any = { onboardingToken: onboardingData.onboardingToken };

      switch (stepNumber) {
        case 1:
          endpoint = '/auth/onboarding/step-1';
          payload.brandName = formData.brandName;
          break;
        case 2:
          endpoint = '/auth/onboarding/step-2';
          payload.socialMediaHandle = formData.socialMediaHandle;
          payload.platform = formData.platform;
          break;
        case 3:
          endpoint = '/auth/onboarding/step-3';
          payload.niche = formData.niche;
          payload.country = formData.country;
          break;
        case 4:
          if (onboardingData.role === 'clipper') {
            endpoint = '/auth/onboarding/step-4-clipper';
            payload.followerCount = formData.followerCount;
            payload.pricePerPost = formData.pricePerPost;
          } else {
            // Skip to completion for creators
            return completeOnboarding();
          }
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.data.success) {
        setOnboardingData(prev => prev ? {
          ...prev,
          currentStep: result.data.currentStep
        } : null);
      }
    } catch (error) {
      console.error(`Step ${stepNumber} failed:`, error);
    }
  };

  // 4. Complete onboarding
  const completeOnboarding = async () => {
    if (!onboardingData) return;

    try {
      const response = await fetch('/auth/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingToken: onboardingData.onboardingToken,
          password: formData.password
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Store tokens and redirect to dashboard
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Onboarding completion failed:', error);
    }
  };

  // Render appropriate component based on onboarding step
  const renderStep = () => {
    if (!onboardingData) {
      return (
        <button onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      );
    }

    switch (onboardingData.currentStep) {
      case 0:
        return <RoleSelection onSelect={(role) => setOnboardingData(prev => prev ? {...prev, role} : null)} />;
      case 1:
        return <BrandNameStep formData={formData} setFormData={setFormData} onNext={() => processStep(1)} />;
      case 2:
        return <SocialMediaStep formData={formData} setFormData={setFormData} onNext={() => processStep(2)} />;
      case 3:
        return <NicheLocationStep formData={formData} setFormData={setFormData} onNext={() => processStep(3)} />;
      case 4:
        return onboardingData.role === 'clipper' ?
          <ClipperDetailsStep formData={formData} setFormData={setFormData} onNext={() => processStep(4)} /> :
          <PasswordStep formData={formData} setFormData={setFormData} onNext={completeOnboarding} />;
      case 5:
        return <PasswordStep formData={formData} setFormData={setFormData} onNext={completeOnboarding} />;
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="google-auth-flow">
      {renderStep()}
    </div>
  );
};

export default GoogleAuthFlow;
```

## Error Handling

### Common Error Responses

```typescript
// Invalid token
{
  status: 'error',
  message: 'Invalid or expired onboarding token',
  statusCode: 401
}

// Validation errors
{
  status: 'error',
  message: 'Validation failed',
  errors: [
    {
      property: 'brandName',
      constraints: {
        minLength: 'brandName must be longer than or equal to 2 characters'
      }
    }
  ]
}

// Step sequence errors
{
  status: 'error',
  message: 'Previous steps must be completed first',
  statusCode: 400
}
```

### Frontend Error Handling

```typescript
const handleApiCall = async (url: string, options: RequestInit) => {
  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (result.status === 'error') {
      // Handle specific errors
      if (response.status === 401) {
        // Token expired, restart onboarding
        setOnboardingData(null);
        return;
      }

      // Show validation errors
      if (result.errors) {
        setValidationErrors(result.errors);
        return;
      }

      // Show general error
      setErrorMessage(result.message);
      return;
    }

    return result;
  } catch (error) {
    console.error('API call failed:', error);
    setErrorMessage('Network error. Please try again.');
  }
};
```

## Security Considerations

1. **Token Expiry**: Onboarding tokens expire after 1 hour
2. **Validation**: All input is validated on both client and server
3. **Rate Limiting**: Implement rate limiting on frontend to prevent abuse
4. **HTTPS**: All API calls must be made over HTTPS in production
5. **Token Storage**: Store access tokens securely (use httpOnly cookies in production)

## Testing

### Test User Flow

1. Use Google OAuth Playground for testing tokens
2. Create test accounts with different email domains
3. Test both creator and clipper onboarding flows
4. Verify error handling for invalid tokens
5. Test step sequence validation

### Example Test Cases

```typescript
describe('Google OAuth Flow', () => {
  test('should redirect to Google OAuth URL', async () => {
    const response = await request(app).get('/auth/google/url');
    expect(response.body.data.authUrl).toContain('accounts.google.com');
  });

  test('should require onboarding for new users', async () => {
    const response = await request(app)
      .post('/auth/google/token')
      .send({ idToken: 'valid_test_token' });

    expect(response.body.data.requiresOnboarding).toBe(true);
    expect(response.body.data.onboardingToken).toBeDefined();
  });

  test('should validate step sequence', async () => {
    const response = await request(app).post('/auth/onboarding/step-2').send({
      onboardingToken: 'valid_token',
      socialMediaHandle: 'test_handle',
      platform: 'instagram',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Previous steps must be completed');
  });
});
```

This documentation provides everything the frontend team needs to implement the Google OAuth flow with step-by-step onboarding. The flow is secure, user-friendly, and handles all edge cases appropriately.
