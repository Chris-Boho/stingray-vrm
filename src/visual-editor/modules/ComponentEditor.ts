// Enhanced ComponentEditor with support for all component types
import { 
    VrmComponent,
    IComponentEditor,
    IStateManager,
    CustomWindow 
} from '../../types';

declare const window: CustomWindow;

export class ComponentEditor implements IComponentEditor {
    
    showComponentDetails(component: VrmComponent): void {
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
                <span class="detail-value">${this.getWatchpointDisplay(component.wp)}</span>
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
        
        // Add component-specific details
        html += this.generateComponentSpecificDetails(component);
        
        html += `
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--vscode-panel-border);">
                <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 5px;"><strong>Connection Controls:</strong></div>
                <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">• <kbd>Shift+Click</kbd> another component: Set primary connection</div>
                <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">• <kbd>Shift+Right-click</kbd> another component: Set secondary connection</div>
                <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">• <kbd>Shift+Click</kbd> empty space: Clear primary connection</div>
                <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">• <kbd>Shift+Right-click</kbd> empty space: Clear secondary connection</div>
                <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">• <kbd>Right-click</kbd> this component: Remove connections</div>
            </div>
            <div style="margin-top: 10px;"><small>Double-click component to edit</small></div>
        `;
        
        detailsContent.innerHTML = html;
        detailsPanel.style.display = 'block';
    }

