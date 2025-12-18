'use client'

import React, { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ReactNode } from 'react'
import {
    Users,
    Hand,
    Handshake,
    Heart,
    Star,
    Sprout,
    HandHelping,
    GraduationCap,
    Home,
    BookOpen,
    Mail,
    MapPin,
    Calendar
} from 'lucide-react'
import LandingSection from '@/components/LandingSection'

// --- Types ---
interface SectionProps {
    id?: string
    className?: string
}

// --- What Is CARE Collective Section ---
export function WhatIsCareSection({ id = "what-is-care" }: SectionProps): ReactElement {
    return (
        <section id={id} className="py-24 bg-cream text-brown">
            <div className="container mx-auto px-4 max-w-7xl">
                <h2 className="text-4xl md:text-5xl font-black text-center mb-16 text-brown">What is CARE Collective?</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Box 1: How It Works */}
                    <div className="bg-white p-10 rounded-3xl shadow-lg border-2 border-tan/20 hover:border-tan transition-colors duration-300">
                        <div className="flex justify-center mb-6">
                            <div className="bg-teal/10 p-4 rounded-full">
                                <Users className="w-12 h-12 text-teal" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold mb-6 text-center text-brown">How It Works</h3>
                        <ol className="space-y-6 list-decimal list-inside text-xl font-medium text-brown/80">
                            <li className="pl-2 marker:font-bold marker:text-teal">Create an Account</li>
                            <li className="pl-2 marker:font-bold marker:text-teal">Request or Offer Help</li>
                            <li className="pl-2 marker:font-bold marker:text-teal">Build Community</li>
                        </ol>
                    </div>

                    {/* Box 2: Why Join? */}
                    <div className="bg-white p-10 rounded-3xl shadow-lg border-2 border-tan/20 hover:border-tan transition-colors duration-300">
                        <div className="flex justify-center mb-6">
                            <div className="bg-rose/20 p-4 rounded-full">
                                <Heart className="w-12 h-12 text-rose-dark" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-6 text-center text-brown">Are you caring for an aging loved one?</h3>
                        <ul className="space-y-4 text-lg text-brown/80">
                            <li className="flex gap-3">
                                <span className="text-teal font-bold text-xl">•</span>
                                <span><strong>Mutual exchange</strong> - Give what you can, receive what you need</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-teal font-bold text-xl">•</span>
                                <span><strong>Flexibility</strong> - Engage when and how you can</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-teal font-bold text-xl">•</span>
                                <span><strong>Learning opportunities</strong> - Workshops on topics chosen by members</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-teal font-bold text-xl">•</span>
                                <span><strong>No pressure</strong> - Okay to be in a season where you mostly need support</span>
                            </li>
                        </ul>
                    </div>

                    {/* Box 3: Kinds of Help */}
                    <div className="bg-white p-10 rounded-3xl shadow-lg border-2 border-tan/20 hover:border-tan transition-colors duration-300">
                        <div className="flex justify-center mb-6">
                            <div className="bg-terracotta/10 p-4 rounded-full">
                                <HandHelping className="w-12 h-12 text-terracotta" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold mb-6 text-center text-brown">Kinds of Help</h3>
                        <div className="grid grid-cols-1 gap-3 text-lg font-medium text-brown/80 text-center">
                            <div className="py-2 border-b border-tan/30">Health & Caregiving</div>
                            <div className="py-2 border-b border-tan/30">Groceries & Meals</div>
                            <div className="py-2 border-b border-tan/30">Transportation & Errands</div>
                            <div className="py-2 border-b border-tan/30">Household & Yard</div>
                            <div className="py-2 border-b border-tan/30">Technology & Administrative</div>
                            <div className="py-2">Social & Companionship</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// --- About Section ---
export function AboutSection({ id = "about" }: SectionProps): ReactElement {
    return (
        <section id={id} className="py-24 bg-tan text-brown">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                    {/* Text Content - 60% */}
                    <div className="lg:w-3/5 order-2 lg:order-1">
                        <div className="bg-white/90 p-10 rounded-3xl shadow-xl">
                            <h2 className="text-4xl md:text-5xl font-black mb-8 text-brown">About CARE Collective</h2>
                            <div className="space-y-6 text-xl leading-relaxed text-brown/90">
                                <p>
                                    The CARE (Caregiver Assistance and Resource Exchange) Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources.
                                </p>
                                <p>
                                    The Collective is powered by caregivers themselves, along with students and volunteers who help maintain the site and coordinate outreach and engagement.
                                </p>
                                <p>
                                    Together, we are building a space where caregivers find connection, practical help, and the mutual support that makes caregiving sustainable.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Photo - 40% */}
                    <div className="lg:w-2/5 order-1 lg:order-2">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-terracotta/30 rounded-[2rem] rotate-3 transform"></div>
                            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/50">
                                <Image
                                    src="/images/maureen-portrait.png"
                                    alt="Dr. Maureen Templeman, Founder"
                                    width={500}
                                    height={600}
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-4 text-center">
                                    <p className="text-white font-bold text-lg">Dr. Maureen Templeman</p>
                                    <p className="text-white/80 text-sm uppercase tracking-wider">Founder</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// --- Community Resources Section ---
export function ResourcesSection({ id = "resources" }: SectionProps): ReactElement {
    return (
        <section id={id} className="py-24 bg-cream text-brown">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-brown mb-6">Community Resources</h2>
                    <p className="text-xl text-brown/80 max-w-3xl mx-auto">
                        Connect with trusted local and regional organizations that offer practical support, guidance, and connection.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Essentials */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-tan/20 text-center hover:transform hover:-translate-y-2 transition-all duration-300 group">
                        <div className="bg-sage/10 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:bg-sage/20 transition-colors">
                            <Home className="w-10 h-10 text-sage" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-brown">Essentials</h3>
                        <p className="text-lg text-brown/70">Food, housing, and everyday needs</p>
                    </div>

                    {/* Well-Being */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-tan/20 text-center hover:transform hover:-translate-y-2 transition-all duration-300 group">
                        <div className="bg-rose/10 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:bg-rose/20 transition-colors">
                            <Heart className="w-10 h-10 text-rose" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-brown">Well-Being</h3>
                        <p className="text-lg text-brown/70">Emotional health and caregiving support</p>
                    </div>

                    {/* Community */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-tan/20 text-center hover:transform hover:-translate-y-2 transition-all duration-300 group">
                        <div className="bg-teal/10 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:bg-teal/20 transition-colors">
                            <Users className="w-10 h-10 text-teal" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-brown">Community</h3>
                        <p className="text-lg text-brown/70">Local programs and connections</p>
                    </div>

                    {/* Learning */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-tan/20 text-center hover:transform hover:-translate-y-2 transition-all duration-300 group">
                        <div className="bg-terracotta/10 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:bg-terracotta/20 transition-colors">
                            <BookOpen className="w-10 h-10 text-terracotta" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-brown">Learning</h3>
                        <p className="text-lg text-brown/70">Training and educational programs</p>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link href="/resources" className="inline-block bg-teal text-white px-8 py-4 text-xl font-bold rounded-xl hover:bg-teal/90 transition-colors shadow-lg">
                        View All Resources
                    </Link>
                </div>
            </div>
        </section>
    )
}

// --- Get in Touch Section ---
export function ContactSection({ id = "contact" }: SectionProps): ReactElement {
    return (
        <section id={id} className="py-24 bg-terracotta text-white">
            <div className="container mx-auto px-4 max-w-4xl text-center">
                <h2 className="text-4xl md:text-5xl font-black mb-8">Get in Touch</h2>
                <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
                    Have questions or feedback? We're here to help.
                </p>

                <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 inline-block w-full max-w-2xl">
                    <Mail className="w-16 h-16 text-white mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Email Us</h3>
                    <a href="mailto:swmocarecollective@gmail.com" className="text-2xl md:text-3xl font-bold hover:text-white/80 transition-colors break-all underline decoration-2 underline-offset-4">
                        swmocarecollective@gmail.com
                    </a>
                </div>
            </div>
        </section>
    )
}
