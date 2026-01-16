import { Github, Linkedin, Twitter, BookOpen, Code, Trophy, Users, FileText, Shield } from 'lucide-react'; 
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-6 py-12">
        {/* Updated grid to support 5 columns on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 text-center sm:text-left">
          
          {/* Column 1: The Victory Key & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">🔑</span> The Victory Key
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Master programming concepts with our comprehensive DSA sheets, CS subjects, interactive coding playground, and skill assessment exams.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} The Victory Key. All Rights Reserved.
            </p>
          </div>

          {/* Column 2: Learning Resources */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase mb-4 flex items-center justify-center sm:justify-start gap-2">
              <BookOpen size={16} />
              Learning
            </h3>
            <ul className="space-y-2">
              <li><Link href="/dsa" className="text-muted-foreground hover:text-foreground transition-colors">DSA Sheet</Link></li>
              <li><Link href="/cs" className="text-muted-foreground hover:text-foreground transition-colors">CS Subjects</Link></li>
              <li><Link href="/playground" className="text-muted-foreground hover:text-foreground transition-colors">Code Playground</Link></li>
              <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Column 3: Assessment */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase mb-4 flex items-center justify-center sm:justify-start gap-2">
              <Trophy size={16} />
              Assessment
            </h3>
            <ul className="space-y-2">
              <li><Link href="/exam" className="text-muted-foreground hover:text-foreground transition-colors">Practice Exams</Link></li>
              <li><Link href="/exam/result" className="text-muted-foreground hover:text-foreground transition-colors">Exam Results</Link></li>
              <li><Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">My Progress</Link></li>
            </ul>
          </div>
          
          {/* Column 4: Company & Legal */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase mb-4 flex items-center justify-center sm:justify-start gap-2">
              <Users size={16} />
              Company
            </h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          {/* Column 5: Connect */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase mb-4 flex items-center justify-center sm:justify-start gap-2">
              <Code size={16} />
              Connect
            </h3>
            <div className="space-y-3">
              <div className="flex justify-center sm:justify-start space-x-4">
                <Link href="#" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter size={24} />
                </Link>
                <Link href="#" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github size={24} />
                </Link>
                <Link href="#" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Linkedin size={24} />
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>📧 Consultantstvk@gmail.com</p>
                <p>🌟 Star us on GitHub</p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>🚀 Built with Next.js & Firebase</span>
              <span>•</span>
              <span>Made with ❤️ for developers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}