import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { setToken } from '../lib/api.js'
import { FaHome, FaUsers, FaComments, FaUser, FaSignOutAlt, FaMoon, FaSun, FaBars, FaTimes } from 'react-icons/fa'
import { FiUsers } from 'react-icons/fi';

export default function Header({ theme, setTheme, me, myProf, setMe }) {
    const [openMenu, setOpenMenu] = useState(false)
    const [mobileNav, setMobileNav] = useState(false)
    const menuRef = useRef(null)
    const navigate = useNavigate()

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="navbar">
            <img src="/logo/sally.jpg" alt="Sally" className="logo" />
            <div className="brand">Sally</div>

            {/* Desktop nav */}
            <nav className="links desktop-nav">
                <NavLink to="/" end><FaHome /> Feed</NavLink>
                <NavLink to="/circles"><FaUsers /> Circles</NavLink>
                <NavLink to="/communities"><FiUsers /> Communities</NavLink>
                <NavLink to="/chat"><FaComments /> Chat</NavLink>
                <NavLink to="/friends"><FaUsers /> Friends</NavLink>
            </nav>

            {/* Mobile nav */}
            {mobileNav && (
                <nav className="mobile-nav">
                    <NavLink className='!pl-2' to="/" end onClick={() => setMobileNav(false)}><FaHome /> Feed</NavLink>
                    <NavLink className='!pl-2' to="/circles" onClick={() => setMobileNav(false)}><FaUsers /> Circles</NavLink>
                    <NavLink className='!pl-2' to="/communities" onClick={() => setMobileNav(false)}><FiUsers /> Communities</NavLink>
                    <NavLink className='!pl-2' to="/chat" onClick={() => setMobileNav(false)}><FaComments /> Chat</NavLink>
                    <NavLink className='!pl-2' to="/friends" onClick={() => setMobileNav(false)}><FaUsers /> Friends</NavLink>
                </nav>
            )}

            <div className="spacer" />

            {/* Theme toggle */}
            <button
                className="icon-btn"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
                {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            {/* Profile dropdown */}
            {me && myProf && (
                <div className="profile-menu" ref={menuRef}>
                    <button
                        className="profile-btn"
                        onClick={() => setOpenMenu(!openMenu)}
                    >
                        <img
                            src={myProf.avatar_url || '/user.png'}
                            alt="Profile"
                            className="avatar"
                        />
                    </button>

                    {openMenu && (
                        <div className="dropdown">
                            <div className="dropdown-header">
                                <img
                                    src={myProf.avatar_url || '/user.png'}
                                    alt="Profile"
                                    className="avatar large"
                                />
                                <div className="user-info">
                                    <strong>{myProf.display_name || myProf.username}</strong>
                                    <span>@{myProf.handle || myProf.username}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setOpenMenu(false)
                                    navigate('/profile')
                                }}
                            >
                                <FaUser /> Profile
                            </button>
                            <button
                                className="logout-btn"
                                onClick={() => {
                                    setToken('')
                                    setMe(null)
                                    setOpenMenu(false)
                                }}
                            >
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile hamburger */}
            <button
                className="hamburger"
                onClick={() => setMobileNav(!mobileNav)}
            >
                {mobileNav ? <FaTimes /> : <FaBars />}
            </button>
        </header>
    )
}
