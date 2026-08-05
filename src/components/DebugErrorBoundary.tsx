'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  message: string
  componentStack: string
}

export default class DebugErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '', componentStack: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message, componentStack: '' }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // ✅ ESTO es lo que nos va a decir el componente EXACTO, sin depender de source maps
    console.error('🎯 COMPONENT STACK (esto sí es confiable):')
    console.error(info.componentStack)
    this.setState({ componentStack: info.componentStack || '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: '#1a0505', color: '#ff8888', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ color: '#ff4444' }}>🎯 Error capturado</h2>
          <p><strong>Mensaje:</strong> {this.state.message}</p>
          <p><strong>Component stack (mirá la consola del navegador también):</strong></p>
          <pre style={{ background: '#000', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            {this.state.componentStack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}