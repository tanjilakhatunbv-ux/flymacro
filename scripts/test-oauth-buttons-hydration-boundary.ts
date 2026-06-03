import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const authPage = readFileSync(join(root, 'src/app/(frontend)/[locale]/auth/page.tsx'), 'utf8')
const oauthButtons = readFileSync(join(root, 'src/components/OAuthButtons.tsx'), 'utf8')

if (oauthButtons.includes("import { isGoogleOAuthConfigured, isGitHubOAuthConfigured }")) {
  console.error('OAuthButtons is a client component and must not read server-only OAuth env helpers.')
  process.exit(1)
}

if (!oauthButtons.includes('hasGoogle') || !oauthButtons.includes('hasGitHub')) {
  console.error('OAuthButtons must receive OAuth availability through serializable props.')
  process.exit(1)
}

if (
  !authPage.includes('isGoogleOAuthConfigured()') ||
  !authPage.includes('isGitHubOAuthConfigured()') ||
  !authPage.includes('hasGoogle={') ||
  !authPage.includes('hasGitHub={')
) {
  console.error('Auth page must compute OAuth availability on the server and pass it to OAuthButtons.')
  process.exit(1)
}

console.log('OAuth buttons keep server-only env checks out of client hydration.')
