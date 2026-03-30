import { AuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"

const REPO_OWNER = "Sampa-J"
const REPO_NAME = "marketing-hub"
const ADMIN_LOGIN = "Sampa-J"

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      const login = (profile as { login?: string })?.login
      if (!login || !account?.access_token) return false

      // Verifica se o usuário tem push access ao repo (= é colaborador)
      const res = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`,
        {
          headers: {
            Authorization: `token ${account.access_token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      )
      if (!res.ok) return false
      const data = await res.json()
      return data.permissions?.push === true || data.permissions?.admin === true
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.login = (profile as { login?: string }).login
        token.avatar_url = (profile as { avatar_url?: string }).avatar_url
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        login: token.login as string,
        avatar_url: token.avatar_url as string,
        isAdmin: token.login === ADMIN_LOGIN,
      }
      return session
    },
  },
}
