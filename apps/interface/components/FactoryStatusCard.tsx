'use client'
import Link from 'next/link'
import { Factory, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { FACTORY_ADDRESS } from '@/lib/contracts'
import { useAuth } from '@/lib/auth'

export function FactoryStatusCard() {
  const { isAuthenticated } = useAuth()
  const isFactoryDeployed = FACTORY_ADDRESS && FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000'

  if (isFactoryDeployed) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-500 mb-1">Factory Contract Active</h3>
            <p className="text-sm text-[var(--fg-muted)]">
              Users can now deploy NFT collections through the platform.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (!isAuthenticated) {
    return null // Don't show to unauthenticated users
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-500 mb-1">Factory Contract Required</h3>
          <p className="text-sm text-[var(--fg-muted)] mb-3">
            Deploy the factory contract to enable NFT collection creation for users.
          </p>
          <Link href="/admin/deploy-factory">
            <Button size="sm" className="flex items-center space-x-2">
              <Factory className="w-4 h-4" />
              <span>Deploy Factory</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
