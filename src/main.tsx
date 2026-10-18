import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { temaManager } from './application/state/tema.state'
import { preferenciasManager } from './application/state/preferencias.state'
import { Raiz } from './interface/rota/Raiz'

await Promise.all([temaManager.inicializar(), preferenciasManager.inicializar()])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Raiz />
  </StrictMode>,
)
