import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // If already logged in, redirect home
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* Dark hero — compact version */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-5">
        <div className="pt-8">
          <h1 className="text-[28px] font-medium text-da-bg leading-none tracking-tight mb-1">
            Logg inn
          </h1>
          <p className="font-serif italic text-sm text-da-dark-slogan">
            Lagre fremgangen din og f&aring; tilgang til alle sp&oslash;rsm&aring;l
          </p>
        </div>
      </div>

      {/* Fade */}
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      {/* Auth form */}
      <div className="px-6 pt-2 pb-6 bg-da-bg">
        <div className="max-w-sm mx-auto">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#1a365d',
                    brandAccent: '#2a4a7f',
                    inputBackground: 'white',
                    inputBorder: 'rgba(26, 54, 93, 0.3)',
                    inputBorderFocus: '#1a365d',
                    inputBorderHover: 'rgba(26, 54, 93, 0.6)',
                  },
                  borderWidths: { buttonBorderWidth: '0.5px', inputBorderWidth: '0.5px' },
                  radii: { borderRadiusButton: '0.5rem', inputBorderRadius: '0.5rem' },
                  fonts: { bodyFontFamily: 'ui-sans-serif, system-ui, sans-serif' },
                },
              },
            }}
            providers={[]}
            magicLink={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-post',
                  password_label: 'Passord',
                  email_input_placeholder: 'din@epost.no',
                  password_input_placeholder: 'Ditt passord',
                  button_label: 'Logg inn',
                  link_text: 'Har du allerede en konto? Logg inn',
                  loading_button_label: 'Logger inn ...',
                },
                sign_up: {
                  email_label: 'E-post',
                  password_label: 'Passord',
                  email_input_placeholder: 'din@epost.no',
                  password_input_placeholder: 'Velg et passord',
                  button_label: 'Opprett konto',
                  link_text: 'Har du ikke konto? Opprett konto',
                  loading_button_label: 'Oppretter konto ...',
                },
                magic_link: {
                  email_input_label: 'E-post',
                  email_input_placeholder: 'din@epost.no',
                  button_label: 'Send magisk lenke',
                  link_text: 'Send en magisk lenke til e-posten',
                  loading_button_label: 'Sender lenke ...',
                  confirmation_text: 'Sjekk e-posten din for den magiske lenken',
                },
                forgotten_password: {
                  email_label: 'E-post',
                  password_label: 'Passord',
                  email_input_placeholder: 'din@epost.no',
                  button_label: 'Send tilbakestillingslenke',
                  link_text: 'Glemt passord?',
                  loading_button_label: 'Sender ...',
                  confirmation_text: 'Sjekk e-posten din for tilbakestillingslenken',
                },
              },
            }}
            redirectTo={`${window.location.origin}/auth/callback`}
            view="magic_link"
          />

          <button
            onClick={() => navigate('/')}
            className="quiz-option w-full mt-6 bg-white border-[0.5px] border-da-navy/30 hover:border-da-navy/60 text-da-navy font-medium py-3 px-4 rounded-lg transition-colors text-[14px]"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    </div>
  )
}
