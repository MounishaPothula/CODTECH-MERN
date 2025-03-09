import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, Share, Users } from 'lucide-react';
import socketService from '../services/socket';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

function DocumentEditor({ user, darkMode }) {
  const [content, setContent] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [cursors, setCursors] = useState(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const quillRef = useRef();
  const isLocalChange = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Join document room
    socketService.joinDocument('shared-doc', user);

    // Set up event listeners
    const documentChangeHandler = (change) => {
      console.log('Document change received:', change);
      if (change.userId !== user.id) {
        isLocalChange.current = true;
        setContent(change.content);
      }
    };

    const documentStateHandler = (state) => {
      console.log('Document state received:', state);
      isLocalChange.current = true;
      setContent(state.content);
      const cursorMap = new Map();
      state.cursors.forEach(cursor => {
        if (cursor.userId !== user.id) {
          cursorMap.set(cursor.userId, cursor);
        }
      });
      setCursors(cursorMap);
    };

    const cursorMoveHandler = (cursor) => {
      if (cursor.userId !== user.id) {
        setCursors(prev => new Map(prev).set(cursor.userId, cursor));
      }
    };

    const userJoinHandler = (joinedUser) => {
      console.log('User joined document:', joinedUser.name);
      setCollaborators((prev) => {
        if (!prev.find(u => u.id === joinedUser.id)) {
          return [...prev, joinedUser];
        }
        return prev;
      });
    };

    const userLeaveHandler = (leftUser) => {
      console.log('User left document:', leftUser.name);
      setCollaborators((prev) => prev.filter(u => u.id !== leftUser.id));
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(leftUser.id);
        return newCursors;
      });
    };

    const usersUpdateHandler = (users) => {
      console.log('Document users update:', users);
      setCollaborators(users);
    };

    // Register event handlers
    socketService.onDocumentChange(documentChangeHandler);
    socketService.onDocumentState(documentStateHandler);
    socketService.onCursorMove(cursorMoveHandler);
    socketService.onUserJoin(userJoinHandler);
    socketService.onUserLeave(userLeaveHandler);
    socketService.onUsersUpdate(usersUpdateHandler);

    return () => {
      // Clean up event handlers
      socketService.onDocumentChange(() => {});
      socketService.onDocumentState(() => {});
      socketService.onCursorMove(() => {});
      socketService.onUserJoin(() => {});
      socketService.onUserLeave(() => {});
      socketService.onUsersUpdate(() => {});
    };
  }, [user]);

  const handleChange = (value) => {
    setContent(value);
    
    // Only broadcast changes if they're from the local user
    if (!isLocalChange.current) {
      console.log('Sending document change:', { content: value });
      socketService.sendDocumentChange({
        content: value,
        userId: user.id
      });
    } else {
      isLocalChange.current = false;
    }
  };

  const handleSelectionChange = (range) => {
    if (range && quillRef.current) {
      const bounds = quillRef.current.getEditor().getBounds(range.index);
      socketService.sendCursorMove({
        position: bounds,
        range: range,
        username: user.name,
        userId: user.id
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate saving to server
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  // Render cursors
  const renderCursors = () => {
    return Array.from(cursors.values()).map(cursor => (
      <div
        key={cursor.userId}
        className="absolute pointer-events-none"
        style={{
          left: cursor.position?.left || 0,
          top: cursor.position?.top || 0,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="flex flex-col items-center">
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-blue-500" />
          <div className="px-2 py-1 text-xs text-white bg-blue-500 rounded-md -mt-1">
            {cursor.username}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Collaborative Document
          </h2>
          {lastSaved && (
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {collaborators.length} online
            </span>
          </div>
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors duration-200"
          >
            <Share className="h-5 w-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`p-2 rounded-lg ${
              isSaving
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
            } transition-colors duration-200`}
          >
            <Save className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex-grow relative">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          onChangeSelection={handleSelectionChange}
          modules={modules}
          className={`h-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}
        />
        {renderCursors()}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className={`flex items-center px-3 py-1 rounded-full ${
              darkMode
                ? 'bg-gray-700 text-gray-200'
                : 'bg-gray-100 text-gray-700'
            } transition-colors duration-200`}
          >
            <div className="w-2 h-2 rounded-full bg-green-400 mr-2" />
            <span className="text-sm">{collaborator.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentEditor; 