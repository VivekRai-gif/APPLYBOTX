import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { filesAPI } from '../services/api'
import { 
  UploadIcon, 
  FileTextIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  TrashIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from 'react-query'

const Upload = () => {
  const [uploadProgress, setUploadProgress] = useState({})
  const queryClient = useQueryClient()

  // Fetch files list
  const { data: files, isLoading } = useQuery('files', filesAPI.list)

  // Upload mutation
  const uploadMutation = useMutation(filesAPI.upload, {
    onSuccess: (data) => {
      toast.success('File uploaded successfully!')
      queryClient.invalidateQueries('files')
      // Auto-trigger parsing
      parseMutation.mutate(data.data.id)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Upload failed')
    }
  })

  // Parse mutation
  const parseMutation = useMutation(filesAPI.parse, {
    onSuccess: () => {
      toast.success('File parsing started!')
      queryClient.invalidateQueries('files')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Parsing failed')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation(filesAPI.delete, {
    onSuccess: () => {
      toast.success('File deleted successfully!')
      queryClient.invalidateQueries('files')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Delete failed')
    }
  })

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: File type not supported. Please upload PDF, DOCX, or TXT files.`)
        return
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large. Maximum size is 10MB.`)
        return
      }

      uploadMutation.mutate(file)
    })
  }, [uploadMutation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: true
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'uploaded':
        return 'Ready to parse'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  const handleViewExtracted = async (fileId) => {
    try {
      const response = await filesAPI.getExtracted(fileId)
      // For now, just show as JSON - in a real app, this would be a modal or new page
      console.log('Extracted data:', response.data)
      toast.success('Check console for extracted data (demo)')
    } catch (error) {
      toast.error('Failed to fetch extracted data')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Files</h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload your resume, portfolio, or other documents to extract key information.
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div
            {...getRootProps()}
            className={`dropzone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg text-primary-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Drag and drop files here, or <span className="text-primary-600 font-medium">browse</span>
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOCX, and TXT files up to 10MB
                </p>
              </div>
            )}
          </div>

          {uploadMutation.isLoading && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-sm text-blue-800">Uploading file...</span>
              </div>
            </div>
          )}
        </div>

        {/* Files List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Files
            </h3>

            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading files...</p>
              </div>
            ) : files?.data.length > 0 ? (
              <div className="space-y-4">
                {files.data.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center flex-1">
                      <FileTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {file.filename}
                        </h4>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <span className="mx-2 text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(file.created_at).toLocaleDateString()}
                          </span>
                          <span className="mx-2 text-xs text-gray-300">•</span>
                          <div className="flex items-center">
                            {getStatusIcon(file.status)}
                            <span className="ml-1 text-xs text-gray-600">
                              {getStatusText(file.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {file.status === 'uploaded' && (
                        <button
                          onClick={() => parseMutation.mutate(file.id)}
                          disabled={parseMutation.isLoading}
                          className="px-3 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-md hover:bg-primary-200 disabled:opacity-50"
                        >
                          Parse
                        </button>
                      )}
                      
                      {file.status === 'completed' && (
                        <button
                          onClick={() => handleViewExtracted(file.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="View extracted data"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteMutation.mutate(file.id)}
                        disabled={deleteMutation.isLoading}
                        className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                        title="Delete file"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by uploading your first document.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Tips for Better Results</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Use well-formatted resumes with clear sections (Experience, Skills, Education)</li>
            <li>• Ensure your contact information is clearly visible</li>
            <li>• PDF files generally provide the best parsing results</li>
            <li>• Avoid scanned documents or image-based PDFs when possible</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Upload