type MockJsonButtonProps = {
  label?: string
  payload: Record<string, unknown>
  className?: string
}

function MockJsonButton({
  label = 'Test Mock JSON',
  payload,
  className = '',
}: MockJsonButtonProps) {
  function handleClick() {
    console.log('[mock-json]', payload)
  }

  return (
    <button
      type="button"
      className={`rounded border border-[#e2dfde] bg-white px-3 py-2 text-[12px] font-semibold text-[#1a1c1c] transition-colors hover:border-[#b90014] hover:text-[#b90014] ${className}`}
      onClick={handleClick}
    >
      {label}
    </button>
  )
}

export default MockJsonButton
