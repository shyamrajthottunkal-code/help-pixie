import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Shield, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">
            Smart Complaint Hub
          </h1>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-primary-light/20 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-6 leading-tight">
                Submit & Track
                <span className="text-primary block">
                  Student Complaints
                </span>
                With Ease
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                A smart platform designed for students to voice concerns,
                track resolutions, and get AI-powered assistance 24/7.
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                  Learn More
                </Button>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={heroImage}
                alt="Students collaborating"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Platform?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-lg bg-primary/5 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Fast & Easy</h4>
              <p className="text-muted-foreground">
                Submit complaints in seconds with our intuitive interface.
                No complicated forms or procedures.
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-primary/5 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3">AI HelpBot</h4>
              <p className="text-muted-foreground">
                Get instant assistance from our friendly AI chatbot.
                Available 24/7 to guide you through the process.
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-primary/5 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Secure & Private</h4>
              <p className="text-muted-foreground">
                Your complaints are confidential and secure. Track status
                with real-time updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold mb-6">
            Ready to Make Your Voice Heard?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of students already using our platform to resolve their concerns.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-primary"
          >
            Start Submitting Complaints
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Smart Complaint Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
