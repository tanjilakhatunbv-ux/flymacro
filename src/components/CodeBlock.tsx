'use client'

import { useState } from 'react'

export function CodeBlock({ code, language = 'lua' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore — older browser without clipboard API */
    }
  }

  return (
    <div className="code-block-wrapper">
      <button type="button" className="code-copy-btn" onClick={handleCopy}>
        {copied ? '已复制' : '复制'}
      </button>
      <div className="code-scroll-area">
        <pre>
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  )
}
