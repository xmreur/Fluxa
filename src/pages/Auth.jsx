import { Navigate, useNavigate } from "react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { useAuth } from "../context/AuthContext";
import FluxaLogo from "../components/FluxaLogo";
import Input from "../components/Input";
import { supabase } from "../supabase-client";

export function Auth () {
    const {user, profile, loading } = useAuth()


    if ( user) return <Navigate to='/' replace={true} />

    const [mode, setMode] = useState('login')
    const [errorMsg, setErrorMsg] = useState(null)
    const [isError, setIsError] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setErrorMsg(true);


        if (mode === 'login') {
            await handleLogin();
        }
        else {
            await handleRegister()
        }
        if (errorMsg === null) {
            if (mode === 'login') {
                navigate('/') 
            } else {
                setErrorMsg(`A confirmation email was sent to ${email}`)
                setIsError(false)
            }
        }
    }

    const handleLogin = async () => {

        const { error } = await supabase.auth.signInWithPassword({
            email, password
        })

        if (error) {
            setErrorMsg(error.message)
            setIsError(true)
        }

    }

    const handleRegister = async () => {

        try {

            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password, 
                options: {
                    data: {
                        display_name: username,
                    }
                }
            })
            
            if (error) { throw error }

        } catch (e) {
            if (e.message) {
                setErrorMsg(e.message ?? 'Something went wrong')
                setIsError(true)
            }

        }
    }

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setEmail('');
        setPassword('');
        setUsername('');
    }

    return (
        <div className="min-h-svh min-w-svw bg-slate-900 flex text-white">
            {/* Left Side + Branding */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{  opacity: 1, x: 0 }}
                className="hidden lg:flex lg:w-1/2 p-12 bg-slate-800 flex-col bg-linear-to-br from-slate-800 via-gray-900 to-indigo-900 justify-between"
            >
                <FluxaLogo size='big' />

                <div className="space-y-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-bold leading-tight text-white"
                    >
                        Track issues,<br />
                        ship features,<br />
                        <span className="text-purple-500">Build faster.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-400 text-lg max-w-md"
                    >
                        The modern issue tracker for teams who want to move fast without breaking things
                    </motion.p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>© 2026 Fluxa</span>
                    <span>•</span>
                    <span>Privacy</span>
                    <span>•</span>
                    <span>Terms</span>
                </div>
            </motion.div>

            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <FluxaLogo size='big' className='lg:hidden mb-8 gap-3' />

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold mb-2 ">
                            { mode === 'login' ? "Welcome back" : "Create your account"}
                        </h1>
                        <p className="text-gray-400">
                            {
                                mode === 'login'
                                ? 'Sign in to continue to your dashboard'
                                : 'Start tracking your progress today'
                            }
                        </p>
                    </div>

                    <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                        {errorMsg && (
                            <p className={`text-center max-w-md ${isError ? 'text-red-500' : 'text-green-500'} font-bold`}>{errorMsg}</p>
                        )}
                        { mode === 'register' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto'}}
                                exit={{ opacity: 0, height: 0}}
                            >
                                <label htmlFor="name">Name</label>
                                <div className="relative mt-1.5">
                                    <lucide.LuUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your name"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <label htmlFor="email">Email</label>
                            <div className="relative mt-1.5">
                                <lucide.LuMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    id='email'
                                    type='email'
                                    placeholder='Enter your email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='pl-10'
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password">Password</label>
                            <div className="relative mt-1.5">
                                <lucide.LuLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                id="password"
                                type={`${showPassword ? 'text' : "password"}`}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                required
                                minLength={6}
                                />
                                {
                                    showPassword 
                                    ? <lucide.LuEyeClosed onClick={() => {setShowPassword(!showPassword)}} className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    : <lucide.LuEye onClick={() => {setShowPassword(!showPassword)}} className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                }
                            </div>
                        </div>

                        {
                            mode === 'login' && (
                                <div className="flex justify-end">
                                    <button type='button' className='text-sm cursor-pointer text-blue-400 hover:underline'>
                                        Forgot password?
                                    </button>
                                </div>
                            )
                        }

                        <button type='submit' className="w-full group flex items-center justify-center gap-3 text-slate-800 bg-blue-400 hover:bg-blue-500 hover:cursor-pointer transition-colors py-2 rounded-xl">
                            { mode === 'login' ? 'Sign in' : 'Create account' }
                            <lucide.LuArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <span className="text-gray-400">
                            { mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button 
                            type='button'
                            onClick={toggleMode}
                            className="text-blue-400 cursor-pointer hover:underline font-medium"
                        >
                            { mode === 'login' ? 'Sign up' : 'Sign In'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}