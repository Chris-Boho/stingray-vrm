// src/react-app/components/VrmEditor.tsx
import React, { useState, useEffect } from 'react';
import { VscodeMessage } from '../types';

interface VrmEditorProps {
    initialComponents?: any[];
}

export const VrmEditor: React.FC<VrmEditorProps> = ({ initialComponents = [] }) => {
    const [components, setComponents] = useState(initialComponents);

    useEffect(() => {
        // Handle messages from the extension
        const handleMessage = (event: MessageEvent<VscodeMessage>) => {
            const message = event.data;
            switch (message.type) {
                case 'updateComponents':
                    setComponents(message.components);
                    break;
                // Add other message types as needed
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Send message back to the extension
    const postMessage = (message: VscodeMessage) => {
        if (window.vscode) {
            window.vscode.postMessage(message);
        }
    };

    return (
        <div className="vrm-editor">
            <h1>VRM Editor</h1>
            {/* Add your React components here */}
            <div className="components-list">
                {components.map(component => (
                    <div key={component.id} className="component">
                        {component.name}
                    </div>
                ))}
            </div>
        </div>
    );
};