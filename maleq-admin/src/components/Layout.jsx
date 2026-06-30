import React from 'react';
import Header from './Header';

export default function Layout({ children, pageTitle }) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] text-slate-900">
            <div className="flex min-h-screen w-full flex-col">
                <Header pageTitle={pageTitle} />
                
                <main className="w-full px-4 py-4 sm:px-6 lg:px-10 lg:py-6 animate-fade-in-up stagger-1">
                    {children}
                </main>
            </div>
        </div>
    );
}