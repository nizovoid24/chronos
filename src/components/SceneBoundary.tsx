import { Component, type ReactNode } from 'react'

export class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { console.error('AION scene:', error); this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}
