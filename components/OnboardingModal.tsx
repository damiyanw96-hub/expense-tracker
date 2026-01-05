
import React, { useState } from 'react';
import { ArrowRight, CheckCircle, WifiOff, ShieldCheck } from 'lucide-react';

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

    return (
        <div className="fixed inset-0 z-[9999] bg-dark flex items-center justify-center p-6">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
             
             <div className="w-full max-w-md relative">
                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-primary' : 'bg-surface'}`} />
                    ))}
                </div>

                <div className="min-h-[300px]">
                    {step === 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                            <div className="w-20 h-20 bg-primary/20 rounded-3xl mx-auto flex items-center justify-center mb-6 text-primary border border-primary/20 shadow-glow">
                                <ShieldCheck size={40} />
                            </div>
                            <h1 className="text-3xl font-bold text-main mb-3">Welcome</h1>
                            <p className="text-muted text-lg mb-8 leading-relaxed">
                                TrackXpense is a 100% offline, privacy-focused wallet tracker. Your data never leaves this device.
                            </p>
                            <div className="bg-surface/50 p-4 rounded-2xl border border-white/5 inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                                <WifiOff size={16} />
                                <span>No Internet Required</span>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <h2 className="text-2xl font-bold text-main mb-6">Let's get to know you</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase ml-1 mb-2 block">What should we call you?</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-surface text-xl px-5 py-4 rounded-2xl outline-none border border-white/10 focus:border-primary text-main placeholder:text-muted/30 transition-colors"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <h2 className="text-2xl font-bold text-main mb-6">Setup your Finances</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase ml-1 mb-2 block">Current Wallet Balance</label>
                                    <input 
                                        type="number" 
                                        value={balance}
                                        onChange={e => setBalance(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-surface text-2xl px-5 py-4 rounded-2xl outline-none border border-white/10 focus:border-primary text-main placeholder:text-muted/30 transition-colors font-bold"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase ml-1 mb-2 block">Daily Budget Goal (Optional)</label>
                                    <input 
                                        type="number" 
                                        value={dailyGoal}
                                        onChange={e => setDailyGoal(e.target.value)}
                                        placeholder="e.g. 500"
                                        className="w-full bg-surface text-xl px-5 py-4 rounded-2xl outline-none border border-white/10 focus:border-primary text-main placeholder:text-muted/30 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleNext}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg mt-8 flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 hover:bg-primary/90"
                >
                    {step === 2 ? 'Get Started' : 'Continue'}
                    {step === 2 ? <CheckCircle size={20} /> : <ArrowRight size={20} />}
                </button>
             </div>
        </div>
    );
};
