import React from 'react';
import { Users, ThumbsUp, Calendar, Phone, Mail, Facebook, Twitter, Menu } from 'lucide-react';

const AutentaLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                <span className="text-orange-500">△</span>
                <span className="text-gray-900">Autenta</span>
              </div>
            </div>

            {/* Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex space-x-8">
              <a href="#" className="text-orange-500 font-medium border-b-2 border-orange-500 pb-1">HOME</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 font-medium">ABOUT</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 font-medium">SERVICES</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 font-medium">TEAM</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 font-medium">TESTIMONIALS</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 font-medium">CONTACT</a>
            </nav>

            {/* Contact Info and CTA */}
            <div className="flex items-center space-x-6">
              <div className="hidden xl:flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600">888 888 8888</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600">office@autenta.com</span>
                </div>
                <div className="flex space-x-2">
                  <Facebook className="w-4 h-4 text-gray-400 hover:text-orange-500 cursor-pointer" />
                  <Twitter className="w-4 h-4 text-gray-400 hover:text-orange-500 cursor-pointer" />
                </div>
              </div>
              <button className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors font-medium text-sm">
                GET A QUOTE
              </button>
              <Menu className="lg:hidden w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 text-white overflow-hidden min-h-[80vh]">
        {/* Background Tech Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 border border-white/20">
            <div className="absolute inset-4 border border-white/10"></div>
            <div className="absolute inset-8 border border-white/10"></div>
          </div>
          <div className="absolute top-1/3 right-1/3 w-32 h-32 border border-white/20 transform rotate-45"></div>
          <div className="absolute bottom-1/4 right-1/6 w-48 h-48 border border-white/10 transform -rotate-12"></div>
          
          {/* Circuit-like lines */}
          <div className="absolute top-1/2 right-1/4 w-32 h-px bg-white/20"></div>
          <div className="absolute top-1/2 right-1/4 w-px h-32 bg-white/20"></div>
          <div className="absolute bottom-1/3 right-1/3 w-24 h-px bg-white/20"></div>
        </div>

        {/* Person silhouette */}
        <div className="absolute right-0 bottom-0 w-1/3 h-full opacity-20">
          <div className="absolute bottom-0 right-12 w-64 h-96 bg-gradient-to-t from-white/30 to-transparent rounded-t-full"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                AI Consulting
                <br />
                <span className="text-orange-500">Services</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-300 max-w-2xl leading-relaxed">
                Our expert AI consultants work closely with you to understand your unique challenges and objectives.
              </p>
              <button className="bg-orange-500 text-white px-10 py-4 rounded-md hover:bg-orange-600 transition-colors font-bold text-lg">
                GET A QUOTE
              </button>
            </div>

            {/* Right Content - AI Dashboard */}
            <div className="relative">
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
                <div className="space-y-6">
                  {/* Header with AI icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">AI</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">Artificial Intelligence</h3>
                        <p className="text-gray-300 text-sm">Advanced Analytics</p>
                      </div>
                    </div>
                    <div className="text-green-400 text-2xl">●</div>
                  </div>
                  
                  {/* Progress Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Machine Learning</span>
                        <span className="text-white">85%</span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Data Analysis</span>
                        <span className="text-white">92%</span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Automation</span>
                        <span className="text-white">78%</span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Small chart visualization */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-end space-x-2 h-16">
                      <div className="bg-orange-500 w-3 h-8 rounded-sm"></div>
                      <div className="bg-blue-500 w-3 h-12 rounded-sm"></div>
                      <div className="bg-green-500 w-3 h-6 rounded-sm"></div>
                      <div className="bg-purple-500 w-3 h-10 rounded-sm"></div>
                      <div className="bg-yellow-500 w-3 h-14 rounded-sm"></div>
                      <div className="bg-pink-500 w-3 h-4 rounded-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section - Curved overlay */}
        <div className="relative -mt-20">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 transform skew-y-1 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transform -skew-y-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Users className="w-16 h-16 text-orange-500" />
                  </div>
                  <div className="text-5xl font-bold text-white">200+</div>
                  <div className="text-gray-300 text-lg">Satisfied Customers</div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <ThumbsUp className="w-16 h-16 text-orange-500" />
                  </div>
                  <div className="text-5xl font-bold text-white">100%</div>
                  <div className="text-gray-300 text-lg">Quality Service</div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Calendar className="w-16 h-16 text-orange-500" />
                  </div>
                  <div className="text-5xl font-bold text-white">1K+</div>
                  <div className="text-gray-300 text-lg">Projects Done</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - Image */}
            <div className="relative order-2 lg:order-1">
              {/* TikTok watermark */}
              <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/70 rounded-full px-3 py-1">
                <div className="w-5 h-5 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">♪</span>
                  </div>
                </div>
                <span className="text-white text-sm font-medium">TikTok</span>
              </div>
              <div className="absolute bottom-4 left-4 z-10 text-white text-sm font-medium bg-black/30 px-2 py-1 rounded">
                olla.designs.co
              </div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-orange-50">
                  {/* Professional team image placeholder */}
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-orange-100 flex items-center justify-center relative">
                    {/* Simulated team photo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200/50 to-orange-200/50"></div>
                    <div className="relative z-10 flex items-center space-x-8">
                      {/* Female professional */}
                      <div className="w-32 h-40 bg-gradient-to-b from-amber-200 to-orange-300 rounded-t-full relative">
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-amber-100 rounded-full"></div>
                        <div className="absolute bottom-12 inset-x-4 bg-blue-600 rounded-sm h-8"></div>
                      </div>
                      {/* Male professional */}
                      <div className="w-32 h-40 bg-gradient-to-b from-amber-100 to-orange-200 rounded-t-full relative">
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-amber-50 rounded-full"></div>
                        <div className="absolute bottom-12 inset-x-4 bg-gray-600 rounded-sm h-8"></div>
                        {/* Glasses effect */}
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                    {/* Laptop */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-24 h-16 bg-gray-800 rounded-sm">
                      <div className="absolute inset-2 bg-blue-100 rounded-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="space-y-8 order-1 lg:order-2">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  About Us
                </h2>
                <div className="w-16 h-1 bg-orange-500 mb-8"></div>
              </div>
              
              <p className="text-gray-600 text-lg lg:text-xl leading-relaxed">
                Credibly innovate granular internal or organic sources whereas high standards in web-readiness. Energistically scale future-proof core competencies vis-a-vis impactful experiences.
              </p>
              
              <button className="bg-orange-500 text-white px-10 py-4 rounded-md hover:bg-orange-600 transition-colors font-bold text-lg">
                GET A QUOTE
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AutentaLandingPage;