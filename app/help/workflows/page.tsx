import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

const workflows = [
  {
    title: "For Those Needing Help",
    icon: "🙋‍♀️",
    steps: [
      { number: 1, title: "Create an Account", description: "Sign up with your email and complete your profile" },
      { number: 2, title: "Post a Request", description: "Click 'Create Help Request' and describe what you need" },
      { number: 3, title: "Wait for Offers", description: "Community members will see your request and offer to help" },
      { number: 4, title: "Connect with Helper", description: "When someone offers help, you'll see their contact information" },
      { number: 5, title: "Coordinate Assistance", description: "Work out the details directly with your helper" },
      { number: 6, title: "Mark Complete", description: "Once helped, mark the request as complete" }
    ]
  },
  {
    title: "For Those Offering Help",
    icon: "🤝",
    steps: [
      { number: 1, title: "Browse Requests", description: "View all open help requests in your community" },
      { number: 2, title: "Find a Match", description: "Look for requests that match your skills and availability" },
      { number: 3, title: "Offer to Help", description: "Click 'Offer to Help' on a request you can assist with" },
      { number: 4, title: "Get Contact Info", description: "You'll receive the requester's contact information" },
      { number: 5, title: "Provide Assistance", description: "Reach out and help according to the request details" },
      { number: 6, title: "Confirm Completion", description: "Mark the request complete when finished" }
    ]
  }
]

const faqs = [
  {
    question: "What happens when someone offers to help?",
    answer: "When a community member clicks 'Offer to Help' on your request, the status changes to 'In Progress' and both parties can see each other's contact information to coordinate the assistance."
  },
  {
    question: "Can I cancel a request?",
    answer: "Yes, you can cancel your request at any time if you no longer need help. Just open your request and click 'Cancel Request'. You can optionally provide a reason."
  },
  {
    question: "How many categories can I choose from?",
    answer: "We offer 12 categories including Transportation, Groceries, Household Tasks, Medical/Pharmacy, Meals, Childcare, Pet Care, Technology Help, Companionship, Respite Care, Emotional Support, and Other."
  },
  {
    question: "How does location work?",
    answer: "Your location is set in your profile and shown on requests to help neighbors identify nearby needs. You can override it for specific requests and control who sees it (everyone, helpers only, or after accepting help)."
  },
  {
    question: "Is my contact information private?",
    answer: "Yes! Your contact information is only shared with the specific person helping or requesting help. You control what information is visible in your profile settings."
  },
  {
    question: "Can I help multiple people?",
    answer: "Absolutely! You can offer help on as many requests as you're able to fulfill. Just make sure to follow through on your commitments."
  }
]

export default function WorkflowsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  ← Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="Care Collective Logo" 
                  width={24} 
                  height={24}
                  className="rounded"
                />
                <div>
                  <h1 className="text-2xl font-bold">How It Works</h1>
                  <p className="text-sm text-secondary-foreground/70">Learn how to use CARE Collective</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Introduction */}
        <Card className="mb-8 border-sage/30 bg-sage/5">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to CARE Collective</CardTitle>
            <CardDescription className="text-base">
              CARE Collective connects community members who need help with those who can provide it. 
              Whether you need assistance or want to help others, our platform makes it easy to build 
              a supportive community network.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Link href="/requests/new">
                <Button className="bg-dusty-rose hover:bg-dusty-rose-dark">
                  Create Help Request
                </Button>
              </Link>
              <Link href="/requests">
                <Button variant="outline" className="border-sage text-sage hover:bg-sage/10">
                  Browse Requests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Workflows */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {workflows.map((workflow) => (
            <Card key={workflow.title} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{workflow.icon}</span>
                  {workflow.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflow.steps.map((step) => (
                    <div key={step.number} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-sage text-white flex items-center justify-center font-bold text-sm">
                          {step.number}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Categories */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Request Categories</CardTitle>
            <CardDescription>
              Choose from a variety of categories when creating or browsing help requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { icon: '🛒', label: 'Groceries' },
                { icon: '🚗', label: 'Transportation' },
                { icon: '🏠', label: 'Household' },
                { icon: '💊', label: 'Medical' },
                { icon: '🍽️', label: 'Meals' },
                { icon: '👶', label: 'Childcare' },
                { icon: '🐾', label: 'Pet Care' },
                { icon: '💻', label: 'Technology' },
                { icon: '👥', label: 'Companionship' },
                { icon: '💆', label: 'Respite Care' },
                { icon: '💝', label: 'Emotional Support' },
                { icon: '📋', label: 'Other' }
              ].map((category) => (
                <Badge 
                  key={category.label} 
                  variant="outline" 
                  className="py-2 px-3 justify-center text-center"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <h3 className="font-semibold mb-2 text-foreground">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <Card className="mt-8 border-dusty-rose/30 bg-dusty-rose/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🛡️</span>
              Safety & Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-dusty-rose-dark mt-0.5">•</span>
                <span>Always meet in public places for the first interaction when possible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dusty-rose-dark mt-0.5">•</span>
                <span>Trust your instincts - if something doesn&apos;t feel right, it&apos;s okay to decline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dusty-rose-dark mt-0.5">•</span>
                <span>Communicate clearly about expectations and boundaries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dusty-rose-dark mt-0.5">•</span>
                <span>Report any inappropriate behavior to administrators</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dusty-rose-dark mt-0.5">•</span>
                <span>Keep personal information private until you&apos;re comfortable sharing</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions? Need additional help?
          </p>
          <Link href="/dashboard">
            <Button variant="outline">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}