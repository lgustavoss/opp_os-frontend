import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initApiClient } from './utils/axios'

const root = document.getElementById('root')

initApiClient()
  .catch((err) => {
    console.error(err)
  })
  .finally(() => {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })

