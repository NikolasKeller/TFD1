"use client"

import { useState } from "react"
import * as pdfjsLib from 'pdfjs-dist'

// Worker-Konfiguration
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export default function DebugPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [requirements, setRequirements] = useState('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [showFinalQuote, setShowFinalQuote] = useState(false);
  const [quoteDate] = useState(new Date().toLocaleDateString('en-US'));
  const [quoteNumber] = useState(`QUO-${Math.floor(Math.random() * 10000)}-${new Date().getFullYear()}`);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setActiveStep(2); // Automatically move to next step
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setActiveStep(2); // Automatically move to next step
      } else {
        setError('Please upload PDF files only');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const processRequirements = async () => {
    if (!file || !requirements) {
      setError('Please select a file and enter search terms');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('requirements', requirements);
      
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Unknown error during processing');
      }
      
      setResult(data.technical_details || 'No technical details found');
      
      // Delay for loading screen
      setTimeout(() => {
        setIsLoading(false);
        setShowFinalQuote(true);
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error during processing');
      setResult('');
      setIsLoading(false);
    }
  };

  // Render loading screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="w-24 h-24 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Generating Quote</h2>
        <p className="text-gray-600">Please wait a moment...</p>
      </div>
    );
  }

  // Render the final quote page
  if (showFinalQuote) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Quote header */}
          <div className="bg-blue-600 text-white p-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Final Quote</h1>
                <p className="text-blue-100 mt-1">Based on your requirements</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold">{quoteNumber}</p>
                <p className="text-blue-100">Date: {quoteDate}</p>
              </div>
            </div>
          </div>
          
          {/* Company information */}
          <div className="p-8 border-b">
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Provider</h2>
                <p className="text-gray-600">TechSolutions Inc.</p>
                <p className="text-gray-600">45 Industry Street</p>
                <p className="text-gray-600">New York, NY 10001</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold text-gray-700">Customer</h2>
                <p className="text-gray-600">Sample Company Ltd.</p>
                <p className="text-gray-600">123 Main Street</p>
                <p className="text-gray-600">San Francisco, CA 94105</p>
              </div>
            </div>
          </div>
          
          {/* Quote description */}
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Technical Specifications</h2>
            <div 
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: result
                  .replace(/\n/g, '<br>')
                  .replace(/## (.*?)\n/g, '<div class="mt-8 mb-4"><h3 class="text-xl font-bold text-blue-700 pb-2 border-b border-gray-200">$1</h3></div>')
                  .replace(/Keine Treffer für: "(.*?)"/g, '<div class="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800 my-4">No matches for: "$1"</div>')
              }}
            />
          </div>
          
          {/* Quote footer */}
          <div className="bg-gray-50 p-8 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">Quote valid until: {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US')}</p>
                <p className="text-gray-600">Please contact us if you have any questions.</p>
              </div>
              <button 
                onClick={() => {
                  setShowFinalQuote(false);
                  setFile(null);
                  setRequirements('');
                  setResult('');
                  setActiveStep(1);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                New Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the main application
  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent">
          Technical Specifications Extractor
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Upload a PDF document and enter search terms to extract relevant technical information.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center justify-center">
          <div className={`flex items-center ${activeStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${activeStep >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Upload PDF</span>
          </div>
          <div className={`w-16 h-1 mx-4 ${activeStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${activeStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${activeStep >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Enter Search Terms</span>
          </div>
          <div className={`w-16 h-1 mx-4 ${showFinalQuote ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${showFinalQuote ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${showFinalQuote ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Final Quote</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className={`${activeStep !== 1 && 'hidden'}`}>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 shadow-sm"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="bg-blue-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload PDF File</h3>
            <p className="text-gray-600 mb-4">
              Drag a file here or click to select
            </p>
            <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
              Select File
            </span>
            <input 
              id="file-upload" 
              name="file-upload" 
              type="file" 
              className="hidden" 
              accept=".pdf"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className={`${activeStep !== 2 && 'hidden'}`}>
          {file && (
            <div className="mb-6 bg-blue-50 p-5 rounded-xl flex items-center border border-blue-200 shadow-sm">
              <div className="bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center mr-4">
                <svg className="text-blue-600 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Selected File:</p>
                <p className="text-gray-600">{file.name} ({Math.round(file.size / 1024)} KB)</p>
              </div>
              <button 
                className="ml-auto text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {
                  setFile(null);
                  setActiveStep(1);
                }}
              >
                Change
              </button>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Enter Search Terms</h2>
            <p className="text-gray-600 mb-6">
              Enter the terms you want to search for in the document. One term per line.
            </p>
            
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="e.g. /Heat recovery&#10;/Drive module&#10;/Energy efficiency"
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700 bg-gray-50"
              rows={6}
            />
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setActiveStep(1)}
                className="mr-4 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Back
              </button>
              <button 
                onClick={processRequirements}
                disabled={!requirements.trim() || isLoading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  !requirements.trim() || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Generate Quote'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-5 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="bg-red-100 rounded-full h-10 w-10 flex items-center justify-center mr-3">
              <svg className="text-red-600 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="font-bold text-red-800 text-lg">Error</p>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}