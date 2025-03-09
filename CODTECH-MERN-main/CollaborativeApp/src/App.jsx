import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import DocumentEditor from './components/DocumentEditor';
import Whiteboard from './components/Whiteboard';
import Chat from './components/Chat';
import socketService from './services/socket';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeComponent, setActiveComponent] = useState('document'); // 'document', 'whiteboard', or 'chat'

  useEffect(() => {
    // Check for saved preferences
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);

    // Check for saved auth
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const initSocket = async () => {
        try {
          await socketService.connect();
          setIsConnected(true);
          console.log('Socket connected successfully');
        } catch (error) {
          console.error('Socket connection failed:', error);
          setIsConnected(false);
        }
      };

      initSocket();

      // Set up connection state change handler
      socketService.onConnectionStateChange(({ connected }) => {
        setIsConnected(connected);
      });

      // Set up error handler
      socketService.onError((error) => {
        console.error('Socket error:', error);
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Login</h2>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Join Collaboration
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-64 bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out z-30`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Collaboration App</h2>
            </div>
            <nav className="flex-1 p-4">
              <button
                onClick={() => setActiveComponent('document')}
                className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
                  activeComponent === 'document'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Document Editor
              </button>
              <button
                onClick={() => setActiveComponent('whiteboard')}
                className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
                  activeComponent === 'whiteboard'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Whiteboard
              </button>
              <button
                onClick={() => setActiveComponent('chat')}
                className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
                  activeComponent === 'chat'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Chat
              </button>
            </nav>
            <div className="p-4 border-t dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : ''} transition-margin duration-300 ease-in-out`}>
          {/* Navbar */}
          <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="p-6 h-[calc(100vh-4rem)]">
            {activeComponent === 'document' && (
              <DocumentEditor user={user} darkMode={darkMode} />
            )}
            {activeComponent === 'whiteboard' && (
              <Whiteboard user={user} darkMode={darkMode} />
            )}
            {activeComponent === 'chat' && (
              <Chat user={user} darkMode={darkMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;