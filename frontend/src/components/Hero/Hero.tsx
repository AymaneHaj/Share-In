import React from 'react';

const Hero: React.FC = () => {
    const handleGetStarted = () => {
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
            uploadSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 pt-24 pb-16">
            <div className="max-w-6xl mx-auto px-6">
                {/* Main Content */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-cyan-400/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-cyan-400/30">
                        AI-Powered Document Extraction
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                        Extract Data from Documents
                        <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
                            Automatically
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-purple-200 max-w-3xl mx-auto mb-10">
                        Process CIN, driving licenses, and vehicle registration cards with AI.
                        Fast, accurate, and secure extraction in seconds.
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={handleGetStarted}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-cyan-500/50"
                    >
                        Start Extracting Documents
                    </button>
                </div>

                {/* Features Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Fast Processing</h3>
                        <p className="text-purple-200">Extract data in under 2 seconds with our optimized AI engine</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-pink-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">99% Accuracy</h3>
                        <p className="text-purple-200">High precision extraction with validation and error detection</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
                        <p className="text-purple-200">Your documents are encrypted and processed securely</p>
                    </div>
                </div>

                {/* Supported Documents */}
                <div className="mt-16 text-center">
                    <p className="text-sm text-purple-300 mb-4 tracking-wider">SUPPORTED DOCUMENTS</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <span className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/15 transition-all">
                            🪪 CIN (ID Card)
                        </span>
                        <span className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/15 transition-all">
                            🚗 Driving License
                        </span>
                        <span className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/15 transition-all">
                            📄 Vehicle Registration
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;