    showMultiSelectionDetails(): void {
        const detailsPanel = document.getElementById('componentDetails');
        const detailsContent = document.getElementById('detailsContent');
        
        if (!detailsPanel || !detailsContent) return;
        
        const stateManager: IStateManager = window.stateManager;
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
    
    showComponentEditor(component: VrmComponent): void {
        // Create modal editor based on component type
        const modal = document.createElement('div');
        modal.className = 'component-editor-modal';
        modal.innerHTML = this.generateEditorModal(component);
        
        document.body.appendChild(modal);
        
        // Store current component for editing
        window.currentEditingComponent = component;
    }

    closeComponentEditor(): void {
        const modal = document.querySelector('.component-editor-modal');
        if (modal) {
            modal.remove();
        }
        window.currentEditingComponent = null;
    }
    
    addParameter(): void {
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
                <option value="CURRENCY">CURRENCY</option>
                <option value="DATETIME">DATETIME</option>
                <option value="FLOAT">FLOAT</option>
                <option value="SECURE">SECURE</option>
            </select>
            <input type="text" placeholder="Value" data-param-index="${paramCount}" data-param-field="value" />
            <button onclick="removeParameter(${paramCount})">Remove</button>
        `;
        container.appendChild(paramRow);
    }
    
    removeParameter(index: number): void {
        const container = document.getElementById('parametersContainer');
        if (!container) return;
        
        const rows = container.querySelectorAll('.parameter-row');
        if (rows[index]) {
            rows[index].remove();
        }
    }

    addCsfParameter(): void {
        const container = document.getElementById('csfParametersContainer');
        if (!container) return;
        
        const paramCount = container.children.length;
        const paramRow = document.createElement('div');
        paramRow.className = 'parameter-row';
        paramRow.innerHTML = `
            <input type="text" placeholder="Label" data-csf-param-index="${paramCount}" data-param-field="label" />
            <textarea placeholder="Value" data-csf-param-index="${paramCount}" data-param-field="value" rows="2"></textarea>
            <button onclick="removeCsfParameter(${paramCount})">Remove</button>
        `;
        container.appendChild(paramRow);
    }
    
    removeCsfParameter(index: number): void {
        const container = document.getElementById('csfParametersContainer');
        if (!container) return;
        
        const rows = container.querySelectorAll('.parameter-row');
        if (rows[index]) {
            rows[index].remove();
        }
    }

    addSetVariable(): void {
        const container = document.getElementById('setVariablesContainer');
        if (!container) return;
        
        const varCount = container.children.length;
        const varRow = document.createElement('div');
        varRow.className = 'parameter-row';
        varRow.innerHTML = `
            <input type="text" placeholder="Variable Name" data-set-var-index="${varCount}" data-var-field="name" />
            <input type="text" placeholder="Variable Value" data-set-var-index="${varCount}" data-var-field="value" />
            <button onclick="removeSetVariable(${varCount})">Remove</button>
        `;
        container.appendChild(varRow);
    }
    
    removeSetVariable(index: number): void {
        const container = document.getElementById('setVariablesContainer');
        if (!container) return;
        
        const rows = container.querySelectorAll('.parameter-row');
        if (rows[index]) {
            rows[index].remove();
        }
    }
    
    saveComponentChanges(componentId: number): void {
        const component = window.currentEditingComponent;
        if (!component) return;
        
        // Update common fields
        this.updateCommonFields(component);
        
        // Update component-specific fields based on type
        this.updateComponentSpecificFields(component);
        
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
                component: component
            });
        }
        
        this.closeComponentEditor();
    }

    // =================================================================
    // PRIVATE HELPER METHODS - Component Details
    // =================================================================

    private generateComponentSpecificDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        switch (component.t) {
            case 'CSF':
                return this.generateCsfDetails(component);
            case 'SQLTRN':
                return this.generateSqlTrnDetails(component);
            case 'MATH':
                return this.generateMathDetails(component);
            case 'TEMPLATE':
                return this.generateTemplateDetails(component);
            case 'INSERTUPDATEQUERY':
            case 'SELECTQUERY':
                return this.generateQueryDetails(component);
            case 'SCRIPT':
                return this.generateScriptDetails(component);
            case 'ERROR':
                return this.generateErrorDetails(component);
            case 'IF':
                return this.generateIfDetails(component);
            case 'SET':
                return this.generateSetDetails(component);
            case 'EXTERNAL':
                return this.generateExternalDetails(component);
            default:
                return this.generateLegacyDetails(component);
        }
    }

    private generateCsfDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Script Function:</span></div>';
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Function: ${component.values.functionName || 'None'}</div>`;
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Return: ${component.values.returnValue || 'None'}</div>`;
        
        if (component.values.functionParams && component.values.functionParams.length > 0) {
            html += '<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Parameters:</div>';
            component.values.functionParams.forEach(param => {
                html += `<div style="margin-left: 25px; font-size: 10px; color: var(--vscode-descriptionForeground);">${param.label}: ${param.value}</div>`;
            });
        }
        
        return html;
    }

    private generateSqlTrnDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">SQL Transaction:</span></div>';
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Name: ${component.values.transactionName || 'None'}</div>`;
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Type: ${component.values.transactionType || 'None'}</div>`;
        
        return html;
    }

    private generateMathDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Math Operation:</span></div>';
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Name: ${component.values.mathName || 'None'}</div>`;
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Format: ${component.values.mathFormat || 'None'}</div>`;
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Parameter: ${component.values.mathParam || 'None'}</div>`;
        
        return html;
    }

    private generateTemplateDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Template:</span></div>';
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Name: ${component.values.templateName || 'None'}</div>`;
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Target: ${component.values.templateTarget || 'None'}</div>`;
        
        return html;
    }

    private generateQueryDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Database Query:</span></div>';
        if (component.values.query) {
            html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Query: ${component.values.query.substring(0, 50)}${component.values.query.length > 50 ? '...' : ''}</div>`;
        } else {
            html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Query: Empty</div>`;
        }
        
        if (component.values.params && component.values.params.length > 0) {
            html += '<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Parameters:</div>';
            component.values.params.forEach(param => {
                html += `<div style="margin-left: 25px; font-size: 10px; color: var(--vscode-descriptionForeground);">${param.name} (${param.type})</div>`;
            });
        }
        
