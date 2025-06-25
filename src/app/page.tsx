import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Users, Layers } from "lucide-react"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  // Check if user is logged in
  const session = await auth();
  
  // If already logged in, redirect to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">FlowBoard</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              {/*<Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</Link>*/}
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign in</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Manage projects simply
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                FlowBoard helps to get it done all at once.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="flex items-center gap-2">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {/*<Link href="/demo">
                  <Button size="lg" variant="outline">
                    View demo
                  </Button>
                </Link>*/}
              </div>
            </div>
            <div className="md:w-1/2">
              {/* Placeholder dashboard preview */}
              <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
                <div className="bg-gray-800 h-12 flex items-center px-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex">
                    <div className="w-48 bg-gray-100 h-64 rounded-md p-3">
                      <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-gray-200 rounded"></div>
                        <div className="h-4 w-36 bg-gray-200 rounded"></div>
                        <div className="h-4 w-40 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="h-32 bg-blue-50 rounded-md p-3">
                          <div className="h-4 w-16 bg-blue-100 rounded mb-2"></div>
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-blue-100 rounded"></div>
                            <div className="h-3 w-full bg-blue-100 rounded"></div>
                          </div>
                        </div>
                        <div className="h-32 bg-yellow-50 rounded-md p-3">
                          <div className="h-4 w-16 bg-yellow-100 rounded mb-2"></div>
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-yellow-100 rounded"></div>
                            <div className="h-3 w-full bg-yellow-100 rounded"></div>
                          </div>
                        </div>
                        <div className="h-32 bg-green-50 rounded-md p-3">
                          <div className="h-4 w-16 bg-green-100 rounded mb-2"></div>
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-green-100 rounded"></div>
                            <div className="h-3 w-full bg-green-100 rounded"></div>
                          </div>
                        </div>
                        <div className="h-32 bg-purple-50 rounded-md p-3">
                          <div className="h-4 w-16 bg-purple-100 rounded mb-2"></div>
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-purple-100 rounded"></div>
                            <div className="h-3 w-full bg-purple-100 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to manage your projects</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              FlowBoard combines the best features of task management simply and easily.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Flow Boards</h3>
              <p className="text-gray-600">
                Visualize your workflow with drag and drop updates
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-red-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                <CheckCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Task Management</h3>
              <p className="text-gray-600">
                Create tasks with descriptions, due dates, priorities, and subtasks to stay organized.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
              <p className="text-gray-600">
                Invite team members into the task arena.
              </p>
            </div>
            
            {/*<div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multiple Views</h3>
              <p className="text-gray-600">
                Switch between Kanban, list, and calendar views.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics</h3>
              <p className="text-gray-600">
                Track progress with visual reports and analytics to keep your projects on schedule.
              </p>
            </div>*/}
            
            
            
            {/*<div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Organizations</h3>
              <p className="text-gray-600">
                Organize your work with organizations, projects, and role-based permissions.
              </p>
            </div>*/}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to get started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Start using FlowBoard to streamline your workflows and boost productivity.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-blue-600">
              Create your free account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <span className="text-xl font-bold text-gray-900">FlowBoard</span>
              <p className="mt-2 text-gray-600 max-w-xs">
                Get it all done all at once.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                  Product
                </h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900">Features</Link></li>
                  {/*<li><Link href="#" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900">Integrations</Link></li>*/}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                  Company
                </h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900">About</Link></li>
                  {/*<li><Link href="#" className="text-gray-600 hover:text-gray-900">Blog</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900">Careers</Link></li>*/}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                  Support
                </h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900">Contact</Link></li>
                  {/*<li><Link href="#" className="text-gray-600 hover:text-gray-900">Help Center</Link></li>*/}
                  {/*<li><Link href="#" className="text-gray-600 hover:text-gray-900">Privacy</Link></li>*/}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-gray-500 text-sm text-center">
              © {new Date().getFullYear()} FlowBoard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
