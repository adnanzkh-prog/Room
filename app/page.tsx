import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Room Rent Pro</h1>
        <p className="text-gray-600 mb-8">AI-Powered Property Management</p>
        <div className="space-x-4">
          <Link 
            href="/login" 
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg inline-block"
          >
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-lg inline-block"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  )
}
