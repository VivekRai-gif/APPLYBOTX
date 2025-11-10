import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

const Templates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'general'
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await api.getTemplates()
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await api.createTemplate(newTemplate)
      setTemplates([...templates, response.data])
      setNewTemplate({ name: '', subject: '', content: '', category: 'general' })
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template')
    }
  }

  const handleUpdateTemplate = async () => {
    try {
      const response = await api.updateTemplate(editingTemplate.id, editingTemplate)
      setTemplates(templates.map(t => t.id === editingTemplate.id ? response.data : t))
      setEditingTemplate(null)
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Failed to update template')
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    try {
      await api.deleteTemplate(templateId)
      setTemplates(templates.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const builtInTemplates = [
    {
      id: 'software-engineer',
      name: 'Software Engineer Application',
      category: 'tech',
      subject: 'Application for Software Engineer Position',
      content: `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at {company_name}. With my background in {skills} and passion for creating innovative solutions, I believe I would be a valuable addition to your development team.

In my previous experience, I have:
• Developed scalable applications using modern technologies
• Collaborated effectively in agile development environments  
• Contributed to open-source projects and continuous learning

I am particularly excited about {company_name}'s mission and would welcome the opportunity to discuss how my skills in {relevant_skills} can contribute to your team's success.

Please find my resume attached for your review. I look forward to hearing from you.

Best regards,
{candidate_name}`
    },
    {
      id: 'marketing-specialist',
      name: 'Marketing Specialist Application',
      category: 'marketing',
      subject: 'Application for Marketing Specialist Position',
      content: `Dear Hiring Team,

I am excited to apply for the Marketing Specialist position at {company_name}. With expertise in {skills} and a proven track record of driving successful marketing campaigns, I am confident in my ability to contribute to your marketing objectives.

My experience includes:
• Developing and executing comprehensive marketing strategies
• Managing social media campaigns with measurable ROI
• Analyzing market trends and consumer behavior

I am particularly drawn to {company_name}'s innovative approach to marketing and would be thrilled to bring my creative problem-solving skills to your team.

Thank you for considering my application. I look forward to the opportunity to discuss how I can help {company_name} achieve its marketing goals.

Sincerely,
{candidate_name}`
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="mt-2 text-gray-600">
              Browse and customize email templates for different job types
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Template
          </button>
        </div>

        {/* Built-in Templates */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Built-in Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builtInTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {template.category}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Subject:</p>
                  <p className="text-sm font-medium">{template.subject}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {template.content.substring(0, 150)}...
                  </p>
                </div>

                <button
                  onClick={() => {
                    setNewTemplate({
                      name: `Copy of ${template.name}`,
                      subject: template.subject,
                      content: template.content,
                      category: template.category
                    })
                    setIsCreating(true)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Templates */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Templates</h2>
          {templates.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No custom templates yet.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {template.category}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Subject:</p>
                    <p className="text-sm font-medium">{template.subject}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <p className="text-sm text-gray-700">
                      {template.content.substring(0, 150)}...
                    </p>
                  </div>

                  <button className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Template Modal */}
        {(isCreating || editingTemplate) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isCreating ? 'Create New Template' : 'Edit Template'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input
                      type="text"
                      value={isCreating ? newTemplate.name : editingTemplate.name}
                      onChange={(e) => isCreating 
                        ? setNewTemplate({...newTemplate, name: e.target.value})
                        : setEditingTemplate({...editingTemplate, name: e.target.value})
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter template name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={isCreating ? newTemplate.category : editingTemplate.category}
                      onChange={(e) => isCreating 
                        ? setNewTemplate({...newTemplate, category: e.target.value})
                        : setEditingTemplate({...editingTemplate, category: e.target.value})
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="general">General</option>
                      <option value="tech">Technology</option>
                      <option value="marketing">Marketing</option>
                      <option value="sales">Sales</option>
                      <option value="finance">Finance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      value={isCreating ? newTemplate.subject : editingTemplate.subject}
                      onChange={(e) => isCreating 
                        ? setNewTemplate({...newTemplate, subject: e.target.value})
                        : setEditingTemplate({...editingTemplate, subject: e.target.value})
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Email subject line"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                      value={isCreating ? newTemplate.content : editingTemplate.content}
                      onChange={(e) => isCreating 
                        ? setNewTemplate({...newTemplate, content: e.target.value})
                        : setEditingTemplate({...editingTemplate, content: e.target.value})
                      }
                      rows={12}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                      placeholder="Email content with placeholders like {company_name}, {candidate_name}, {skills}..."
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Use placeholders: {'{company_name}'}, {'{candidate_name}'}, {'{skills}'}, {'{position}'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setEditingTemplate(null)
                      setNewTemplate({ name: '', subject: '', content: '', category: 'general' })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isCreating ? handleCreateTemplate : handleUpdateTemplate}
                    disabled={
                      isCreating 
                        ? !newTemplate.name || !newTemplate.subject || !newTemplate.content
                        : !editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.content
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {isCreating ? 'Create Template' : 'Update Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Templates