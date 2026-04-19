import { useState, useEffect } from 'react'
import './App.css'
import { Home } from './pages/Home'
import { Callback } from './pages/Callback'

function App() {
  const [route, setRoute] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (route === '/callback') {
    return <Callback />
  }

  return <Home />
}

export default App
