import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, Check, PenTool } from 'lucide-react';

interface HandwritingCanvasProps {
    onSave: (blob: Blob) => void;
    onCancel?: () => void;
    width?: number;
    height?: number;
    strokeColor?: string;
    strokeWidth?: number;
    className?: string;
}

export default function HandwritingCanvas({
    onSave,
    onCancel,
    width = 600,
    height = 300,
    strokeColor = '#000000',
    strokeWidth = 3,
    className = ''
}: HandwritingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = (width || rect.width) * dpr;
        canvas.height = (height || rect.height) * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            setContext(ctx);
        }

        // Set display size
        canvas.style.width = `${width || rect.width}px`;
        canvas.style.height = `${height || rect.height}px`;

    }, [width, height, strokeColor, strokeWidth]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        setIsEmpty(false);
        const { x, y } = getCoordinates(e);
        if (context) {
            context.beginPath();
            context.moveTo(x, y);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !context) return;
        const { x, y } = getCoordinates(e);
        context.lineTo(x, y);
        context.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing || !context) return;
        context.closePath();
        setIsDrawing(false);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const clearCanvas = () => {
        if (!context || !canvasRef.current) return;
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setIsEmpty(true);
    };

    const handleSave = () => {
        if (!canvasRef.current || isEmpty) return;
        
        canvasRef.current.toBlob((blob) => {
            if (blob) {
                onSave(blob);
            }
        }, 'image/png');
    };

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden touch-none shadow-inner">
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300">
                        <span className="flex items-center gap-2 text-lg font-medium">
                            <PenTool className="opacity-50" /> Write here
                        </span>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair w-full h-full block"
                />
            </div>
            
            <div className="flex justify-between items-center">
                <button
                    onClick={clearCanvas}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Eraser size={16} /> Clear
                </button>
                
                <div className="flex gap-2">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isEmpty}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Check size={16} /> Recognize
                    </button>
                </div>
            </div>
        </div>
    );
}
