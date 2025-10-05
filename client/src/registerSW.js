import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    if (confirm('A new version of Sally is available. Refresh now?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('✅ Sally is ready to work offline')
  }
})