        return html;
    }

    private generateScriptDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Script:</span></div>';
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Language: ${component.values.language || 'None'}</div>`;
        if (component.values.script) {
            html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Script: ${component.values.script.substring(0, 50)}${component.values.script.length > 50 ? '...' : ''}</div>`;
        } else {
            html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Script: Empty</div>`;
        }
        
        return html;
    }

    private generateErrorDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Error:</span></div>';
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Message: ${component.values.errorMessage || 'None'}</div>`;
        
        return html;
    }

    private generateIfDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Condition:</span></div>';
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">${component.values.condition || 'None'}</div>`;
        
        return html;
    }

    private generateSetDetails(component: VrmComponent): string {
        if (!component.values || !component.values.variables) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Variables:</span></div>';
        component.values.variables.forEach(variable => {
            html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">${variable.name}: ${variable.value}</div>`;
        });
        
        return html;
    }

    private generateExternalDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">External Call:</span></div>';
        html += `<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Rule Name: ${component.values.externalValue || 'None'}</div>`;
        
        return html;
    }

    private generateLegacyDetails(component: VrmComponent): string {
        if (!component.values) return '';
        
        let html = '<div class="detail-row"><span class="detail-label">Values:</span></div>';
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
        
        return html;
    }

    private getWatchpointDisplay(wp: boolean | null): string {
        if (wp === null) return 'Not Set';
        return wp ? 'Enabled' : 'Disabled';
    }

    // =================================================================
    // PRIVATE HELPER METHODS - Modal Generation
    // =================================================================

    private generateEditorModal(component: VrmComponent): string {
        const modalHeader = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Component #${component.n} (${component.t}) - ${component.section.toUpperCase()}</h3>
                    <button class="close-btn" onclick="closeComponentEditor()">&times;</button>
                </div>`;

        const modalFooter = `
                <div class="modal-footer">
                    <button onclick="saveComponentChanges(${component.n})">Save Changes</button>
                    <button onclick="closeComponentEditor()">Cancel</button>
                </div>
            </div>`;

        let modalBody = '<div class="modal-body">';
        modalBody += this.generateCommonFields(component);
        modalBody += this.generateComponentSpecificFields(component);
        modalBody += '</div>';

        return modalHeader + modalBody + modalFooter;
    }

    private generateCommonFields(component: VrmComponent): string {
        return `
            <div class="form-group">
                <label>Comment:</label>
                <input type="text" id="editComment" value="${component.c || ''}" />
            </div>
            
            <div class="form-row" style="display: flex; gap: 20px; align-items: flex-end;">
                ${component.wp !== null ? `
                <div class="form-group" style="flex: 1;">
                    <label>
                        <input type="checkbox" id="editWatchpoint" ${component.wp === true ? 'checked' : ''} />
                        Watchpoint
                    </label>
                </div>
                ` : '<div style="flex: 1;"></div>'}
                
                <div class="form-group" style="width: 100px;">
                    <label style="font-size: 0.9em;">Primary ID</label>
                    <input type="number" id="editPrimaryConnection" 
                           value="${component.j && component.j[0] ? component.j[0] : ''}" 
                           placeholder="0" 
                           style="width: 100%;" />
                </div>
                
                <div class="form-group" style="width: 100px;">
                    <label style="font-size: 0.9em;">Secondary ID</label>
                    <input type="number" id="editSecondaryConnection" 
                           value="${component.j && component.j[1] ? component.j[1] : ''}" 
                           placeholder="0"
                           style="width: 100%;" />
                </div>
            </div>
        `;
    }

    private generateComponentSpecificFields(component: VrmComponent): string {
        switch (component.t) {
            case 'CSF':
                return this.generateCsfFields(component);
            case 'SQLTRN':
                return this.generateSqlTrnFields(component);
            case 'MATH':
                return this.generateMathFields(component);
            case 'TEMPLATE':
                return this.generateTemplateFields(component);
            case 'INSERTUPDATEQUERY':
            case 'SELECTQUERY':
                return this.generateQueryFields(component);
            case 'SCRIPT':
                return this.generateScriptFields(component);
            case 'ERROR':
                return this.generateErrorFields(component);
            case 'IF':
                return this.generateIfFields(component);
            case 'SET':
                return this.generateSetFields(component);
            case 'EXTERNAL':
                return this.generateExternalFields(component);
            default:
                return this.generateLegacyFields(component);
        }
    }

    private generateCsfFields(component: VrmComponent): string {
        const values = component.values || {};
        
        let html = `
            <div class="form-group">
                <label>Function Name:</label>
                <input type="text" id="editFunctionName" value="${values.functionName || ''}" />
            </div>
            
            <div class="form-group">
                <label>Return Value:</label>
                <textarea id="editReturnValue" rows="2">${values.returnValue || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Function Parameters:</label>
                <div id="csfParametersContainer">
        `;
        
        if (values.functionParams) {
            values.functionParams.forEach((param, index) => {
                html += `
                    <div class="parameter-row">
                        <input type="text" placeholder="Label" value="${param.label}" data-csf-param-index="${index}" data-param-field="label" />
                        <textarea placeholder="Value" data-csf-param-index="${index}" data-param-field="value" rows="2">${param.value}</textarea>
                        <button onclick="removeCsfParameter(${index})">Remove</button>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
                <button onclick="addCsfParameter()">Add Parameter</button>
            </div>
        `;
        
        return html;
    }

    private generateSqlTrnFields(component: VrmComponent): string {
        const values = component.values || {};
        
        return `
            <div class="form-group">
                <label>Transaction Name:</label>
                <input type="text" id="editTransactionName" value="${values.transactionName || ''}" />
            </div>
            
            <div class="form-group">
                <label>Transaction Type:</label>
                <select id="editTransactionType">
                    <option value="">Select Type</option>
                    <option value="Begin" ${values.transactionType === 'Begin' ? 'selected' : ''}>Begin</option>
                    <option value="Commit" ${values.transactionType === 'Commit' ? 'selected' : ''}>Commit</option>
                    <option value="Rollback" ${values.transactionType === 'Rollback' ? 'selected' : ''}>Rollback</option>
                </select>
            </div>
        `;
    }

    private generateMathFields(component: VrmComponent): string {
        const values = component.values || {};
        
        return `
            <div class="form-group">
                <label>Name:</label>
                <input type="text" id="editMathName" value="${values.mathName || ''}" />
            </div>
            
            <div class="form-group">
                <label>Format:</label>
                <select id="editMathFormat">
                    <option value="">Select Format</option>
                    <option value="INTEGER" ${values.mathFormat === 'INTEGER' ? 'selected' : ''}>INTEGER</option>
                    <option value="LONGDATETIME" ${values.mathFormat === 'LONGDATETIME' ? 'selected' : ''}>LONGDATETIME</option>
                    <option value="LONGDATETIMEAMPM" ${values.mathFormat === 'LONGDATETIMEAMPM' ? 'selected' : ''}>LONGDATETIMEAMPM</option>
                    <option value="SHORTDATE" ${values.mathFormat === 'SHORTDATE' ? 'selected' : ''}>SHORTDATE</option>
                    <option value="ROUND" ${values.mathFormat === 'ROUND' ? 'selected' : ''}>ROUND</option>
                    <option value="FLOAT" ${values.mathFormat === 'FLOAT' ? 'selected' : ''}>FLOAT</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Parameter:</label>
                <input type="text" id="editMathParam" value="${values.mathParam || ''}" />
            </div>
        `;
    }

    private generateTemplateFields(component: VrmComponent): string {
        const values = component.values || {};
        
        return `
            <div class="form-group">
                <label>Template Name:</label>
                <input type="text" id="editTemplateName" value="${values.templateName || ''}" />
            </div>
            
            <div class="form-group">
                <label>Target:</label>
                <input type="text" id="editTemplateTarget" value="${values.templateTarget || ''}" />
            </div>
        `;
    }

    private generateQueryFields(component: VrmComponent): string {
        const values = component.values || {};
        
        let html = `
            <div class="form-group">
                <label>SQL Query:</label>
                <textarea id="editQuery" rows="5">${values.query || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Parameters:</label>
                <div id="parametersContainer">
        `;
        
        if (values.params) {
            values.params.forEach((param, index) => {
                html += `
                    <div class="parameter-row">
                        <input type="text" placeholder="Name" value="${param.name}" data-param-index="${index}" data-param-field="name" />
                        <select data-param-index="${index}" data-param-field="type">
                            <option value="STRING" ${param.type === 'STRING' ? 'selected' : ''}>STRING</option>
                            <option value="INTEGER" ${param.type === 'INTEGER' ? 'selected' : ''}>INTEGER</option>
                            <option value="BOOLEAN" ${param.type === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
                            <option value="CURRENCY" ${param.type === 'CURRENCY' ? 'selected' : ''}>CURRENCY</option>
                            <option value="DATETIME" ${param.type === 'DATETIME' ? 'selected' : ''}>DATETIME</option>
                            <option value="FLOAT" ${param.type === 'FLOAT' ? 'selected' : ''}>FLOAT</option>
                            <option value="SECURE" ${param.type === 'SECURE' ? 'selected' : ''}>SECURE</option>
                        </select>
                        <input type="text" placeholder="Value" value="${param.value}" data-param-index="${index}" data-param-field="value" />
                        <button onclick="removeParameter(${index})">Remove</button>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
                <button onclick="addParameter()">Add Parameter</button>
            </div>
        `;
        
        return html;
    }

    private generateScriptFields(component: VrmComponent): string {
        const values = component.values || {};
        
        return `
            <div class="form-group">
                <label>Language:</label>
                <select id="editScriptLanguage">
                    <option value="">Select Language</option>
                    <option value="Pascal" ${values.language === 'Pascal' ? 'selected' : ''}>Pascal</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Script:</label>
                <textarea id="editScript" rows="10">${values.script || ''}</textarea>
            </div>
        `;
    }

    private generateErrorFields(component: VrmComponent): string {
        const values = component.values || {};
        
        return `
            <div class="form-group">
                <label>Error Message:</label>
                <textarea id="editErrorMessage" rows="3">${values.errorMessage || ''}</textarea>
            </div>
        `;
    }

    private generateIfFields(component: VrmComponent): string {
        const values = component.values || {};
        
        return `
            <div class="form-group">
                <label>Condition:</label>
                <textarea id="editCondition" rows="3">${values.condition || ''}</textarea>
            </div>
        `;
    }

    private generateSetFields(component: VrmComponent): string {
        const values = component.values || {};
        
        let html = `
            <div class="form-group">
                <label>Variables:</label>
                <div id="setVariablesContainer">
        `;
        
        if (values.variables) {
            values.variables.forEach((variable, index) => {
                html += `
                    <div class="parameter-row">
                        <input type="text" placeholder="Variable Name" value="${variable.name}" data-set-var-index="${index}" data-var-field="name" />
                        <input type="text" placeholder="Variable Value" value="${variable.value}" data-set-var-index="${index}" data-var-field="value" />
                        <button onclick="removeSetVariable(${index})">Remove</button>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
                <button onclick="addSetVariable()">Add Variable</button>
            </div>
        `;
        
        return html;
    }

    private generateExternalFields(component: VrmComponent): string {
        const values = component.values || {};
        
        return `
            <div class="form-group">
                <label>Rule Name:</label>
                <input type="text" id="editExternalValue" value="${values.externalValue || ''}" />
            </div>
        `;
    }

    private generateLegacyFields(component: VrmComponent): string {
        const values = component.values || {};
        
        let html = '';
        
        if (values.conditions) {
            html += `
                <div class="form-group">
                    <label>Condition:</label>
                    <textarea id="editCondition" rows="3">${values.conditions[0] || ''}</textarea>
                </div>
            `;
        }
        
        if (values.query !== undefined) {
            html += `
                <div class="form-group">
                    <label>SQL Query:</label>
                    <textarea id="editQuery" rows="5">${values.query || ''}</textarea>
                </div>
            `;
            
            if (values.params) {
                html += `
                    <div class="form-group">
                        <label>Parameters:</label>
                        <div id="parametersContainer">
                `;
                
                values.params.forEach((param: any, index: number) => {
                    html += `
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
                    `;
                });
                
                html += `
                        </div>
                        <button onclick="addParameter()">Add Parameter</button>
                    </div>
                `;
            }
        }
        
        return html;
    }

    // =================================================================
    // PRIVATE HELPER METHODS - Component Updates
    // =================================================================

    private updateCommonFields(component: VrmComponent): void {
        const commentInput = document.getElementById('editComment') as HTMLInputElement;
        const watchpointSelect = document.getElementById('editWatchpoint') as HTMLSelectElement;
        const primaryConnectionInput = document.getElementById('editPrimaryConnection') as HTMLInputElement;
        const secondaryConnectionInput = document.getElementById('editSecondaryConnection') as HTMLInputElement;
        
        // Update comment
        component.c = commentInput?.value || '';
        
        // Update watchpoint
        if (watchpointSelect) {
            const watchpointValue = watchpointSelect.value;
            component.wp = watchpointValue === 'null' ? null : watchpointValue === 'true';
        }
        
        // Update connections
        if (!component.j) {
            component.j = [];
        }
        
        // Ensure j array has at least 2 elements
        while (component.j.length < 2) {
            component.j.push(0);
        }
        
        // Update primary connection
        const primaryValue = primaryConnectionInput?.value ? parseInt(primaryConnectionInput.value) : 0;
        component.j[0] = isNaN(primaryValue) ? 0 : primaryValue;
        
        // Update secondary connection
        const secondaryValue = secondaryConnectionInput?.value ? parseInt(secondaryConnectionInput.value) : 0;
        component.j[1] = isNaN(secondaryValue) ? 0 : secondaryValue;
    }

    private updateComponentSpecificFields(component: VrmComponent): void {
        if (!component.values) {
            component.values = {};
        }
        
        switch (component.t) {
            case 'CSF':
                this.updateCsfFields(component);
                break;
            case 'SQLTRN':
                this.updateSqlTrnFields(component);
                break;
            case 'MATH':
                this.updateMathFields(component);
                break;
            case 'TEMPLATE':
                this.updateTemplateFields(component);
                break;
            case 'INSERTUPDATEQUERY':
            case 'SELECTQUERY':
                this.updateQueryFields(component);
                break;
            case 'SCRIPT':
                this.updateScriptFields(component);
                break;
            case 'ERROR':
                this.updateErrorFields(component);
                break;
            case 'IF':
                this.updateIfFields(component);
                break;
            case 'SET':
                this.updateSetFields(component);
                break;
            case 'EXTERNAL':
                this.updateExternalFields(component);
                break;
            default:
                this.updateLegacyFields(component);
                break;
        }
    }

    private updateCsfFields(component: VrmComponent): void {
        const functionNameInput = document.getElementById('editFunctionName') as HTMLInputElement;
        const returnValueInput = document.getElementById('editReturnValue') as HTMLTextAreaElement;
        
        component.values!.functionName = functionNameInput?.value || '';
        component.values!.returnValue = returnValueInput?.value || '';
        
        // Update function parameters
        const paramInputs = document.querySelectorAll('#csfParametersContainer .parameter-row');
        component.values!.functionParams = Array.from(paramInputs).map(row => {
            const labelInput = row.querySelector('[data-param-field="label"]') as HTMLInputElement;
            const valueInput = row.querySelector('[data-param-field="value"]') as HTMLTextAreaElement;
            
            return {
                label: labelInput?.value || '',
                value: valueInput?.value || ''
            };
        });
    }

    private updateSqlTrnFields(component: VrmComponent): void {
        const nameInput = document.getElementById('editTransactionName') as HTMLInputElement;
        const typeSelect = document.getElementById('editTransactionType') as HTMLSelectElement;
        
        component.values!.transactionName = nameInput?.value || '';
        component.values!.transactionType = typeSelect?.value || '';
    }

    private updateMathFields(component: VrmComponent): void {
        const nameInput = document.getElementById('editMathName') as HTMLInputElement;
        const formatSelect = document.getElementById('editMathFormat') as HTMLSelectElement;
        const paramInput = document.getElementById('editMathParam') as HTMLInputElement;
        
        component.values!.mathName = nameInput?.value || '';
        component.values!.mathFormat = formatSelect?.value || '';
        component.values!.mathParam = paramInput?.value || '';
    }

    private updateTemplateFields(component: VrmComponent): void {
        const nameInput = document.getElementById('editTemplateName') as HTMLInputElement;
        const targetInput = document.getElementById('editTemplateTarget') as HTMLInputElement;
        
        component.values!.templateName = nameInput?.value || '';
        component.values!.templateTarget = targetInput?.value || '';
    }

    private updateQueryFields(component: VrmComponent): void {
        const queryInput = document.getElementById('editQuery') as HTMLTextAreaElement;
        
        component.values!.query = queryInput?.value || '';
        
        // Update parameters
        const paramInputs = document.querySelectorAll('#parametersContainer .parameter-row');
        component.values!.params = Array.from(paramInputs).map(row => {
            const nameInput = row.querySelector('[data-param-field="name"]') as HTMLInputElement;
            const typeSelect = row.querySelector('[data-param-field="type"]') as HTMLSelectElement;
            const valueInput = row.querySelector('[data-param-field="value"]') as HTMLInputElement;
            
            return {
                name: nameInput?.value || '',
                type: typeSelect?.value as any || 'STRING',
                value: valueInput?.value || ''
            };
        });
    }

    private updateScriptFields(component: VrmComponent): void {
        const languageSelect = document.getElementById('editScriptLanguage') as HTMLSelectElement;
        const scriptInput = document.getElementById('editScript') as HTMLTextAreaElement;
        
        component.values!.language = languageSelect?.value || '';
        component.values!.script = scriptInput?.value || '';
    }

    private updateErrorFields(component: VrmComponent): void {
        const errorInput = document.getElementById('editErrorMessage') as HTMLTextAreaElement;
        component.values!.errorMessage = errorInput?.value || '';
    }

    private updateIfFields(component: VrmComponent): void {
        const conditionInput = document.getElementById('editCondition') as HTMLTextAreaElement;
        component.values!.condition = conditionInput?.value || '';
    }

    private updateSetFields(component: VrmComponent): void {
        const varInputs = document.querySelectorAll('#setVariablesContainer .parameter-row');
        component.values!.variables = Array.from(varInputs).map(row => {
            const nameInput = row.querySelector('[data-var-field="name"]') as HTMLInputElement;
            const valueInput = row.querySelector('[data-var-field="value"]') as HTMLInputElement;
            
            return {
                name: nameInput?.value || '',
                value: valueInput?.value || ''
            };
        });
    }

    private updateExternalFields(component: VrmComponent): void {
        const externalInput = document.getElementById('editExternalValue') as HTMLInputElement;
        component.values!.externalValue = externalInput?.value || '';
    }

    private updateLegacyFields(component: VrmComponent): void {
        // Update condition if exists
        const conditionInput = document.getElementById('editCondition') as HTMLTextAreaElement;
        if (conditionInput && component.values!.conditions) {
            component.values!.conditions = [conditionInput.value];
        }
        
        // Update query if exists
        const queryInput = document.getElementById('editQuery') as HTMLTextAreaElement;
        if (queryInput && component.values!.query !== undefined) {
            component.values!.query = queryInput.value;
        }
        
        // Update parameters if they exist
        const paramInputs = document.querySelectorAll('#parametersContainer .parameter-row');
        if (paramInputs.length > 0 && component.values!.params) {
            component.values!.params = Array.from(paramInputs).map(row => {
                const nameInput = row.querySelector('[data-param-field="name"]') as HTMLInputElement;
                const typeSelect = row.querySelector('[data-param-field="type"]') as HTMLSelectElement;
                const valueInput = row.querySelector('[data-param-field="value"]') as HTMLInputElement;
                
                return {
                    name: nameInput?.value || '',
                    type: typeSelect?.value as any || 'STRING',
                    value: valueInput?.value || ''
                };
            });
        }
    }

    // =================================================================
    // STATIC INJECTION METHOD
    // =================================================================

    static inject(): string {
        return `
            window.componentEditor = new (${ComponentEditor.toString()})();
            
            // Make functions globally available
            window.closeComponentEditor = () => window.componentEditor.closeComponentEditor();
            window.addParameter = () => window.componentEditor.addParameter();
            window.removeParameter = (index) => window.componentEditor.removeParameter(index);
            window.addCsfParameter = () => window.componentEditor.addCsfParameter();
            window.removeCsfParameter = (index) => window.componentEditor.removeCsfParameter(index);
            window.addSetVariable = () => window.componentEditor.addSetVariable();
            window.removeSetVariable = (index) => window.componentEditor.removeSetVariable(index);
            window.saveComponentChanges = (componentId) => window.componentEditor.saveComponentChanges(componentId);
        `;
    }
}