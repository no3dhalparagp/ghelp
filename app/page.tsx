import LoginForm from "@/components/auth/LoginForm";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-white">
      {/* Left Pane - Branding & Info */}
      <div className="relative flex flex-col justify-center flex-1 p-8 lg:p-16 bg-blue-700 text-white overflow-hidden shadow-2xl z-10">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600 blur-3xl opacity-50" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-800 blur-3xl opacity-50" />
        
        <div className="relative z-20 max-w-xl mx-auto lg:mx-0 lg:max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
              <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold tracking-wide text-blue-50 uppercase">P.M.S Workflow</h2>
          </div>
          
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-6 leading-[1.1]">
            Panchayat Help <br/> Management System
          </h1>
          
          <p className="text-lg lg:text-xl text-blue-100 mb-10 leading-relaxed max-w-lg font-medium opacity-90">
            A comprehensive platform to manage administrative workflows, certificates, public services, and daily operations efficiently across the Gram Panchayat.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="flex items-start gap-4 bg-white/5 p-5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="bg-green-500/20 p-2.5 rounded-lg shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">Secure Access</h3>
                <p className="text-sm text-blue-200 leading-snug">Role-based granular authentication & auditing across the SaaS platform.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-white/5 p-5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="bg-orange-500/20 p-2.5 rounded-lg shrink-0">
                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">Fast Processing</h3>
                <p className="text-sm text-blue-200 leading-snug">Accelerated application and work approvals with complete transparency.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form Wrapper */}
      <div className="flex flex-col justify-center flex-1 bg-gradient-to-br from-orange-50 relative overflow-y-auto w-full">
         <div className="absolute top-0 right-0 p-8 hidden lg:block opacity-50 pointer-events-none">
           <svg width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
             <circle cx="60" cy="60" r="59.5" stroke="#F97316" strokeDasharray="4 4" />
             <path d="M60 20v80M20 60h80" stroke="#F97316" strokeOpacity="0.5" strokeWidth="2" />
           </svg>
         </div>

         <div className="w-full flex justify-center items-center h-full">
            {/* The LoginForm has internal margins/backgrounds, but letting it render natively centers it. 
                We use a custom wrapper to override its internal min-h-screen if needed via CSS, 
                but practically it will just stretch and center its Card nicely inside this half. */}
            <div className="w-full max-w-2xl transform transition-transform duration-500 hover:scale-[1.01]">
              <LoginForm />
            </div>
         </div>
      </div>
    </div>
  );
}
