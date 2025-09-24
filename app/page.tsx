'use client'

import { useState } from 'react'
import SearchTab from '@/components/SearchTab'
import OutreachTab from '@/components/OutreachTab'

export default function Home() {
  const [activeTab, setActiveTab] = useState('search')

  const tabs = [
    { id: 'search', label: 'Google Search', component: SearchTab },
    { id: 'outreach', label: 'Email Outreach', component: OutreachTab },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      </div>
    </div>
  )
}
