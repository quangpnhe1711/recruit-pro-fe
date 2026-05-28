import { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import MockJsonButton from '../../common/components/MockJsonButton'
import {  setVariant } from '../../store/slices/authSlice'
import { setProfile } from '../../store/slices/userSlice'

function InternalLoginScreen() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const employeeIdPlaceholder = useMemo(
    () => 'e.g. RP-8829 or name@recruitpro.com',
    [],
  )

  function onSubmit(e) {
    e.preventDefault()
    setSubmitted(true)

    const emailLike = employeeId.includes('@')
      ? employeeId
      : `${employeeId || 'alex.rivera'}@recruitpro.com`

    dispatch(setVariant('internal'))
    dispatch(
      setProfile({
        id: 'employee-1',
        name: 'Alex Rivera',
        email: emailLike,
      })
    )

    navigate('/internal/dashboard', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
      >
        <div className="h-full w-full bg-[#f9f9f9] [background-image:radial-gradient(#e31b23_0.5px,transparent_0.5px)] [background-size:24px_24px]" />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 md:px-10">
        <div className="flex w-full max-w-[440px] flex-col items-center">
          <div className="mb-10 text-center">
            <div className="mb-2 flex items-center justify-center">
              <h1 className="text-[32px] font-black tracking-[-0.02em] text-[#1a1a1a] md:text-[48px] md:leading-[56px]">
                RecruitPro <span className="text-[#b90014] block">Internal</span>
              </h1>
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-[#5d3f3c]">
              Enterprise Staff Portal
            </p>
          </div>

          <div className="w-full rounded-lg border border-[#926e6b]/20 bg-white p-8 shadow-[0_0_40px_rgba(185,0,20,0.05)] md:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-[#5d3f3c]">
                  Secure Access
                </p>
                <h2 className="text-[24px] font-semibold leading-8 text-[#1a1c1c]">
                  Staff Portal Login
                </h2>
              </div>
              <MockJsonButton
                className="shrink-0"
                label="Test Mock JSON"
                payload={{
                  screen: 'InternalLoginScreen',
                  employeeId,
                  showPassword,
                  submitted,
                }}
              />
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div>
                <label
                  className="mb-2 block text-[12px] font-semibold tracking-[0.05em] text-[#5d3f3c]"
                  htmlFor="employee-id"
                >
                  Employee ID or Corporate Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#5d3f3c]">
                    badge
                  </span>
                  <input
                    id="employee-id"
                    name="employee-id"
                    type="text"
                    required
                    placeholder={employeeIdPlaceholder}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full rounded-none border border-[#926e6b]/30 bg-[#f9f9f9] py-3 pl-10 pr-4 text-[14px] leading-[20px] outline-none transition-colors focus:border-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-end justify-between">
                  <label
                    className="block text-[12px] font-semibold tracking-[0.05em] text-[#5d3f3c]"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014] transition-all hover:underline"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#5d3f3c]">
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-none border border-[#926e6b]/30 bg-[#f9f9f9] py-3 pl-10 pr-12 text-[14px] leading-[20px] outline-none transition-colors focus:border-[#1a1a1a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d3f3c] transition-colors hover:text-[#1a1a1a]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 bg-[#b90014] py-4 text-[16px] font-semibold text-white transition-colors active:scale-[0.98] hover:bg-[#e31b23]"
              >
                <span>Secure Access</span>
                <span className="material-symbols-outlined text-xl">login</span>
              </button>

              {submitted ? (
                <p className="text-[12px] text-[#5d3f3c]">
                  Demo: form submitted (UI only).
                </p>
              ) : null}
            </form>

            <div className="mt-8 flex items-start gap-3 border-l-4 border-[#ba1a1a] bg-[#ffdad6]/20 p-4">
              <span className="material-symbols-outlined text-xl text-[#ba1a1a]">
                warning
              </span>
              <p className="text-[14px] leading-tight text-[#93000a]">
                <span className="font-bold">Authorized Personnel Only.</span>
                <br />
                This is a restricted enterprise system. All access attempts and
                activities are logged and monitored.
              </p>
            </div>
            <div className="mt-4 flex justify-center">
              <Link
                className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014] hover:underline"
                to="/internal/jobs"
              >
                Preview Internal Jobs
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default InternalLoginScreen
