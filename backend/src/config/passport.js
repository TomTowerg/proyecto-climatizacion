import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import prisma from '../utils/prisma.js'

console.log('🔧 Inicializando estrategia de Google OAuth')
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Configurado ✓' : 'NO CONFIGURADO ✗')
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Configurado ✓' : 'NO CONFIGURADO ✗')
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL)

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔐 Google OAuth callback ejecutado')
        console.log('Profile ID:', profile.id)
        console.log('Email:', profile.emails?.[0]?.value)
        
        // Buscar usuario por Google ID
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id }
        })

        console.log('Usuario encontrado por googleId:', user ? 'SÍ' : 'NO')

        // Si no existe, buscar por email
        if (!user && profile.emails && profile.emails.length > 0) {
          user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value }
          })

          console.log('Usuario encontrado por email:', user ? 'SÍ' : 'NO')

          // Si existe el email pero no tiene Google ID, actualizar
          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                name: profile.displayName || user.name,
                // Asegurar que tenga role e isActive si no los tiene
                role: user.role || 'user',
                isActive: user.isActive !== undefined ? user.isActive : true
              }
            })
            console.log('Usuario actualizado con googleId')
          }
        }

        // Si no existe, crear nuevo usuario
        if (!user) {
          console.log('Creando nuevo usuario con Google OAuth...')
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              username: profile.emails[0].value.split('@')[0],
              role: 'user',       // ← AGREGADO
              isActive: true      // ← AGREGADO
            }
          })
          console.log('✅ Usuario creado:', user.id)
        }

        console.log('✅ Autenticación exitosa, usuario:', user.id)
        return done(null, user)
      } catch (error) {
        console.error('❌ Error en estrategia de Google:', error)
        return done(error, null)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  console.log('📝 Serializando usuario:', user.id)
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    console.log('📖 Deserializando usuario:', id)
    const user = await prisma.user.findUnique({ where: { id } })
    done(null, user)
  } catch (error) {
    console.error('❌ Error deserializando:', error)
    done(error, null)
  }
})

console.log('✅ Estrategia de Google OAuth configurada completamente')

export default passport