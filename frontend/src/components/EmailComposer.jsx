import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { PaperClipIcon, SparklesIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

const EmailComposer = () => {
  const [files, setFiles] = useState([])
  const [jobDetails, setJobDetails] = useState({
    position: '',
    company: '',
    description: '',
    requirements: ''
  })
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    content: ''
  })
  const [step, setStep] = useState('upload') // upload, details, generate, review
  const [extractedData, setExtractedData] = useState(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles)
      uploadFiles(acceptedFiles)
    }
  })

  const uploadFiles = async (filesToUpload) => {
    try {
      const formData = new FormData()
      filesToUpload.forEach(file => {
        formData.append('files', file)
      })

      const response = await api.uploadFiles(formData)
      if (response.data && response.data.length > 0) {
        setExtractedData(response.data[0])
        setStep('details')
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload files. Please try again.')
    }
  }

  const generateEmail = async () => {
    setIsGenerating(true)
    try {
      const response = await api.generateEmail({
        job_position: jobDetails.position,
        job_company: jobDetails.company,
        job_description: jobDetails.description,
        job_requirements: jobDetails.requirements,
        extracted_data: extractedData
      })

      setGeneratedEmail(response.data.generated_email)
      setEmailData({
        to: '',
        subject: `Application for ${jobDetails.position} at ${jobDetails.company}`,
        content: response.data.generated_email
      })
      setStep('review')
    } catch (error) {
      console.error('Email generation error:', error)
      alert('Failed to generate email. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const sendEmail = async () => {
    setIsSending(true)
    try {
      await api.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.content
      })
      alert('Email sent successfully!')
      // Reset form
      setFiles([])
      setJobDetails({ position: '', company: '', description: '', requirements: '' })
      setGeneratedEmail('')
      setEmailData({ to: '', subject: '', content: '' })
      setExtractedData(null)
      setStep('upload')
    } catch (error) {
      console.error('Email sending error:', error)
      alert('Failed to send email. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Composer</h1>
          <p className="mt-2 text-gray-600">
            Generate personalized job application emails using AI
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {['upload', 'details', 'generate', 'review'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-blue-600 text-white' : 
                  ['upload', 'details', 'generate', 'review'].indexOf(step) > index ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900 capitalize">{stepName}</span>
                {index < 3 && (
                  <div className={`ml-4 w-16 h-0.5 ${
                    ['upload', 'details', 'generate', 'review'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: File Upload */}
        {step === 'upload' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Your Files</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive ? 'Drop your files here...' : 'Drag & drop your resume, portfolio, or job description here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports PDF, DOCX, and TXT files</p>
            </div>

            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">Uploaded Files:</h3>
                <ul className="mt-2 space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Job Details */}
        {step === 'details' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job Details</h2>
            
            {extractedData && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-2">Extracted Information:</h3>
                <div className="text-sm text-green-700">
                  <p><strong>Name:</strong> {extractedData.name || 'Not found'}</p>
                  <p><strong>Email:</strong> {extractedData.email || 'Not found'}</p>
                  <p><strong>Phone:</strong> {extractedData.phone || 'Not found'}</p>
                  <p><strong>Skills:</strong> {extractedData.skills?.join(', ') || 'None identified'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  value={jobDetails.position}
                  onChange={(e) => setJobDetails({...jobDetails, position: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  value={jobDetails.company}
                  onChange={(e) => setJobDetails({...jobDetails, company: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tech Corp"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Job Description</label>
              <textarea
                value={jobDetails.description}
                onChange={(e) => setJobDetails({...jobDetails, description: e.target.value})}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste the job description here..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Key Requirements (Optional)</label>
              <textarea
                value={jobDetails.requirements}
                onChange={(e) => setJobDetails({...jobDetails, requirements: e.target.value})}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Specific requirements to address in the email..."
              />
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep('generate')}
                disabled={!jobDetails.position || !jobDetails.company}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generate Email */}
        {step === 'generate' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Email</h2>
            
            <div className="text-center py-8">
              <SparklesIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h3>
              <p className="text-gray-600 mb-6">
                AI will create a personalized email for your application to {jobDetails.company}
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setStep('details')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={generateEmail}
                  disabled={isGenerating}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review and Send */}
        {step === 'review' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Review & Send</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">To</label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="hiring@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Content</label>
                <textarea
                  value={emailData.content}
                  onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                  rows={12}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep('generate')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={generateEmail}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Regenerate
                </button>
                <button
                  onClick={sendEmail}
                  disabled={isSending || !emailData.to || !emailData.subject || !emailData.content}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 flex items-center"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailComposer