"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RealtimeStats } from '@/components/ui/realtime-stats';
import { Github, Linkedin, Twitter, Code2, Users, TrendingUp, CheckCircle2, Rocket, Heart, Star, Zap, BookOpen, Target, Trophy, Building, Clock, Shield, Award, Globe, Lightbulb, GraduationCap, Briefcase, Coffee, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Loading from '@/components/ui/loading';

export default function AboutPage() {
    useEffect(() => {
        document.title = "About Us | The Victory Key";
    }, []);

    return (
        <div className='bg-background text-foreground'>
            <div className='container mx-auto px-4 py-16'>
                <section className='text-center mb-20'>
                    <Badge className='mb-4'>
                        <Rocket className='mr-1 h-3 w-3' />
                        Your Path to Tech Excellence
                    </Badge>
                    <h1 className='text-4xl md:text-6xl font-bold font-headline mb-4 tracking-tighter'>
                        About <span className='bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent'>The Victory Key</span>
                    </h1>
                    <p className='text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed'>
                        The Victory Key helps you convert study-hours into measurable progress. We focus on high-impact problems, clear learning paths, and realistic exam simulations so you can prepare for interviews with confidence.
                        Built by engineers and educators, our platform emphasizes practice, feedback, and the metrics that truly matter.
                    </p>
                </section>

                <section className='mb-20'>
                    <h2 className='text-3xl font-bold text-center mb-12'>Platform Statistics</h2>
                    <RealtimeStats />
                    <p className='text-center text-sm text-muted-foreground mt-3'>Live counts show recent exam attempts and pass rates aggregated from our platform; updated periodically.</p>
                </section>

                {/* Our Story Section */}
                <section className='mb-20'>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
                        <div>
                            <Badge className='mb-4'>
                                <Heart className='mr-1 h-3 w-3' />
                                Our Story
                            </Badge>
                            <h2 className='text-3xl font-bold mb-6'>Built by Developers, for Developers</h2>
                            <div className='space-y-4 text-muted-foreground'>
                                <p>
                                    The Victory Key started as a small project to cut through the noise of generic practice material.
                                    We focused on the problems that reflect real interview expectations and built tools to measure progress.
                                </p>
                                <p>
                                    Our content is curated and continuously reviewed by practitioners. We analyze exam patterns and
                                    feedback to keep the material current and high-impact.
                                </p>
                                <p>
                                    Today thousands of learners and professionals use The Victory Key to prepare smarter, not harder.
                                    Join the community and turn practice into results.
                                </p>
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <Card className='p-6 text-center'>
                                <Building className='h-8 w-8 text-primary mx-auto mb-3' />
                                <h3 className='font-semibold mb-2'>Founded</h3>
                                <p className='text-sm text-muted-foreground'>2025</p>
                            </Card>
                            <Card className='p-6 text-center'>
                                <Coffee className='h-8 w-8 text-orange-600 mx-auto mb-3' />
                                <h3 className='font-semibold mb-2'>Dedication</h3>
                                <p className='text-sm text-muted-foreground'>24/7 Support</p>
                            </Card>
                        </div>
                    </div>
                </section>

                <section className='mb-20 bg-card border rounded-lg p-8 md:p-12'>
                    <h2 className='text-3xl font-bold text-center mb-12'>Why Choose The Victory Key?</h2>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                        <div className='text-center p-6 hover:bg-muted/50 rounded-lg transition-colors'>
                            <Target className='h-12 w-12 text-primary mb-4 mx-auto' />
                            <h3 className='text-xl font-semibold mb-3'>Focus on What Matters</h3>
                            <p className='text-muted-foreground leading-relaxed'>
                                Our content is meticulously curated based on real interview patterns from top tech companies. 
                                We analyze thousands of interview experiences to bring you the most relevant problems and concepts.
                            </p>
                        </div>
                        <div className='text-center p-6 hover:bg-muted/50 rounded-lg transition-colors'>
                            <Zap className='h-12 w-12 text-primary mb-4 mx-auto' />
                            <h3 className='text-xl font-semibold mb-3'>Efficient Preparation</h3>
                            <p className='text-muted-foreground leading-relaxed'>
                                Time is precious. Our structured approach ensures you spend less time wondering what to study 
                                and more time mastering the concepts that will actually help you succeed in interviews.
                            </p>
                        </div>
                        <div className='text-center p-6 hover:bg-muted/50 rounded-lg transition-colors'>
                            <BookOpen className='h-12 w-12 text-primary mb-4 mx-auto' />
                            <h3 className='text-xl font-semibold mb-3'>Structured Learning Path</h3>
                            <p className='text-muted-foreground leading-relaxed'>
                                Follow our carefully designed learning paths that take you from basics to advanced concepts. 
                                Each topic builds upon the previous one, ensuring solid fundamentals.
                            </p>
                        </div>
                        <div className='text-center p-6 hover:bg-muted/50 rounded-lg transition-colors'>
                            <Shield className='h-12 w-12 text-green-600 mb-4 mx-auto' />
                            <h3 className='text-xl font-semibold mb-3'>Quality Assurance</h3>
                            <p className='text-muted-foreground leading-relaxed'>
                                Every problem and solution is reviewed by industry experts. We maintain high standards to ensure 
                                you're learning from accurate, up-to-date, and industry-relevant content.
                            </p>
                        </div>
                        <div className='text-center p-6 hover:bg-muted/50 rounded-lg transition-colors'>
                            <Clock className='h-12 w-12 text-blue-600 mb-4 mx-auto' />
                            <h3 className='text-xl font-semibold mb-3'>Progress Tracking</h3>
                            <p className='text-muted-foreground leading-relaxed'>
                                Monitor your learning journey with detailed analytics. Track solved problems, time spent, 
                                and identify areas that need more attention. Stay motivated with achievement badges.
                            </p>
                        </div>
                        <div className='text-center p-6 hover:bg-muted/50 rounded-lg transition-colors'>
                            <Users className='h-12 w-12 text-purple-600 mb-4 mx-auto' />
                            <h3 className='text-xl font-semibold mb-3'>Community Support</h3>
                            <p className='text-muted-foreground leading-relaxed'>
                                Join a community of like-minded learners and professionals. Share experiences, ask questions, 
                                and learn from others who are on the same journey to tech success.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className='mb-20'>
                    <h2 className='text-3xl font-bold text-center mb-12'>Platform Features</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                        <Card className='p-6 hover:shadow-md transition-shadow'>
                            <Code2 className='h-8 w-8 text-blue-500 mb-3' />
                            <h3 className='font-semibold mb-2'>Code Playground</h3>
                            <p className='text-sm text-muted-foreground'>
                                Practice coding with our interactive playground supporting multiple languages
                            </p>
                        </Card>
                        <Card className='p-6 hover:shadow-md transition-shadow'>
                            <TrendingUp className='h-8 w-8 text-green-500 mb-3' />
                            <h3 className='font-semibold mb-2'>Progress Tracking</h3>
                            <p className='text-sm text-muted-foreground'>
                                Comprehensive dashboard to monitor your learning progress and achievements
                            </p>
                        </Card>
                        <Card className='p-6 hover:shadow-md transition-shadow'>
                            <CheckCircle2 className='h-8 w-8 text-purple-500 mb-3' />
                            <h3 className='font-semibold mb-2'>Interactive Exams</h3>
                            <p className='text-sm text-muted-foreground'>
                                Take timed exams with instant feedback and detailed result analysis
                            </p>
                        </Card>
                        <Card className='p-6 hover:shadow-md transition-shadow'>
                            <Users className='h-8 w-8 text-orange-500 mb-3' />
                            <h3 className='font-semibold mb-2'>User Authentication</h3>
                            <p className='text-sm text-muted-foreground'>
                                Secure login system with personalized learning experience
                            </p>
                        </Card>
                        <Card className='p-6 hover:shadow-md transition-shadow'>
                            <BookOpen className='h-8 w-8 text-indigo-500 mb-3' />
                            <h3 className='font-semibold mb-2'>Structured Content</h3>
                            <p className='text-sm text-muted-foreground'>
                                Well-organized DSA problems and CS topics with difficulty levels
                            </p>
                        </Card>
                        <Card className='p-6 hover:shadow-md transition-shadow'>
                            <Star className='h-8 w-8 text-yellow-500 mb-3' />
                            <h3 className='font-semibold mb-2'>Achievement System</h3>
                            <p className='text-sm text-muted-foreground'>
                                Earn badges and track milestones as you complete challenges
                            </p>
                        </Card>
                        <Card className='p-6 hover:shadow-md transition-shadow'>
                            <Shield className='h-8 w-8 text-red-500 mb-3' />
                            <h3 className='font-semibold mb-2'>Secure Platform</h3>
                            <p className='text-sm text-muted-foreground'>
                                Enterprise-grade security with Firebase authentication and database
                            </p>
                        </Card>
                        <Card className='p-6 hover:shadow-md transition-shadow'>
                            <Zap className='h-8 w-8 text-cyan-500 mb-3' />
                            <h3 className='font-semibold mb-2'>Fast Performance</h3>
                            <p className='text-sm text-muted-foreground'>
                                Optimized with Next.js 15 for lightning-fast loading and smooth experience
                            </p>
                        </Card>
                    </div>
                </section>

                <section className='text-center bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-lg p-12 border-2 mb-20'>
                    <Trophy className='h-16 w-16 text-primary mx-auto mb-6' />
                    <h2 className='text-3xl font-bold mb-4'>Ready to Start Your Journey?</h2>
                    <p className='text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed'>
                        Join thousands of learners who have successfully landed jobs at top tech companies. 
                        Start your structured learning journey today and transform your career with The Victory Key.
                    </p>
                    <div className='flex flex-col sm:flex-row gap-4 justify-center mb-6'>
                        <Link href='/dsa' className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8'>
                            <Code2 className='mr-2 h-4 w-4' />
                            Start with DSA
                        </Link>
                        <Link href='/cs' className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8'>
                            <BookOpen className='mr-2 h-4 w-4' />
                            Explore CS Topics
                        </Link>
                        <Link href='/dashboard' className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-11 px-8'>
                            <TrendingUp className='mr-2 h-4 w-4' />
                            Track Progress
                        </Link>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                        No credit card required • Free to start • Join the community today
                    </p>
                </section>

                {/* Contact & Support Section */}
                <section className='text-center'>
                    <h2 className='text-2xl font-bold mb-6'>Have Questions? We're Here to Help</h2>
                    <p className='text-muted-foreground mb-6'>
                        Our team is committed to your success. Reach out if you need any assistance.
                    </p>
                    <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                        <Link href='/contact' className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8'>
                            Contact Us
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
