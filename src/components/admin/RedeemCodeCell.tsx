'use client'

export const RedeemCodeCell = ({ cellData }: { cellData?: string }) => {
  const code = cellData ?? ''
  return <span>{maskCode(code)}</span>
}

function maskCode(code: string): string {
  if (!code) return '-'
  if (code.length <= 8) return '****'
  return `${code.slice(0, 4)}-${'*'.repeat(4)}-${code.slice(-4)}`
}
