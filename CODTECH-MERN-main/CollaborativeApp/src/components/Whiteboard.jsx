import React, { useState, useRef, useEffect } from 'react';
import { Download, Share, Users, Trash2 } from 'lucide-react';
import socketService from '../services/socket';

function Whiteboard({ user, darkMode }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(2);
  const [collaborators, setCollaborators] = useState([]);
  const lastPoint = useRef(null);
  const otherUsersStrokes = useRef(new Map());

  useEffect(() => {
    if (!user) return;

    // Join whiteboard room
    socketService.joinWhiteboard('shared-board', user);

    // Set up event listeners
    const whiteboardStateHandler = (state) => {
      console.log('Whiteboard state received:', state);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw completed strokes
      state.strokes.forEach(stroke => {
        drawStroke(ctx, stroke);
      });
      
      // Set up current strokes
      otherUsersStrokes.current = new Map(
        state.currentStrokes.map(stroke => [stroke.userId, stroke])
      );
    };

    const drawingStartHandler = (data) => {
      console.log('Drawing start received:', data);
      if (data.userId !== user.id) {
        otherUsersStrokes.current.set(data.userId, {
          userId: data.userId,
          username: data.username,
          points: [data]
        });
      }
    };

    const drawingMoveHandler = (data) => {
      if (data.userId !== user.id) {
        const stroke = otherUsersStrokes.current.get(data.userId);
        if (stroke) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          const lastPoint = stroke.points[stroke.points.length - 1];
          
          drawLine(ctx, {
            x0: lastPoint.x,
            y0: lastPoint.y,
            x1: data.x,
            y1: data.y,
            tool: data.tool,
            color: data.color,
            size: data.size
          });
          
          stroke.points.push(data);
        }
      }
    };

    const drawingEndHandler = (data) => {
      console.log('Drawing end received:', data);
      if (data.userId !== user.id) {
        otherUsersStrokes.current.delete(data.userId);
      }
    };

    const clearCanvasHandler = () => {
      console.log('Clear canvas received');
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      otherUsersStrokes.current.clear();
    };

    const userJoinHandler = (joinedUser) => {
      console.log('User joined whiteboard:', joinedUser.name);
      setCollaborators((prev) => {
        if (!prev.find(u => u.id === joinedUser.id)) {
          return [...prev, joinedUser];
        }
        return prev;
      });
    };

    const userLeaveHandler = (leftUser) => {
      console.log('User left whiteboard:', leftUser.name);
      setCollaborators((prev) => prev.filter(u => u.id !== leftUser.id));
      otherUsersStrokes.current.delete(leftUser.id);
    };

    const usersUpdateHandler = (users) => {
      console.log('Whiteboard users update:', users);
      setCollaborators(users);
    };

    // Register event handlers
    socketService.onWhiteboardState(whiteboardStateHandler);
    socketService.onDrawingStart(drawingStartHandler);
    socketService.onDrawingMove(drawingMoveHandler);
    socketService.onDrawingEnd(drawingEndHandler);
    socketService.onClearCanvas(clearCanvasHandler);
    socketService.onUserJoin(userJoinHandler);
    socketService.onUserLeave(userLeaveHandler);
    socketService.onUsersUpdate(usersUpdateHandler);

    // Set up canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Handle resize
    const handleResize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      // Clean up event handlers
      socketService.onWhiteboardState(() => {});
      socketService.onDrawingStart(() => {});
      socketService.onDrawingMove(() => {});
      socketService.onDrawingEnd(() => {});
      socketService.onClearCanvas(() => {});
      socketService.onUserJoin(() => {});
      socketService.onUserLeave(() => {});
      socketService.onUsersUpdate(() => {});
      window.removeEventListener('resize', handleResize);
    };
  }, [user]);

  const drawLine = (ctx, { x0, y0, x1, y1, tool, color, size }) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const drawStroke = (ctx, stroke) => {
    const points = stroke.points;
    if (points.length < 2) return;

    for (let i = 1; i < points.length; i++) {
      drawLine(ctx, {
        x0: points[i - 1].x,
        y0: points[i - 1].y,
        x1: points[i].x,
        y1: points[i].y,
        tool: points[i].tool,
        color: points[i].color,
        size: points[i].size
      });
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    lastPoint.current = { x, y };

    const drawData = {
      x,
      y,
      tool,
      color,
      size
    };

    console.log('Starting drawing:', drawData);
    socketService.sendDrawingStart(drawData);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
    console.log('Stopping drawing');
    socketService.sendDrawingEnd();
  };

  const handleDrawing = (e) => {
    if (!isDrawing || !lastPoint.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');

    drawLine(ctx, {
      x0: lastPoint.current.x,
      y0: lastPoint.current.y,
      x1: x,
      y1: y,
      tool,
      color,
      size
    });

    const drawData = {
      x,
      y,
      tool,
      color,
      size
    };

    socketService.sendDrawingMove(drawData);
    lastPoint.current = { x, y };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Clearing canvas');
    socketService.sendClearCanvas();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const tools = [
    { name: 'pen', label: 'Pen' },
    { name: 'eraser', label: 'Eraser' },
  ];

  const sizes = [2, 4, 6, 8, 10];
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Collaborative Whiteboard
          </h2>
          <div className="flex items-center space-x-2">
            <Users className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {collaborators.length} online
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors duration-200"
          >
            <Share className="h-5 w-5" />
          </button>
          <button
            onClick={downloadCanvas}
            className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 transition-colors duration-200"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors duration-200"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          {tools.map((t) => (
            <button
              key={t.name}
              onClick={() => setTool(t.name)}
              className={`px-3 py-1 rounded ${
                tool === t.name
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              } transition-colors duration-200`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                size === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              } transition-colors duration-200`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full ${
                color === c ? 'ring-2 ring-primary-500 ring-offset-2' : ''
              } transition-all duration-200`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex-grow relative">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full rounded-lg cursor-crosshair ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={handleDrawing}
        />
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

export default Whiteboard; 