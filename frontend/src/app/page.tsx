'use client'

import { useState } from 'react'
import { Upload, Scale, CheckCircle, AlertTriangle, FileText, Zap, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

import { useDropzone } from 'react-dropzone'

interface ContractAnalysis {
  risk_score: number
  overall_summary: string
  key_terms: {
    payment_terms: string
    termination_clause: string
    liability_limitations: string
    intellectual_property: string
  }
  risks: Array<{
    category: string
    severity: number
    description: string
    recommendation: string
  }>
  missing_clauses: string[]
  recommendations: string[]
  red_flags: string[]
}

interface AnalysisResult {
  contract_id: string
  filename: string
  status: string
  analysis: ContractAnalysis
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-gateway-url'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
        setError(null)
      }
    }
  })

  const uploadAndAnalyze = async () => {
    if (!file) return

    setIsUploading(true)
    setIsAnalyzing(false)
    setProgress(10)
    setError(null)

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file)
      
      setProgress(30)

      // Upload file
      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          file_data: base64.split(',')[1], // Remove data URL prefix
          content_type: file.type
        })
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadResult = await uploadResponse.json()
      setProgress(50)
      setIsUploading(false)
      setIsAnalyzing(true)

      // Start analysis
      const analysisResponse = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_id: uploadResult.contract_id
        })
      })

      setProgress(90)

      if (!analysisResponse.ok) {
        throw new Error('Analysis failed')
      }

      const analysisResult = await analysisResponse.json()
      setResult({
        ...analysisResult,
        filename: file.name
      })
      setProgress(100)

    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'bg-green-500'
    if (score <= 6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRiskBadgeVariant = (score: number) => {
    if (score <= 3) return 'default'
    if (score <= 6) return 'secondary'
    return 'destructive'
  }

  const resetAnalysis = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
    setIsUploading(false)
    setIsAnalyzing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Lex</h1>
                <p className="text-xs text-muted-foreground">AI Contract Reviewer</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>Powered by AWS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!result ? (
          <div className="max-w-2xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Review contracts with AI precision
              </h2>
              <p className="text-lg text-muted-foreground">
                Upload your contract and get instant risk analysis, key insights, and actionable recommendations.
              </p>
            </div>

            {/* Upload Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Upload Contract</span>
                </CardTitle>
                <CardDescription>
                  Support for PDF and DOCX files up to 10MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...(!file ? getRootProps() : {})}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${file ? 'border-muted-foreground/25' : 
                      isDragActive ? 'border-primary bg-primary/5 cursor-pointer' : 
                      'border-muted-foreground/25 hover:border-primary/50 cursor-pointer'}
                  `}
                >
                  {!file && <input {...getInputProps()} />}
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {file ? (
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex gap-2 justify-center mt-4">
                        <Button 
                          onClick={uploadAndAnalyze}
                          disabled={isUploading || isAnalyzing}
                        >
                          {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setFile(null)}
                          disabled={isUploading || isAnalyzing}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-base mb-2">
                        {isDragActive ? 'Drop your contract here' : 'Drag & drop your contract here'}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                      <Button variant="outline">
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>

                {(isUploading || isAnalyzing) && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {isUploading ? 'Uploading...' : 'Analyzing with AI...'}
                      </span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Risk Assessment</h3>
                      <p className="text-sm text-muted-foreground">Identify potential legal risks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Smart Analysis</h3>
                      <p className="text-sm text-muted-foreground">AI-powered contract review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Instant Results</h3>
                      <p className="text-sm text-muted-foreground">Get insights in seconds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
                <p className="text-muted-foreground">{result.filename}</p>
              </div>
              <Button variant="outline" onClick={resetAnalysis}>
                Analyze Another Contract
              </Button>
            </div>

            <div className="grid gap-6">
              {/* Risk Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Overall Risk Score</span>
                    <Badge variant={getRiskBadgeVariant(result.analysis.risk_score)} className="text-lg px-3 py-1">
                      {result.analysis.risk_score}/10
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Risk Level</span>
                      <span className="font-medium">
                        {result.analysis.risk_score <= 3 ? 'Low' : 
                         result.analysis.risk_score <= 6 ? 'Medium' : 'High'}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${getRiskColor(result.analysis.risk_score)}`}
                        style={{ width: `${(result.analysis.risk_score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{result.analysis.overall_summary}</p>
                </CardContent>
              </Card>

              {/* Key Terms & Risks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(result.analysis.key_terms).map(([key, value]) => (
                      <div key={key}>
                        <h4 className="font-medium capitalize mb-1">
                          {key.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-muted-foreground">{value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.analysis.risks.map((risk, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">{risk.category}</h4>
                          <Badge variant={getRiskBadgeVariant(risk.severity)}>
                            {risk.severity}/10
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                        <p className="text-xs text-primary">{risk.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations and Red Flags */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span>Red Flags</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.analysis.red_flags.map((flag, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Missing Clauses */}
              {result.analysis.missing_clauses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Missing Clauses</CardTitle>
                    <CardDescription>
                      Important clauses that may be missing from this contract
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.analysis.missing_clauses.map((clause, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{clause}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
