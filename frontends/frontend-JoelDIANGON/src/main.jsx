import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './styles/scene.css'
import './styles/panel.css'
import './styles/sections.css'
import './styles/search.css'
import './styles/classic.css'
import './styles/cv.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
