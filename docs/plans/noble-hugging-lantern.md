# NX-100: Frontend Password Change Modal

## Summary

Implement password change modal with two modes:
1. **Voluntary** - User-initiated from settings/profile menu
2. **Forced** - Blocking modal when `mustChangePassword=true` (admin-triggered)

## Design Approach

Use existing component patterns from the codebase:
- **Forced mode**: Follow `AuthModal` pattern (blur overlay, centered card, no close button)
- **Voluntary mode**: Use existing `Modal` component
- **Fields**: Reuse `Field` component with Eye/EyeOff icons (like AuthModal)
- **Buttons**: Use existing `Button` component (primary, ghost variants)
- **Styling**: Use CSS variables from `variables.css`

---

## File Structure

```
frontend/src/
  components/
    ChangePasswordModal/
      ChangePasswordModal.jsx
      ChangePasswordModal.css
      index.js
    PasswordRequirements/
      PasswordRequirements.jsx
      PasswordRequirements.css
      passwordValidation.js
      index.js
```

---

## Implementation Steps

### 1. Create PasswordRequirements component

**Files:**
- `/frontend/src/components/PasswordRequirements/passwordValidation.js`
- `/frontend/src/components/PasswordRequirements/PasswordRequirements.jsx`
- `/frontend/src/components/PasswordRequirements/PasswordRequirements.css`
- `/frontend/src/components/PasswordRequirements/index.js`

**Features:**
- Real-time validation as user types
- 5 rules: min 8 chars, uppercase, lowercase, digit, special char (!@#$%^&*)
- Visual indicators: Check (green) when passed, X (gray) when not

### 2. Update authApi.js - changePassword function

**File:** `/frontend/src/api/authApi.js`

**Change:** Handle new tokens in response (accessToken) - currently function ignores response.

### 3. Add PASSWORD_CHANGE_REQUIRED interceptor

**File:** `/frontend/src/api/client.js`

**Changes:**
- Add `setPasswordChangeRequiredCallback(callback)` export
- In response interceptor: catch 403 with code `PASSWORD_CHANGE_REQUIRED`
- Call callback to trigger forced modal

### 4. Update AuthContext

**File:** `/frontend/src/contexts/AuthContext.jsx`

**Changes:**
- Wire up `setPasswordChangeRequiredCallback` to set `mustChangePassword=true`
- Ensure `onPasswordChanged()` clears the flag

### 5. Create ChangePasswordModal component

**Files:**
- `/frontend/src/components/ChangePasswordModal/ChangePasswordModal.jsx`
- `/frontend/src/components/ChangePasswordModal/ChangePasswordModal.css`
- `/frontend/src/components/ChangePasswordModal/index.js`

**Props:**
- `isOpen: boolean`
- `mode: 'voluntary' | 'forced'`
- `onClose: function` (only for voluntary)

**Features:**
- 3 password fields: current, new, confirm (all with show/hide toggle)
- PasswordRequirements checklist under new password field
- Submit disabled until: current filled + requirements met + passwords match
- Loading state with spinner
- Error handling: wrong current password, policy violation, same as current
- Forced mode: no close button, no overlay click, Logout button available

### 6. Integrate into App.jsx

**File:** `/frontend/src/App.jsx`

**Changes:**
- Add `<ChangePasswordModal isOpen={mustChangePassword} mode="forced" />` at app level
- Shows automatically when `mustChangePassword=true`

### 7. Add voluntary trigger (optional)

**Location:** User settings/profile menu (depends on where it exists)

**Pattern:**
```jsx
const [showPasswordModal, setShowPasswordModal] = useState(false);
<ChangePasswordModal isOpen={showPasswordModal} mode="voluntary" onClose={() => setShowPasswordModal(false)} />
```

---

## Error Codes from Backend

| Code | HTTP | Description | UI Action |
|------|------|-------------|-----------|
| `INVALID_PASSWORD` | 401 | Wrong current password | Show field error |
| `PASSWORD_CHANGE_REQUIRED` | 403 | Must change password | Trigger forced modal |
| `VALIDATION_ERROR` | 400 | Policy violation | Show field error |

---

## Critical Files to Modify

| File | Action |
|------|--------|
| `/frontend/src/api/authApi.js` | Update changePassword to handle tokens |
| `/frontend/src/api/client.js` | Add interceptor callback |
| `/frontend/src/contexts/AuthContext.jsx` | Wire up callback |
| `/frontend/src/App.jsx` | Add forced modal |

---

## Verification

1. **Voluntary flow:**
   - Open modal from user menu
   - Enter current + new password
   - Verify requirements checklist updates in real-time
   - Submit and verify success toast

2. **Forced flow:**
   - Login with user that has `mustChangePassword=true`
   - Modal should appear immediately (cannot dismiss)
   - Logout button should work
   - After password change, modal closes and app continues

3. **Interceptor flow:**
   - While logged in, make API call that returns 403 PASSWORD_CHANGE_REQUIRED
   - Forced modal should appear

4. **Error handling:**
   - Wrong current password shows field error
   - Passwords don't match shows error
   - Network error shows general error
