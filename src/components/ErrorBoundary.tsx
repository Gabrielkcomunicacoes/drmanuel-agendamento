import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Sem isto, qualquer excecao nao tratada durante o render derruba a arvore
 * inteira do React e deixa a tela em branco, sem nenhuma pista visual do que
 * aconteceu (foi o que houve em 14/08/2026 com uma env var vazia no build).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro nao tratado capturado pelo ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-4 text-center">
        <p className="text-lg font-semibold text-ink">Algo deu errado</p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Um erro inesperado impediu a página de carregar. Tente recarregar —
          se persistir, avise a equipe técnica.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-blue-600"
        >
          <RefreshCw className="h-4 w-4" />
          Recarregar página
        </button>
      </div>
    )
  }
}
