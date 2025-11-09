import React from 'react';
import { Link } from 'react-router-dom';

// Hero Component
const Hero: React.FC = () => {
    const handleGetStarted = () => {
        const uploadSection = document.getElementById('features-section');
        if (uploadSection) {
            uploadSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 pt-20 pb-12 md:pt-24 md:pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-8 md:mb-12">
                    <div className="inline-block bg-cyan-400/20 text-cyan-300 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6 border border-cyan-400/30">
                        AI-Powered Document Extraction
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                        Extract Data from Documents
                        <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
                            Automatically
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-purple-200 max-w-3xl mx-auto mb-6 md:mb-10 px-2">
                        Process CIN, driving licenses, and vehicle registration cards with AI.
                        Fast, accurate, and secure extraction in seconds.
                    </p>

                    <button
                        onClick={handleGetStarted}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-cyan-500/50 hover:scale-105"
                    >
                        Start Extracting Documents
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16">
                    <div className="bg-white/10 backdrop-blur-sm p-5 md:p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-cyan-500/50">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Fast Processing</h3>
                        <p className="text-sm md:text-base text-purple-200">Extract data in under 2 seconds with our optimized AI engine</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm p-5 md:p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-pink-500/50">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">99% Accuracy</h3>
                        <p className="text-sm md:text-base text-purple-200">High precision extraction with validation and error detection</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm p-5 md:p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all sm:col-span-2 md:col-span-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-purple-500/50">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Secure & Private</h3>
                        <p className="text-sm md:text-base text-purple-200">Your documents are encrypted and processed securely</p>
                    </div>
                </div>

                <div className="mt-12 md:mt-16 text-center">
                    <p className="text-xs md:text-sm text-purple-300 mb-3 md:mb-4 tracking-wider">SUPPORTED DOCUMENTS</p>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                        <span className="bg-white/10 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/15 transition-all text-sm md:text-base">
                            🪪 CIN (ID Card)
                        </span>
                        <span className="bg-white/10 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/15 transition-all text-sm md:text-base">
                            🚗 Driving License
                        </span>
                        <span className="bg-white/10 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/15 transition-all text-sm md:text-base">
                            📄 Vehicle Registration
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Features Section
const FeaturesSection: React.FC = () => {
    const features = [
        {
            icon: (
                <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            gradient: 'from-cyan-400 to-cyan-600',
            shadowColor: 'shadow-cyan-500/50',
            title: 'CIN Extraction',
            description: 'Extract information from Moroccan National ID cards quickly and accurately with advanced OCR technology.',
        },
        {
            icon: (
                <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
            ),
            gradient: 'from-purple-400 to-purple-600',
            shadowColor: 'shadow-purple-500/50',
            title: 'Driving License Processing',
            description: 'Automatically process and extract data from driving licenses with high precision and validation.',
        },
        {
            icon: (
                <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            gradient: 'from-pink-400 to-pink-600',
            shadowColor: 'shadow-pink-500/50',
            title: 'Vehicle Registration',
            description: 'Extract details from vehicle registration cards (Carte Grise) efficiently with AI-powered recognition.',
        },
    ];

    return (
        <section id="features-section" className="py-12 md:py-20 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10 md:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 md:mb-4">
                        Our Features
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                        Streamline your document processing with our advanced AI-powered solutions
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-200"
                        >
                            <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg ${feature.shadowColor} group-hover:scale-110 transition-transform`}>
                                <div className="text-white">
                                    {feature.icon}
                                </div>
                            </div>

                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3">
                                {feature.title}
                            </h3>

                            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-12 md:mt-16 text-center">
                    <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-pink-900 rounded-2xl md:rounded-3xl p-8 md:p-12">
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">
                            Ready to Get Started?
                        </h3>
                        <p className="text-purple-200 text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto px-2">
                            Join thousands of businesses streamlining their document processing workflow
                        </p>
                        <Link 
                            to="/register"
                            className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-3 md:px-10 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-cyan-500/50 hover:scale-105"
                        >
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Main HomePage Component
const HomePage: React.FC = () => {
    return (
        <div>
            <Hero />
            <FeaturesSection />
        </div>
    );
};

export default HomePage;