import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import prisma from '../utils/prisma.js'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar usuario por Google ID
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id }
        })

        // Si no existe, buscar por email
        if (!user && profile.emails && profile.emails.length > 0) {
          user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value }
          })

          // Si existe el email pero no tiene Google ID, actualizar
          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                name: profile.displayName || user.name
              }
            })
          }
        }

        // Si no existe, crear nuevo usuario
        if (!user) {
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              username: profile.emails[0].value.split('@')[0]
            }
          })
        }

        return done(null, user)
      } catch (error) {
        console.error('Error en estrategia de Google:', error)
        return done(error, null)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

export default passport