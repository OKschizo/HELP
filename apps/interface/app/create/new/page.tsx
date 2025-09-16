'use client'
import { useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { Stepper } from '@/components/ui/Stepper'
import { DetailsStep } from './steps/DetailsStep'
import { UploadStep } from './steps/UploadStep'
import { DeployStep } from './steps/DeployStep'
import { SuccessStep } from './steps/SuccessStep'

interface NFTAttribute {
  trait_type: string
  value: string | number
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: NFTAttribute[]
}

export interface NFTItem {
  id: string
  file: File
  preview: string
  metadata: NFTMetadata
}

export interface LaunchDraft {
  // Collection details
  contractName: string
  collectionName: string
  symbol: string
  enforceRoyalties: boolean
  revealLater: boolean
  launchDate: string | null
  endDate: string | null
  allowlistStartDate?: string | null
  allowlistEndDate?: string | null
  
  // NFT details
  baseArtName: string
  description: string
  mintCostEth: string
  allowlistPrice?: string
  mintsPerWallet: number
  maxPerTx: number
  
  // Files and metadata
  assets: File[]
  metadata: File[]
  nftItems: NFTItem[]
  placeholderURI: string
  
  // Contract settings
  royaltyReceiver: `0x${string}` | ''
  royaltyBps: number
  feeRecipient: `0x${string}` | ''
  feeBps: number
  merkleRoot?: `0x${string}` | ''
  
  // Upload results
  assetsCID?: string
  metaCID?: string
  
  // Deploy results
  deployedAddress?: string
  deployTxHash?: string
}

const initialDraft: LaunchDraft = {
  contractName: '',
  collectionName: '',
  symbol: '',
  enforceRoyalties: false,
  revealLater: false,
  launchDate: null,
  endDate: null,
  allowlistStartDate: null,
  allowlistEndDate: null,
  baseArtName: 'NFT #',
  description: '{name} – Generated and deployed on HyperEVM.',
  mintCostEth: '0.05',
  mintsPerWallet: 5,
  maxPerTx: 3,
  assets: [],
  metadata: [],
  nftItems: [],
  placeholderURI: '',
  royaltyReceiver: '',
  royaltyBps: 500, // 5%
  feeRecipient: '',
  feeBps: 250, // 2.5%
  merkleRoot: '',
}

const steps = [
  { id: 'details', title: 'Details', description: 'Collection info' },
  { id: 'upload', title: 'Upload', description: 'Assets & metadata' },
  { id: 'deploy', title: 'Deploy', description: 'Launch contract' },
  { id: 'success', title: 'Success', description: 'Collection live' },
]

export default function CreateNewPage() {
  const [currentStep, setCurrentStep] = useState('details')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [draft, setDraft] = useState<LaunchDraft>(initialDraft)

  const updateDraft = (updates: Partial<LaunchDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }))
  }

  const goToStep = (stepId: string) => {
    setCurrentStep(stepId)
  }

  const completeStep = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId])
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'details':
        return (
          <DetailsStep
            draft={draft}
            updateDraft={updateDraft}
            onNext={() => {
              completeStep('details')
              goToStep('upload')
            }}
          />
        )
      case 'upload':
        return (
          <UploadStep
            draft={draft}
            updateDraft={updateDraft}
            onNext={() => {
              completeStep('upload')
              goToStep('deploy')
            }}
            onBack={() => goToStep('details')}
          />
        )
      case 'deploy':
        return (
          <DeployStep
            draft={draft}
            updateDraft={updateDraft}
            onNext={() => {
              completeStep('deploy')
              goToStep('success')
            }}
            onBack={() => goToStep('upload')}
          />
        )
      case 'success':
        return <SuccessStep draft={draft} />
      default:
        return null
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gradient mb-2">
            Launch Your Collection
          </h1>
          <p className="text-[var(--fg-muted)]">
            Follow our guided process to deploy your NFT collection on HyperEVM
          </p>
        </div>

        <Stepper
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          className="mb-12"
        />

        <div className="min-h-[600px]">
          {renderCurrentStep()}
        </div>
      </div>
    </AuthGuard>
  )
}
