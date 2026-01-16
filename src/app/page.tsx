import { TopicCard } from "@/components/topic-card";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { ArrowRight, CheckCircle2, Code2, TrendingUp, Users, Zap, Trophy, Target, BookOpen, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminDB } from "@/lib/firebase/firebase-admin";

export default async function Home() {
  const dsaImage = getPlaceholderImage("dsa-cover");
  const csImage = getPlaceholderImage("cs-cover");
  const playgroundImage = getPlaceholderImage("playground-cover");

  let dsaCount: number | string = '500+';
  let csCount: number | string = '50+';
  let languagesCount: number | string = '15+';

  try {
    const [dsaSnap, csSnap, playgroundSnap] = await Promise.all([
      adminDB.collection('dsa_questions').select().get(),
      adminDB.collection('cs_topics').select().get(),
      adminDB.collection('playground_problems').select().get(),
    ]);

    dsaCount = dsaSnap.size;
    csCount = csSnap.size;

    const languagesSet = new Set<string>();
    playgroundSnap.forEach((doc) => {
      const data = doc.data() as any;
      if (data.templates && typeof data.templates === 'object') {
        Object.keys(data.templates).forEach((k) => languagesSet.add(k));
      }
      if (Array.isArray(data.languages)) {
        data.languages.forEach((l: string) => languagesSet.add(l));
      }
    });
    languagesCount = languagesSet.size || playgroundSnap.size || 15;
  } catch (error) {
    console.error('Failed to fetch live counts for home page:', error);
  }

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-background -z-10" />
        
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm animate-pulse">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Join 1000+ Learners Already Mastering Tech Skills
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline mb-6 tracking-tighter">
              Your <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent animate-gradient">The Victory Key</span> for
              <br />Tech Mastery
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Navigate the world of Data Structures, Algorithms, and Computer Science fundamentals. 
              Track your progress, earn achievements, and conquer your learning goals with our interactive platform.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Button asChild size="lg" className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                <Link href="/dsa">
                  Start DSA Sheet <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 py-6">
                <Link href="/cs">
                  Explore CS Subjects <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{typeof dsaCount === 'number' ? dsaCount : dsaCount}</div>
                <div className="text-xs md:text-sm text-muted-foreground">DSA Problems</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{typeof csCount === 'number' ? csCount : csCount}</div>
                <div className="text-xs md:text-sm text-muted-foreground">CS Topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{typeof languagesCount === 'number' ? languagesCount : languagesCount}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Languages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">100%</div>
                <div className="text-xs md:text-sm text-muted-foreground">Free Forever</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TopicCard
              title="DSA Sheet"
              description="A curated list of essential DSA questions to master for interviews and competitive programming."
              href="/dsa"
              imageUrl={dsaImage?.imageUrl} 
            />
            <TopicCard
              title="CS Core Subjects"
              description="Strengthen your fundamentals with key topics in Operating Systems, DBMS, Networks, and more."
              href="/cs"
              imageUrl={csImage?.imageUrl}
            />
            <TopicCard
              title="Code Playground"
              description="Practice coding in real-time with our interactive code editor supporting multiple languages."
              href="/playground"
              imageUrl={playgroundImage?.imageUrl}
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose The Victory Key?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to ace your tech interviews and build a strong foundation in computer science
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Smart Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track every problem solved, topic completed, and milestone achieved with detailed analytics and visual progress indicators.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-orange-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Daily Streak System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Build consistency with our streak tracking. Practice daily and watch your learning momentum grow exponentially.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Achievements & Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Earn badges and unlock achievements as you progress. From "First Step" to "DSA Champion" - celebrate every win!
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-green-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Code2 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Interactive Playground</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Write, test, and debug code directly on the platform with support for 15+ programming languages. No setup needed!
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Curated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Focus on what matters. Every question and topic is carefully selected based on real interview patterns from top companies.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-pink-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle className="text-xl">Personalized Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get insights into your learning patterns with charts, activity feed, and personalized recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps and begin your journey to tech mastery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
              <p className="text-muted-foreground">
                Sign up for free using Google authentication. No credit card required, no hidden fees.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Path</h3>
              <p className="text-muted-foreground">
                Start with DSA problems or dive into CS fundamentals. Track your progress as you learn.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Master & Achieve</h3>
              <p className="text-muted-foreground">
                Practice consistently, earn achievements, and prepare yourself for top tech interviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <Trophy className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of learners who are already mastering DSA and CS concepts. 
                Start tracking your progress today and take your first step towards landing your dream job!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-base px-8">
                  <Link href="/login">
                    Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base px-8">
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
    </div>
  );
}