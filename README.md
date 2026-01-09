# Portfolio Website - Firebase Firestore Rules Deployment Guide

## Issue
When submitting the contact form, you're getting the error:
```
Error sending message: FirebaseError: Missing or insufficient permissions.
```

## Root Cause
The Firestore security rules don't allow public write access to the `contacts` collection.

## Solution
We've updated the `firestore.rules` file to allow public write access to the contacts collection. You need to deploy these updated rules to Firebase.

### Step 1: Verify the Updated Rules
The `firestore.rules` file has been updated with the following rule:

```rules
// Allow public write access to contacts collection (for contact form)
match /contacts/{contactId} {
  allow write: if true;
}
```

### Step 2: Deploy Rules Using Firebase CLI

#### Prerequisites
- Node.js and npm installed
- Firebase CLI installed globally: `npm install -g firebase-tools`

#### Deployment Steps
1. **Authenticate with Firebase**:
   ```bash
   firebase login
   ```
   This will open a browser window for you to sign in with your Google account.

2. **Deploy the Firestore rules**:
   ```bash
   firebase deploy --only firestore:rules --project portfolio-676c0
   ```

### Step 3: Alternative - Deploy via Firebase Console

If you prefer using the web interface:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `portfolio-676c0`
3. Navigate to **Firestore Database** > **Rules**
4. Replace the existing rules with the content from your `firestore.rules` file
5. Click **Publish**

### Step 4: Verify Deployment

After deployment, test the contact form again. It should submit successfully without the permission error.

## Security Considerations

The current rule allows anyone to write to the contacts collection. For production, you might want to add additional security measures:

1. **Limit the fields that can be written**
2. **Add rate limiting**
3. **Add validation for email format**
4. **Consider adding reCAPTCHA**

## Contact Form Code

The contact form submission code in `main.js` is correctly implemented:

```javascript
// Create contact submission object
const contactSubmission = {
  name: formData.get('name').trim(),
  email: formData.get('email').trim(),
  phone: formData.get('phone').trim(),
  linkedin: formData.get('linkedin').trim(),
  message: message,
  timestamp: new Date().toISOString()
};

// Add to Firestore
await addDoc(collection(db, 'contacts'), contactSubmission);
```

## Troubleshooting

If you still encounter issues:

1. **Check Firebase Console for rule violations**:
   - Go to **Firestore Database** > **Monitoring** > **Rules Playground**
   - Test your write operation to see if it passes the rules

2. **Verify the collection name**:
   - Ensure the code is using the correct collection name: `contacts`

3. **Check network connectivity**:
   - Ensure your device has a stable internet connection

4. **Clear browser cache**:
   - Sometimes cached rules can cause issues

## Support

If you continue to experience problems, please check the [Firebase Firestore Rules documentation](https://firebase.google.com/docs/firestore/security/get-started) or contact Firebase support.