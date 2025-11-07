import { motion } from 'framer-motion';
import { CheckCircle2, User, Building2, Globe, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import type { UserInfo, LLMResponse } from '../../types/cardScanner';
 
interface ResultScreenProps {
  userInfo: UserInfo;
  llmResponse: LLMResponse | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  onScheduleMeeting: () => void;
  onScanAnother: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}
 
export function ResultScreen({
  userInfo,
  llmResponse,
  onScheduleMeeting: _onScheduleMeeting, // Renamed to indicate it's intentionally unused
  onPrevious,
  onNext
}: ResultScreenProps) {
 
 
  // Get structured data from API response or userInfo
  const structuredData = llmResponse?.extracted_data || {};
  const name = userInfo.name || structuredData.name || 'N/A';
  const title = structuredData.title || 'N/A';
  const email = userInfo.email || structuredData.email || 'N/A';
  const phone = userInfo.phone || structuredData.phone || 'N/A';
  const company = userInfo.company || structuredData.company || 'N/A';
  const website = structuredData.website || '';
  const address = structuredData.address || '';
 
  // Company insights - extracted from API response
  const companyInsights = {
    company_description: structuredData.company_description || null,
    products: structuredData.products || null,
    location: structuredData.location || address || null,
    industry: structuredData.industry || null,
    num_of_employees: structuredData.num_of_employees || null,
    revenue: structuredData.revenue || null,
    market_share: structuredData.market_share || null,
    investors: structuredData.investors || null,
    summarised_llm_company_response: structuredData.summarised_llm_company_response || null,
    other_info_of_company: structuredData.other_info_of_company || null,
    website: website,
  };
 
  // Confidence score from API or default to 85%
  const confidence = (llmResponse as any)?.confidence_score || structuredData.confidence || 0.85;
  const confidencePercent = Math.round(confidence * 100);
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-20 pb-6 px-4 sm:px-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onPrevious}
            disabled={!onPrevious}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              onPrevious
                ? 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-300 hover:border-green-300 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Previous Step"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>
 
          <button
            onClick={onNext}
            disabled={!onNext}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              onNext
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Next Step"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
 
        {/* Profile Complete Section - Made Smaller */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-0.5">
                    Profile Complete!
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Card scanned & company data enriched
                  </p>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    ✨ Ready for next step: Selfie capture
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
 
        {/* Personal Information and Company Insights Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
                </div>
               
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Name:</p>
                      <p className="text-base font-medium text-gray-800">{name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Title:</p>
                      <p className="text-base font-medium text-gray-800">{title}</p>
                    </div>
                  </div>
                 
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email:</p>
                      <p className="text-base font-medium text-gray-800 break-all">{email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone:</p>
                      <p className="text-base font-medium text-gray-800">{phone}</p>
                    </div>
                  </div>
                 
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Company:</p>
                    <p className="text-base font-medium text-gray-800">{company}</p>
                  </div>
                 
                  {address && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Address:</p>
                      <p className="text-base font-medium text-gray-800">{address}</p>
                    </div>
                  )}
                 
                  {/* Summary Section */}
                  {companyInsights.summarised_llm_company_response && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Summary:</p>
                      <p className="text-base font-medium text-gray-800 whitespace-pre-wrap">{companyInsights.summarised_llm_company_response}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
 
          {/* Company Insights Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Company Insights</h3>
                </div>
               
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {/* Basic Company Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Company:</p>
                      <p className="text-base font-medium text-gray-800">{company}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Industry:</p>
                      <p className="text-base font-medium text-gray-800">
                        {companyInsights.industry || <span className="text-gray-400 italic">Enriching...</span>}
                      </p>
                    </div>
                  </div>
                 
                  {companyInsights.website && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Website:</p>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <a
                          href={companyInsights.website.startsWith('http') ? companyInsights.website : `https://${companyInsights.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-gray-800 hover:text-green-600 flex items-center gap-1"
                        >
                          {companyInsights.website}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
 
                  {/* Company Stats - Always show section */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Employees:</p>
                      <p className="text-base font-medium text-gray-800">
                        {companyInsights.num_of_employees || <span className="text-gray-400 italic">Enriching...</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Revenue:</p>
                      <p className="text-base font-medium text-gray-800">
                        {companyInsights.revenue || <span className="text-gray-400 italic">Enriching...</span>}
                      </p>
                    </div>
                    {companyInsights.market_share && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Market Share:</p>
                        <p className="text-base font-medium text-gray-800">{companyInsights.market_share}</p>
                      </div>
                    )}
                  </div>
                 
                  {/* Products - Always show */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Products:</p>
                    {companyInsights.products ? (
                      <p className="text-base font-medium text-gray-800 whitespace-pre-wrap">{companyInsights.products}</p>
                    ) : (
                      <p className="text-base font-medium text-gray-400 italic">Enriching...</p>
                    )}
                  </div>
                 
                  {/* Investors - Always show */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Investors:</p>
                    {companyInsights.investors ? (
                      <p className="text-base font-medium text-gray-800 whitespace-pre-wrap">{companyInsights.investors}</p>
                    ) : (
                      <p className="text-base font-medium text-gray-400 italic">Enriching...</p>
                    )}
                  </div>
                 
                  {/* Company Description - Always show */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Description:</p>
                    {companyInsights.company_description ? (
                      <p className="text-base font-medium text-gray-800 whitespace-pre-wrap">{companyInsights.company_description}</p>
                    ) : (
                      <p className="text-base font-medium text-gray-400 italic">Enriching...</p>
                    )}
                  </div>
                 
                  {/* Summarised LLM Response - Always show */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Summary:</p>
                    {companyInsights.summarised_llm_company_response ? (
                      <p className="text-base font-medium text-gray-800 whitespace-pre-wrap">{companyInsights.summarised_llm_company_response}</p>
                    ) : (
                      <p className="text-base font-medium text-gray-400 italic">Enriching...</p>
                    )}
                  </div>
                 
                  {/* Other Info - Always show */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Other Information:</p>
                    {companyInsights.other_info_of_company ? (
                      <p className="text-base font-medium text-gray-800 whitespace-pre-wrap">{companyInsights.other_info_of_company}</p>
                    ) : (
                      <p className="text-base font-medium text-gray-400 italic">Enriching...</p>
                    )}
                  </div>
                 
                  {/* Data Confidence */}
                  <div className="pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Data Confidence</p>
                      <p className="text-sm font-semibold text-orange-600">{confidencePercent}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
 