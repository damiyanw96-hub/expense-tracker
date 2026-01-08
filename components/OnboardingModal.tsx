
import React, { useState } from 'react';
import { ArrowRight, CheckCircle, WifiOff, ShieldCheck, Zap, ChevronRight } from 'lucide-react';

interface OnboardingProps {
    isOpen: boolean;
    onComplete: (name: string, balance: number, dailyGoal: number) => void;
}

export const OnboardingModal: React.FC<OnboardingProps> = ({ isOpen, onComplete }) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [dailyGoal, setDailyGoal] = useState('');

    if (!isOpen) return null;

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
        else {
            onComplete(name || 'User', parseFloat(balance) || 0, parseFloat(dailyGoal) || 0);
        }
    };

    const handleSkip = () => {
        // Defaults: Name="User", Balance=0, Goal=0
        onComplete('User', 0, 0);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-dark flex items-center justify-center p-6">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
             <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
             
             <div className="w-full max-w-md relative z-10 flex flex-col h-full max-h-[600px] justify-between">
                
                {/* Progress Indicators (Only show after step 0) */}
                <div className={`transition-opacity duration-500 ${step > 0 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex gap-2 mb-8">
                        {[1, 2].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-gradient-to-r from-primary to-purple-500' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    {step === 0 && (
                        <div className="animate-in zoom-in-95 fade-in duration-700 flex flex-col items-center text-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>
                                <div className="relative w-24 h-24 bg-gradient-to-br from-gray-800 to-black border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-primary to-purple-500 rounded-2xl flex items-center justify-center text-white">
                                        <Zap size={36} fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                            
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60 mb-4 tracking-tight">
                                TrackXpense
                            </h1>
                            <p className="text-lg text-muted/80 leading-relaxed max-w-xs mx-auto mb-8">
                                Master your money with a completely offline, privacy-first wallet manager.
                            </p>

                            <div className="flex flex-col gap-3 w-full">
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-400"><WifiOff size={18} /></div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-main">100% Offline</p>
                                        <p className="text-[10px] text-muted">Data stays on your device</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-400"><ShieldCheck size={18} /></div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-main">Privacy Focused</p>
                                        <p className="text-[10px] text-muted">No tracking, no ads</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">Step 1 of 2</span>
                            <h2 className="text-3xl font-bold text-white mb-2">Who is this for?</h2>
                            <p className="text-muted mb-8">Personalize your experience.</p>
                            
                            <div className="group">
                                <label className="text-xs font-bold text-muted uppercase ml-1 mb-3 block group-focus-within:text-primary transition-colors">Your Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Alex"
                                    className="w-full bg-surface text-2xl px-6 py-5 rounded-3xl outline-none border border-white/10 focus:border-primary text-main placeholder:text-muted/20 transition-all shadow-lg focus:shadow-primary/20"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">Step 2 of 2</span>
                            <h2 className="text-3xl font-bold text-white mb-2">Quick Setup</h2>
                            <p className="text-muted mb-8">Enter your current status.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase ml-1 mb-2 block">Current Balance</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={balance}
                                            onChange={e => setBalance(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-surface text-2xl px-6 py-5 rounded-3xl outline-none border border-white/10 focus:border-primary text-main placeholder:text-muted/20 transition-all font-bold"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase ml-1 mb-2 block">Daily Budget Limit <span className="text-white/20">(Optional)</span></label>
                                    <input 
                                        type="number" 
                                        value={dailyGoal}
                                        onChange={e => setDailyGoal(e.target.value)}
                                        placeholder="e.g. 1000"
                                        className="w-full bg-surface text-xl px-6 py-5 rounded-3xl outline-none border border-white/10 focus:border-primary text-main placeholder:text-muted/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 space-y-4">
                    <button 
                        onClick={handleNext}
                        className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 hover:opacity-90 relative overflow-hidden group"
                    >
                        <span className="relative z-10">{step === 0 ? 'Get Started' : step === 2 ? 'Complete Setup' : 'Continue'}</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        {step === 2 ? <CheckCircle size={20} className="relative z-10"/> : <ArrowRight size={20} className="relative z-10"/>}
                    </button>

                    <button 
                        onClick={handleSkip}
                        className="w-full py-2 text-sm font-semibold text-muted hover:text-white transition-colors"
                    >
                        {step === 0 ? "" : "Skip Setup & Start Fresh"}
                    </button>
                </div>
             </div>
        </div>
    );
};
