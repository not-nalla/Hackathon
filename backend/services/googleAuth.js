const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const configureGoogleAuth = ({ passport, User, baseUrl, clientID, clientSecret }) => {
  const finalClientID = clientID || process.env.GOOGLE_CLIENT_ID;
  const finalClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  
  if (!finalClientID || !finalClientSecret) {
    console.warn("Google OAuth credentials not found");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: finalClientID,
        clientSecret: finalClientSecret,
        callbackURL: `${baseUrl}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const fullName = profile.displayName;
          const email = profile.emails?.[0]?.value || "";
          const avatarInitials = fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

          let user = await User.findOne({ googleId });
          if (!user && email) {
             user = await User.findOne({ email });
          }

          if (!user) {
            user = await User.create({
              googleId,
              fullName,
              email,
              avatarInitials
            });
          } else {
            user.googleId = googleId;
            user.fullName = fullName;
            if(!user.avatarInitials) user.avatarInitials = avatarInitials;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};

module.exports = { configureGoogleAuth };
