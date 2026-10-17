// The customer portal's hosting: an Azure Storage static website in Belgium Central (about €0), in
// rg-intplat-customer-portal. A fixed name, so the gateway's CORS and Google's authorised origins
// can name it (integration-platform/routing/staff.yaml). Deployed by this repository's identity.

param location string = 'belgiumcentral'

resource portal 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'stportalintplatdemo'
  location: location
  tags: {
    project: 'ai-intelligence-domain'
    component: 'customer-portal'
    owner: 'channel-team'
  }
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    // The static website endpoint serves $web anonymously; nothing else is public.
    allowBlobPublicAccess: false
    // The deploy identity has control-plane rights only, so the pipeline fetches the account key
    // at deploy time to configure the website and upload. Never stored.
    allowSharedKeyAccess: true
  }
}

output accountName string = portal.name
output url string = portal.properties.primaryEndpoints.web
