import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Loader2, Upload, Plus, RefreshCw, Database } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ResultMessage {
  type: 'success' | 'error' | 'info'
  message: string
  id?: string
  data?: any
}

export function ToolsPage() {
  const { session } = useAuth()
  
  // Companies section state
  const [companyForm, setCompanyForm] = useState({
    name: '',
    ticker: '',
    domain: '',
    aliases: ''
  })
  const [companyLoading, setCompanyLoading] = useState(false)
  const [companyResult, setCompanyResult] = useState<ResultMessage | null>(null)
  
  // Topics section state
  const [topicForm, setTopicForm] = useState({
    name: '',
    queries: ''
  })
  const [topicLoading, setTopicLoading] = useState(false)
  const [topicResult, setTopicResult] = useState<ResultMessage | null>(null)
  
  // RSS section state
  const [rssLoading, setRssLoading] = useState(false)
  const [rssResult, setRssResult] = useState<ResultMessage | null>(null)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [refreshResult, setRefreshResult] = useState<ResultMessage | null>(null)
  
  // Document section state
  const [docForm, setDocForm] = useState({
    fileType: 'pdf'
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [parseLoading, setParseLoading] = useState(false)
  const [docResult, setDocResult] = useState<ResultMessage | null>(null)
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null)
  
  // KPI section state
  const [kpiFile, setKpiFile] = useState<File | null>(null)
  const [kpiLoading, setKpiLoading] = useState(false)
  const [kpiResult, setKpiResult] = useState<ResultMessage | null>(null)

  const callFunction = async (functionName: string, body: any = {}) => {
    if (!session?.access_token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`https://pbfqdfipjnaqhoxhlitw.supabase.co/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Company functions
  const createCompany = async () => {
    if (!companyForm.name) {
      setCompanyResult({ type: 'error', message: 'Company name is required' })
      return
    }

    setCompanyLoading(true)
    setCompanyResult(null)

    try {
      const aliases = companyForm.aliases 
        ? companyForm.aliases.split(',').map(a => a.trim()).filter(a => a)
        : null

      const result = await callFunction('companies', {
        name: companyForm.name,
        ticker: companyForm.ticker || null,
        domain: companyForm.domain || null,
        aliases
      })

      setCompanyResult({
        type: 'success',
        message: `Company "${result.company.name}" created successfully`,
        id: result.company.id,
        data: result.company
      })
      
      setCompanyForm({ name: '', ticker: '', domain: '', aliases: '' })
      toast({ title: "Success", description: "Company created successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create company'
      setCompanyResult({ type: 'error', message })
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setCompanyLoading(false)
    }
  }

  const autogenerateFeeds = async (targetType: 'company' | 'topic', targetId: string) => {
    try {
      const result = await callFunction('feeds-autogenerate', {
        targetType,
        targetId
      })

      const message = `Generated ${result.feeds.length} RSS feed(s) for ${targetType}`
      
      if (targetType === 'company') {
        setCompanyResult({
          type: 'success',
          message: companyResult?.message + ` • ${message}`,
          id: companyResult?.id,
          data: { ...companyResult?.data, feeds: result.feeds }
        })
      } else {
        setTopicResult({
          type: 'success',
          message: topicResult?.message + ` • ${message}`,
          id: topicResult?.id,
          data: { ...topicResult?.data, feeds: result.feeds }
        })
      }

      toast({ title: "Success", description: message })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate feeds'
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  // Topic functions
  const createTopic = async () => {
    if (!topicForm.name || !topicForm.queries) {
      setTopicResult({ type: 'error', message: 'Topic name and queries are required' })
      return
    }

    setTopicLoading(true)
    setTopicResult(null)

    try {
      const queries = topicForm.queries
        .split(',')
        .map(q => q.trim())
        .filter(q => q)

      const result = await callFunction('topics', {
        name: topicForm.name,
        queries
      })

      setTopicResult({
        type: 'success',
        message: `Topic "${result.topic.name}" created successfully`,
        id: result.topic.id,
        data: result.topic
      })
      
      setTopicForm({ name: '', queries: '' })
      toast({ title: "Success", description: "Topic created successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create topic'
      setTopicResult({ type: 'error', message })
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setTopicLoading(false)
    }
  }

  // RSS functions
  const fetchRSS = async () => {
    setRssLoading(true)
    setRssResult(null)

    try {
      const result = await callFunction('fetch-rss')
      
      setRssResult({
        type: 'success',
        message: `RSS fetch completed: ${result.inserted} items inserted, ${result.skipped} skipped`,
        data: result
      })
      
      toast({ title: "Success", description: "RSS feeds fetched successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch RSS feeds'
      setRssResult({ type: 'error', message })
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setRssLoading(false)
    }
  }

  const refreshCards = async () => {
    setRefreshLoading(true)
    setRefreshResult(null)

    try {
      const result = await callFunction('refresh-cards')
      
      setRefreshResult({
        type: 'success',
        message: `Cards refreshed: ${result.cards_updated} cards updated`,
        data: result
      })
      
      toast({ title: "Success", description: "Dashboard cards refreshed successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh cards'
      setRefreshResult({ type: 'error', message })
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setRefreshLoading(false)
    }
  }

  // Document functions
  const uploadDocument = async () => {
    if (!selectedFile) {
      setDocResult({ type: 'error', message: 'Please select a file to upload' })
      return
    }

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx', 'pptx', 'xlsx'].includes(fileExtension || '')) {
      setDocResult({ type: 'error', message: 'Only PDF, DOCX, PPTX, and XLSX files are supported' })
      return
    }

    setUploadLoading(true)
    setDocResult(null)

    try {
      // Get signed upload URL
      const signResult = await callFunction('documents-sign-upload', {
        ext: fileExtension
      })

      // Upload file to signed URL
      const uploadResponse = await fetch(signResult.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage')
      }

      setUploadedDocId(signResult.documentId)
      setDocResult({
        type: 'success',
        message: `Document uploaded successfully`,
        id: signResult.documentId
      })
      
      toast({ title: "Success", description: "Document uploaded successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload document'
      setDocResult({ type: 'error', message })
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setUploadLoading(false)
    }
  }

  const parseDocument = async () => {
    if (!uploadedDocId) {
      setDocResult({ type: 'error', message: 'No uploaded document to parse' })
      return
    }

    setParseLoading(true)

    try {
      const result = await fetch(`https://pbfqdfipjnaqhoxhlitw.supabase.co/functions/v1/documents-parse/${uploadedDocId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!result.ok) {
        const error = await result.json()
        throw new Error(error.error || `HTTP ${result.status}`)
      }

      const parsedResult = await result.json()
      
      setDocResult({
        type: 'success',
        message: `Document parsed successfully: ${parsedResult.bullets?.length || 0} key insights extracted`,
        data: parsedResult
      })
      
      toast({ title: "Success", description: "Document parsed successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse document'
      setDocResult({ type: 'error', message })
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setParseLoading(false)
    }
  }

  // KPI functions
  const importKPIs = async () => {
    if (!kpiFile) {
      setKpiResult({ type: 'error', message: 'Please select an Excel file to import' })
      return
    }

    const fileExtension = kpiFile.name.split('.').pop()?.toLowerCase()
    if (fileExtension !== 'xlsx') {
      setKpiResult({ type: 'error', message: 'Only XLSX files are supported for KPI import' })
      return
    }

    setKpiLoading(true)
    setKpiResult(null)

    try {
      // First upload the file
      const signResult = await callFunction('documents-sign-upload', {
        ext: 'xlsx'
      })

      const uploadResponse = await fetch(signResult.uploadUrl, {
        method: 'PUT',
        body: kpiFile,
        headers: {
          'Content-Type': kpiFile.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage')
      }

      // Then import KPIs from the uploaded file
      const result = await callFunction('kpis-import-xlsx', {
        documentId: signResult.documentId
      })
      
      setKpiResult({
        type: 'success',
        message: `KPI import completed: ${result.kpis_imported} KPIs, ${result.data_points} data points`,
        data: result
      })
      
      setKpiFile(null)
      toast({ title: "Success", description: "KPIs imported successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import KPIs'
      setKpiResult({ type: 'error', message })
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setKpiLoading(false)
    }
  }

  const ResultAlert = ({ result }: { result: ResultMessage | null }) => {
    if (!result) return null

    return (
      <Alert className={`mt-4 ${result.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
        {result.type === 'error' ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        <AlertDescription>
          {result.message}
          {result.id && (
            <div className="mt-2">
              <Badge variant="outline" className="font-mono">ID: {result.id}</Badge>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tools</h1>
        <p className="text-muted-foreground">Manage your data sources and content generation.</p>
      </div>

      {/* Companies Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Companies
          </CardTitle>
          <CardDescription>
            Create companies and auto-generate RSS feeds for competitor tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Apple Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-ticker">Stock Ticker</Label>
              <Input
                id="company-ticker"
                value={companyForm.ticker}
                onChange={(e) => setCompanyForm({ ...companyForm, ticker: e.target.value })}
                placeholder="AAPL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-domain">Domain</Label>
              <Input
                id="company-domain"
                value={companyForm.domain}
                onChange={(e) => setCompanyForm({ ...companyForm, domain: e.target.value })}
                placeholder="apple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-aliases">Aliases (comma-separated)</Label>
              <Input
                id="company-aliases"
                value={companyForm.aliases}
                onChange={(e) => setCompanyForm({ ...companyForm, aliases: e.target.value })}
                placeholder="Apple, iPhone, iPad"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={createCompany} 
              disabled={companyLoading}
              className="flex items-center gap-2"
            >
              {companyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Company
            </Button>
            
            {companyResult?.id && (
              <Button 
                variant="outline" 
                onClick={() => autogenerateFeeds('company', companyResult.id!)}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Generate Feeds
              </Button>
            )}
          </div>
          
          <ResultAlert result={companyResult} />
        </CardContent>
      </Card>

      {/* Topics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Topics
          </CardTitle>
          <CardDescription>
            Create industry topics and auto-generate RSS feeds for trend monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Topic Name *</Label>
              <Input
                id="topic-name"
                value={topicForm.name}
                onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                placeholder="Artificial Intelligence"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-queries">Search Queries * (comma-separated)</Label>
              <Textarea
                id="topic-queries"
                value={topicForm.queries}
                onChange={(e) => setTopicForm({ ...topicForm, queries: e.target.value })}
                placeholder="artificial intelligence, machine learning, AI technology"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={createTopic} 
              disabled={topicLoading}
              className="flex items-center gap-2"
            >
              {topicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Topic
            </Button>
            
            {topicResult?.id && (
              <Button 
                variant="outline" 
                onClick={() => autogenerateFeeds('topic', topicResult.id!)}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Generate Feeds
              </Button>
            )}
          </div>
          
          <ResultAlert result={topicResult} />
        </CardContent>
      </Card>

      <Separator />

      {/* RSS Jobs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            RSS Jobs
          </CardTitle>
          <CardDescription>
            Fetch latest content from RSS feeds and refresh dashboard cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={fetchRSS} 
              disabled={rssLoading}
              className="flex items-center gap-2"
            >
              {rssLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Fetch RSS Feeds
            </Button>
            
            <Button 
              variant="outline"
              onClick={refreshCards} 
              disabled={refreshLoading}
              className="flex items-center gap-2"
            >
              {refreshLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Cards
            </Button>
          </div>
          
          <ResultAlert result={rssResult} />
          <ResultAlert result={refreshResult} />
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload & Parse
          </CardTitle>
          <CardDescription>
            Upload business documents (PDF, DOCX, PPTX) and extract key insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-file">Select Document</Label>
            <Input
              id="document-file"
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] || null)
                setUploadedDocId(null)
                setDocResult(null)
              }}
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, DOCX, PPTX
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={uploadDocument} 
              disabled={uploadLoading || !selectedFile}
              className="flex items-center gap-2"
            >
              {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Document
            </Button>
            
            {uploadedDocId && (
              <Button 
                variant="outline"
                onClick={parseDocument} 
                disabled={parseLoading}
                className="flex items-center gap-2"
              >
                {parseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Parse & Extract
              </Button>
            )}
          </div>
          
          <ResultAlert result={docResult} />
        </CardContent>
      </Card>

      {/* KPI Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            KPI Import
          </CardTitle>
          <CardDescription>
            Upload Excel files with KPI data to track business metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kpi-file">Select Excel File</Label>
            <Input
              id="kpi-file"
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                setKpiFile(e.target.files?.[0] || null)
                setKpiResult(null)
              }}
            />
            <p className="text-sm text-muted-foreground">
              Expected format: Excel file with columns: name, value, period, unit
            </p>
          </div>
          
          <Button 
            onClick={importKPIs} 
            disabled={kpiLoading || !kpiFile}
            className="flex items-center gap-2"
          >
            {kpiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import KPIs
          </Button>
          
          <ResultAlert result={kpiResult} />
        </CardContent>
      </Card>
    </div>
  )
}