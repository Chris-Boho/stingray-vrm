// Type definitions for proper typing
interface CustomWindow extends Window {
    stateManager: any;
    componentEditor: ComponentEditor;
    vscode?: any;
    acquireVsCodeApi?: () => any;
    currentEditingComponent?: any;
    closeComponentEditor?: () => void;
    addParameter?: () => void;
    removeParameter?: (index: number) => void;
    saveComponentChanges?: (componentId: number) => void;
}

declare const window: CustomWindow;

export class ComponentEditor {
    
    public showComponentDetails(component: any): void {
        const detailsPanel = document.getElementById('componentDetails');
        const detailsContent = document.getElementById('detailsContent');
        
        if (!detailsPanel || !detailsContent) return;
        
        let html = `
            <div class="detail-row">
                <span class="detail-label">Section:</span>
                <span class="detail-value">${component.section.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${component.n}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${component.t}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">(${component.x}, ${component.y})</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Comment:</span>
                <span class="detail-value">${component.c || 'None'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Watchpoint:</span>
                <span class="detail-value">${component.wp ? 'Yes' : 'No'}</span>
            </div>
        `;
        
        // Enhanced connection display
        const primaryConnection = component.j && component.j[0] ? component.j[0] : 'None';
        const secondaryConnection = component.j && component.j[1] ? component.j[1] : 'None';
        
        html += `
            <div class="detail-row">
                <span class="detail-label">Primary Connection:</span>
                <span class="detail-value" style="color: #4FC3F7;">${primaryConnection}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Secondary Connection:</span>
                <span class="detail-value" style="color: #666;">${secondaryConnection}</span>
            </div>
        `;
        
        if (component.values) {
            html += '<div class="detail-row"><span class="detail-label">Values:</span></div>';
            if (component.values.conditions) {
                html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">${component.values.conditions[0]}</div>`;
            }
            if (component.values.query) {
                html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Query: ${component.values.query.substring(0, 50)}...</div>`;
            }
            if (component.values.params && component.values.params.length > 0) {
                html += '<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Parameters:</div>';
                component.values.params.forEach((param: any) => {
                    html += `<div style="margin-left: 25px; font-size: 10px; color: var(--vscode-descriptionForeground);">${param.name} (${param.type})</div>`;
                });
            }
        }
        
        html += `
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--vscode-panel-border);">
                <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 5px;"><strong>Connection Controls:</strong></div>
                <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">• <kbd>Shift+Click</kbd> another component: Set primary connection</div>
                <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">• <kbd>Shift+Right-click</kbd> another component: Set secondary connection</div>
                <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">• <kbd>Right-click</kbd> this component: Remove connections</div>
            </div>
            <div style="margin-top: 10px;"><small>Double-click component to edit</small></div>
        `;
        
        detailsContent.innerHTML = html;
        detailsPanel.style.display = 'block';
    }

    public showMultiSelectionDetails(): void {
        const detailsPanel = document.getElementById('componentDetails');
        const detailsContent = document.getElementById('detailsContent');
        
        if (!detailsPanel || !detailsContent) return;
        
        const stateManager = window.stateManager;
        const count = stateManager.getSelectedComponents().size;
        let html = `
            <div class="multi-select-info">
                <strong>${count} components selected</strong>
            </div>
            <div class="detail-row">
                <span class="detail-label">Section:</span>
                <span class="detail-value">${stateManager.getActiveTab().toUpperCase()}</span>
            </div>
        `;
        
        if (count > 1) {
            html += '<div class="selection-instructions">Drag any selected component to move all selected components together</div>';
        }
        
        detailsContent.innerHTML = html;
        detailsPanel.style.display = 'block';
    }
    
    public showComponentEditor(component: any): void {
        // Create modal editor
        const modal = document.createElement('div');
        modal.className = 'component-editor-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Component #${component.n} (${component.t}) - ${component.section.toUpperCase()}</h3>
                    <button class="close-btn" onclick="closeComponentEditor()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Comment:</label>
                        <input type="text" id="editComment" value="${component.c || ''}" />
                    </div>
                    
                    <div class="form-group">
                        <label>Watchpoint:</label>
                        <input type="checkbox" id="editWatchpoint" ${component.wp ? 'checked' : ''} />
                    </div>
                    
                    <div class="form-group">
                        <label>Primary Connection:</label>
                        <input type="number" id="editPrimaryConnection" value="${component.j && component.j[0] ? component.j[0] : ''}" placeholder="Component ID (0 for none)" />
                    </div>
                    
                    <div class="form-group">
                        <label>Secondary Connection:</label>
                        <input type="number" id="editSecondaryConnection" value="${component.j && component.j[1] ? component.j[1] : ''}" placeholder="Component ID (0 for none)" />
                    </div>
                    
                    ${component.values && component.values.conditions ? `
                        <div class="form-group">
                            <label>Condition:</label>
                            <textarea id="editCondition" rows="3">${component.values.conditions[0] || ''}</textarea>
                        </div>
                    ` : ''}
                    
                    ${component.values && component.values.query ? `
                        <div class="form-group">
                            <label>SQL Query:</label>
                            <textarea id="editQuery" rows="5">${component.values.query || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Parameters:</label>
                            <div id="parametersContainer">
                                ${component.values.params ? component.values.params.map((param: any, index: number) => `
                                    <div class="parameter-row">
                                        <input type="text" placeholder="Name" value="${param.name}" data-param-index="${index}" data-param-field="name" />
                                        <select data-param-index="${index}" data-param-field="type">
                                            <option value="STRING" ${param.type === 'STRING' ? 'selected' : ''}>STRING</option>
                                            <option value="INTEGER" ${param.type === 'INTEGER' ? 'selected' : ''}>INTEGER</option>
                                            <option value="BOOLEAN" ${param.type === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
                                            <option value="DECIMAL" ${param.type === 'DECIMAL' ? 'selected' : ''}>DECIMAL</option>
                                        </select>
                                        <input type="text" placeholder="Value" value="${param.value}" data-param-index="${index}" data-param-field="value" />
                                        <button onclick="removeParameter(${index})">Remove</button>
                                    </div>
                                `).join('') : ''}
                            </div>
                            <button onclick="addParameter()">Add Parameter</button>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button onclick="saveComponentChanges(${component.n})">Save Changes</button>
                    <button onclick="closeComponentEditor()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store current component for editing
        window.currentEditingComponent = component;
    }
    
    public closeComponentEditor(): void {
        const modal = document.querySelector('.component-editor-modal');
        if (modal) {
            modal.remove();
        }
        window.currentEditingComponent = null;
    }
    
    public addParameter(): void {
        const container = document.getElementById('parametersContainer');
        if (!container) return;
        
        const paramCount = container.children.length;
        const paramRow = document.createElement('div');
        paramRow.className = 'parameter-row';
        paramRow.innerHTML = `
            <input type="text" placeholder="Name" data-param-index="${paramCount}" data-param-field="name" />
            <select data-param-index="${paramCount}" data-param-field="type">
                <option value="STRING">STRING</option>
                <option value="INTEGER">INTEGER</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="DECIMAL">DECIMAL</option>
            </select>
            <input type="text" placeholder="Value" data-param-index="${paramCount}" data-param-field="value" />
            <button onclick="removeParameter(${paramCount})">Remove</button>
        `;
        container.appendChild(paramRow);
    }
    
    public removeParameter(index: number): void {
        const container = document.getElementById('parametersContainer');
        if (!container) return;
        
        const rows = container.querySelectorAll('.parameter-row');
        if (rows[index]) {
            rows[index].remove();
        }
    }
    
    public saveComponentChanges(componentId: number): void {
        const component = window.currentEditingComponent;
        if (!component) return;
        
        const commentInput = document.getElementById('editComment') as HTMLInputElement;
        const watchpointInput = document.getElementById('editWatchpoint') as HTMLInputElement;
        const primaryConnectionInput = document.getElementById('editPrimaryConnection') as HTMLInputElement;
        const secondaryConnectionInput = document.getElementById('editSecondaryConnection') as HTMLInputElement;
        
        // Gather form data
        const updatedComponent = {
            ...component,
            c: commentInput?.value || '',
            wp: watchpointInput?.checked || false
        };
        
        // Update connections
        if (!updatedComponent.j) {
            updatedComponent.j = [];
        }
        
        // Ensure j array has at least 2 elements
        while (updatedComponent.j.length < 2) {
            updatedComponent.j.push(0);
        }
        
        // Update primary connection
        const primaryValue = primaryConnectionInput?.value ? parseInt(primaryConnectionInput.value) : 0;
        updatedComponent.j[0] = isNaN(primaryValue) ? 0 : primaryValue;
        
        // Update secondary connection
        const secondaryValue = secondaryConnectionInput?.value ? parseInt(secondaryConnectionInput.value) : 0;
        updatedComponent.j[1] = isNaN(secondaryValue) ? 0 : secondaryValue;
        
        // Update condition if exists
        const conditionInput = document.getElementById('editCondition') as HTMLTextAreaElement;
        if (conditionInput && updatedComponent.values) {
            updatedComponent.values.conditions = [conditionInput.value];
        }
        
        // Update query if exists
        const queryInput = document.getElementById('editQuery') as HTMLTextAreaElement;
        if (queryInput && updatedComponent.values) {
            updatedComponent.values.query = queryInput.value;
        }
        
        // Update parameters if they exist
        const paramInputs = document.querySelectorAll('#parametersContainer .parameter-row');
        if (paramInputs.length > 0 && updatedComponent.values) {
            updatedComponent.values.params = Array.from(paramInputs).map(row => {
                const nameInput = row.querySelector('[data-param-field="name"]') as HTMLInputElement;
                const typeSelect = row.querySelector('[data-param-field="type"]') as HTMLSelectElement;
                const valueInput = row.querySelector('[data-param-field="value"]') as HTMLInputElement;
                
                return {
                    name: nameInput?.value || '',
                    type: typeSelect?.value || 'STRING',
                    value: valueInput?.value || ''
                };
            });
        }
        
        // Send update to extension
        let vscode = window.vscode;
        if (!vscode && window.acquireVsCodeApi) {
            try {
                vscode = window.acquireVsCodeApi();
                window.vscode = vscode;
            } catch (error) {
                console.warn('VS Code API already acquired, using existing instance');
                vscode = window.vscode;
            }
        }
        
        if (vscode && vscode.postMessage) {
            vscode.postMessage({
                command: 'updateComponent',
                component: updatedComponent
            });
        }
        
        this.closeComponentEditor();
    }
    
    public static inject(): string {
        return `
            window.componentEditor = new (${ComponentEditor.toString()})();
            
            // Make functions globally available
            window.closeComponentEditor = () => window.componentEditor.closeComponentEditor();
            window.addParameter = () => window.componentEditor.addParameter();
            window.removeParameter = (index) => window.componentEditor.removeParameter(index);
            window.saveComponentChanges = (componentId) => window.componentEditor.saveComponentChanges(componentId);
        `;
    }
}