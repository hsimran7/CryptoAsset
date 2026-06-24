import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Initialize Google OAuth Strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.warn('[Passport Warning] Google OAuth credentials are not fully set in .env. Google login will be unavailable.');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId || 'placeholder_client_id',
      clientSecret: googleClientSecret || 'placeholder_client_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user already exists by googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        // 2. Otherwise, check by email
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (email) {
          user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            if (!user.name) {
              user.name = profile.displayName;
            }
            if (profile.photos && profile.photos[0]) {
              user.avatar = profile.photos[0].value;
            }
            user.isVerified = true; // Verified via Google OAuth
            await user.save();
            return done(null, user);
          }
        }

        // 3. Create new user
        // Generate a unique username from email or profile
        let usernameBase = email ? email.split('@')[0] : `user_${profile.id.substring(0, 6)}`;
        let uniqueUsername = usernameBase;
        let count = 1;
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${usernameBase}${count}`;
          count++;
        }

        const newUser = {
          googleId: profile.id,
          name: profile.displayName,
          username: uniqueUsername,
          email: email || `${profile.id}@google.cryptovision.ai`,
          isVerified: true,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
          role: 'user'
        };

        user = await User.create(newUser);
        return done(null, user);
      } catch (err) {
        console.error('[Passport Google Strategy Error]', err);
        return done(err, null);
      }
    }
  )
);
