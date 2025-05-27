export function getEditorScripts(): string {
	return `
      let currentZoom = 1;
      let activeTab = 'preproc';
      let preprocComponents = [];
      let postprocComponents = [];
      
      // Drag and drop state
      let isDragging = false;
      let dragComponent = null;
      let dragOffset = { x: 0, y: 0 };
      let dragStartPos = { x: 0, y: 0 };
      
      // Multi-select state
      let isSelecting = false;
      let selectionStart = { x: 0, y: 0 };
      let selectionEnd = { x: 0, y: 0 };
      let selectedComponents = new Set();
      let selectionRect = null;
      let justFinishedSelecting = false;
      
      // Multi-drag state
      let isMultiDragging = false;
      let multiDragStartPositions = new Map();
      let multiDragOffset = { x: 0, y: 0 };
      
      // Grid settings
      const GRID_SIZE_X = 32; // Horizontal grid spacing
      const GRID_SIZE_Y = 26; // Vertical grid spacing
      
      function snapToGrid(x, y) {
          return {
              x: Math.round(x / GRID_SIZE_X) * GRID_SIZE_X,
              y: Math.round(y / GRID_SIZE_Y) * GRID_SIZE_Y
          };
      }
      
      function getComponentColor(type) {
          const colors = {
              'IF': '#4CAF50',
              'SELECTQUERY': '#2196F3', 
              'INSERTUPDATEQUERY': '#FF9800',
              'SET': '#9C27B0',
              'TEMPLATE': '#795548',
              'ERROR': '#F44336',
              'EXTERNAL': '#607D8B',
              'CSF': '#3F51B5',
              'SCRIPT': '#FF5722'
          };
          return colors[type] || '#666666';
      }
      
      function switchTab(tabName) {
          // Update tab buttons
          document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
          document.getElementById(tabName + 'Tab').classList.add('active');
          
          // Update section content
          document.querySelectorAll('.section-content').forEach(section => section.classList.remove('active'));
          document.getElementById(tabName + 'Section').classList.add('active');
          
          activeTab = tabName;
          
          // Hide details panel when switching tabs
          document.getElementById('componentDetails').style.display = 'none';
          
          // Clear selection when switching tabs
          clearSelection();
      }
      
      function updateComponentCounts() {
          document.getElementById('preprocCount').textContent = preprocComponents.length;
          document.getElementById('postprocCount').textContent = postprocComponents.length;
      }
      
      function renderComponents(components) {
          console.log('Rendering components:', components.length);
          
          // Separate components by section
          preprocComponents = components.filter(c => c.section === 'preproc');
          postprocComponents = components.filter(c => c.section === 'postproc');
          
          updateComponentCounts();
          
          // Render each section
          renderComponentSection(preprocComponents, 'preprocCanvas');
          renderComponentSection(postprocComponents, 'postprocCanvas');
          
          // Restore selection states after re-rendering
          restoreSelectionStates();
      }
      
      function restoreSelectionStates() {
          // Restore visual selection states after re-rendering
          selectedComponents.forEach(componentKey => {
              const [section, id] = componentKey.split('-');
              const element = document.querySelector(\`[data-component-id="\${id}"][data-section="\${section}"]\`);
              if (element) {
                  element.classList.add('selected');
              }
          });
      }
      
      function renderComponentSection(components, canvasId) {
          const canvas = document.getElementById(canvasId);
          if (!canvas) return;
          
          canvas.innerHTML = '';
          
          // Add arrow marker definition
          const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          defs.innerHTML = \`
              <marker id="arrowhead-\${canvasId}" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#4FC3F7" />
              </marker>
              <marker id="arrowhead-secondary-\${canvasId}" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
              </marker>
          \`;
          canvas.appendChild(defs);
          
          // Render connections first (so they appear behind nodes)
          components.forEach(component => {
              component.j.forEach((targetId, index) => {
                  if (targetId > 0) {
                      const targetComponent = components.find(c => c.n === targetId);
                      if (targetComponent) {
                          renderConnection(component, targetComponent, index === 0, canvasId);
                      }
                  }
              });
          });
          
          // Render components
          components.forEach(component => {
              renderComponent(component, canvasId);
          });
          
          // Add canvas event handlers for selection
          addCanvasEventHandlers(canvas);
      }
      
      function addCanvasEventHandlers(canvas) {
          // Remove existing handlers to avoid duplicates
          if (canvas._vrmMouseDownHandler) {
              canvas.removeEventListener('mousedown', canvas._vrmMouseDownHandler);
          }
          if (canvas._vrmMouseMoveHandler) {
              canvas.removeEventListener('mousemove', canvas._vrmMouseMoveHandler);
          }
          if (canvas._vrmMouseUpHandler) {
              canvas.removeEventListener('mouseup', canvas._vrmMouseUpHandler);
          }
          
          // Create new handlers and store references
          canvas._vrmMouseDownHandler = function(e) {
              if (e.target === canvas) {
                  startSelection(e);
              }
          };
          
          canvas._vrmMouseMoveHandler = function(e) {
              if (isSelecting) {
                  updateSelection(e);
              }
          };
          
          canvas._vrmMouseUpHandler = function(e) {
              if (isSelecting) {
                  endSelection(e);
              }
          };
          
          // Add event listeners
          canvas.addEventListener('mousedown', canvas._vrmMouseDownHandler);
          canvas.addEventListener('mousemove', canvas._vrmMouseMoveHandler);
          canvas.addEventListener('mouseup', canvas._vrmMouseUpHandler);
      }
      
      function startSelection(e) {
          console.log('Starting selection...');
          const canvas = e.target;
          const rect = canvas.getBoundingClientRect();
          
          isSelecting = true;
          selectionStart.x = e.clientX - rect.left;
          selectionStart.y = e.clientY - rect.top;
          selectionEnd.x = selectionStart.x;
          selectionEnd.y = selectionStart.y;
          
          console.log('Selection start:', selectionStart);
          
          // Clear existing selection if not holding Ctrl/Cmd
          if (!e.ctrlKey && !e.metaKey) {
              clearSelection();
          }
          
          // Create selection rectangle
          createSelectionRect(canvas);
          
          // Prevent default to avoid text selection
          e.preventDefault();
          e.stopPropagation();
      }
      
      function updateSelection(e) {
          if (!isSelecting) return;
          
          const canvas = document.getElementById(activeTab + 'Canvas');
          if (!canvas) return;
          
          const rect = canvas.getBoundingClientRect();
          
          selectionEnd.x = e.clientX - rect.left;
          selectionEnd.y = e.clientY - rect.top;
          
          updateSelectionRect();
          highlightComponentsInSelection();
      }
      
      function endSelection(e) {
          if (!isSelecting) return;
          
          console.log('Ending selection...');
          
          isSelecting = false;
          justFinishedSelecting = true;
          
          // Finalize selection BEFORE removing selection rectangle
          finalizeSelection();
          
          // Remove selection rectangle
          if (selectionRect) {
              selectionRect.remove();
              selectionRect = null;
          }
          
          console.log('Selected components after finalization:', selectedComponents);
          
          // Update details panel if components are selected
          if (selectedComponents.size > 0) {
              showMultiSelectionDetails();
          }
          
          // Reset the flag after a short delay to prevent immediate clearing
          setTimeout(() => {
              justFinishedSelecting = false;
          }, 50);
      }
      
      function createSelectionRect(canvas) {
          selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          selectionRect.setAttribute('class', 'selection-rect');
          selectionRect.setAttribute('fill', 'rgba(33, 150, 243, 0.2)');
          selectionRect.setAttribute('stroke', '#2196F3');
          selectionRect.setAttribute('stroke-width', '1');
          selectionRect.setAttribute('stroke-dasharray', '5,5');
          canvas.appendChild(selectionRect);
      }
      
      function updateSelectionRect() {
          if (!selectionRect) return;
          
          const left = Math.min(selectionStart.x, selectionEnd.x);
          const top = Math.min(selectionStart.y, selectionEnd.y);
          const width = Math.abs(selectionEnd.x - selectionStart.x);
          const height = Math.abs(selectionEnd.y - selectionStart.y);
          
          selectionRect.setAttribute('x', left);
          selectionRect.setAttribute('y', top);
          selectionRect.setAttribute('width', width);
          selectionRect.setAttribute('height', height);
      }
      
      function highlightComponentsInSelection() {
          const components = activeTab === 'preproc' ? preprocComponents : postprocComponents;
          const left = Math.min(selectionStart.x, selectionEnd.x);
          const top = Math.min(selectionStart.y, selectionEnd.y);
          const right = Math.max(selectionStart.x, selectionEnd.x);
          const bottom = Math.max(selectionStart.y, selectionEnd.y);
          
          components.forEach(component => {
              const componentInSelection = (
                  component.x >= left &&
                  component.y >= top &&
                  component.x + 30 <= right && // 30 is icon size
                  component.y + 30 <= bottom
              );
              
              const componentElement = document.querySelector(
                  \`[data-component-id="\${component.n}"][data-section="\${component.section}"]\`
              );
              
              if (componentElement) {
                  if (componentInSelection) {
                      componentElement.classList.add('selecting');
                  } else {
                      componentElement.classList.remove('selecting');
                  }
              }
          });
      }
      
      function finalizeSelection() {
          console.log('Finalizing selection...');
          
          // Find all components that are currently being selected
          const selectingElements = document.querySelectorAll('.selecting');
          console.log('Found selecting elements:', selectingElements.length);
          
          selectingElements.forEach(element => {
              const componentId = element.getAttribute('data-component-id');
              const section = element.getAttribute('data-section');
              const componentKey = \`\${section}-\${componentId}\`;
              
              console.log('Adding to selection:', componentKey);
              
              // Add to selection set
              selectedComponents.add(componentKey);
              
              // Update visual state
              element.classList.remove('selecting');
              element.classList.add('selected');
          });
          
          console.log('Selection finalized. Total selected:', selectedComponents.size);
      }
      
      function clearSelection() {
          console.log('Clearing selection...');
          selectedComponents.clear();
          document.querySelectorAll('.component-node').forEach(node => {
              node.classList.remove('selected', 'selecting');
          });
          document.getElementById('componentDetails').style.display = 'none';
      }
      
      function showMultiSelectionDetails() {
          const detailsPanel = document.getElementById('componentDetails');
          const detailsContent = document.getElementById('detailsContent');
          
          const count = selectedComponents.size;
          let html = \`
              <div class="multi-select-info">
                  <strong>\${count} components selected</strong>
              </div>
              <div class="detail-row">
                  <span class="detail-label">Section:</span>
                  <span class="detail-value">\${activeTab.toUpperCase()}</span>
              </div>
          \`;
          
          if (count > 1) {
              html += '<div class="selection-instructions">Drag any selected component to move all selected components together</div>';
          }
          
          detailsContent.innerHTML = html;
          detailsPanel.style.display = 'block';
      }
      
      function renderComponent(component, canvasId) {
          const canvas = document.getElementById(canvasId);
          const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          group.classList.add('component-node');
          group.setAttribute('data-component-id', component.n);
          group.setAttribute('data-section', component.section);
          
          const color = getComponentColor(component.t);
          const iconSize = 30;
          const textOffset = iconSize + 10;
          
          // Component icon
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', component.x);
          rect.setAttribute('y', component.y);
          rect.setAttribute('width', iconSize);
          rect.setAttribute('height', iconSize);
          rect.setAttribute('fill', color);
          rect.classList.add('component-rect');
          
          // Component type text (inside icon)
          const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          typeText.setAttribute('x', component.x + iconSize/2);
          typeText.setAttribute('y', component.y + iconSize/2);
          typeText.classList.add('component-icon-text');
          typeText.textContent = component.t.substring(0, 2);
          
          // Component number and comment
          const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          labelText.setAttribute('x', component.x + textOffset);
          labelText.setAttribute('y', component.y + iconSize/2 + 2);
          labelText.classList.add('component-label');
          
          const commentText = component.c || 'No comment';
          labelText.textContent = \`\${component.n}: \${commentText}\`;
          
          // Watchpoint indicator
          if (component.wp) {
              const watchpoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              watchpoint.setAttribute('cx', component.x + iconSize - 4);
              watchpoint.setAttribute('cy', component.y + 4);
              watchpoint.setAttribute('r', 3);
              watchpoint.classList.add('watchpoint-indicator');
              group.appendChild(watchpoint);
          }
          
          group.appendChild(rect);
          group.appendChild(typeText);
          group.appendChild(labelText);
          
          // Add drag and drop event handlers
          group.addEventListener('mousedown', (e) => {
              if (e.button === 0) { // Left mouse button
                  e.stopPropagation(); // Prevent canvas selection
                  
                  const componentKey = \`\${component.section}-\${component.n}\`;
                  
                  // Handle selection logic
                  if (e.ctrlKey || e.metaKey) {
                      // Toggle selection with Ctrl/Cmd
                      if (selectedComponents.has(componentKey)) {
                          selectedComponents.delete(componentKey);
                          group.classList.remove('selected');
                          console.log('Deselected:', componentKey);
                      } else {
                          selectedComponents.add(componentKey);
                          group.classList.add('selected');
                          console.log('Selected:', componentKey);
                      }
                  } else if (!selectedComponents.has(componentKey)) {
                      // Single select if not already selected
                      clearSelection();
                      selectedComponents.add(componentKey);
                      group.classList.add('selected');
                      console.log('Single selected:', componentKey);
                  }
                  
                  // Start drag operation
                  if (selectedComponents.size > 1) {
                      startMultiDrag(e, component);
                  } else {
                      startDrag(e, component, group);
                  }
              }
          });
          
          // Add click handler for single selection
          group.addEventListener('click', (e) => {
              if (!isDragging && !isMultiDragging) {
                  e.stopPropagation();
                  
                  if (selectedComponents.size === 1) {
                      showComponentDetails(component);
                  } else if (selectedComponents.size > 1) {
                      showMultiSelectionDetails();
                  }
              }
          });
          
          group.addEventListener('dblclick', (e) => {
              if (!isDragging && !isMultiDragging) {
                  e.stopPropagation();
                  showComponentEditor(component);
              }
          });
          
          canvas.appendChild(group);
      }
      
      function startMultiDrag(e, clickedComponent) {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('Starting multi-drag with', selectedComponents.size, 'components');
          console.log('User clicked on component:', clickedComponent);
          
          isMultiDragging = true;
          multiDragStartPositions.clear();
          
          // CRITICAL: Store the clicked component as the reference
          multiDragReferenceComponent = clickedComponent;
          
          const canvas = document.getElementById(clickedComponent.section + 'Canvas');
          const rect = canvas.getBoundingClientRect();
          
          // Store initial positions of all selected components
          const components = clickedComponent.section === 'preproc' ? preprocComponents : postprocComponents;
          selectedComponents.forEach(componentKey => {
              const [section, id] = componentKey.split('-');
              const component = components.find(c => c.n === parseInt(id));
              if (component) {
                  multiDragStartPositions.set(componentKey, { x: component.x, y: component.y });
              }
          });
          
          // Calculate offset from mouse to clicked component
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          multiDragOffset.x = mouseX - clickedComponent.x;
          multiDragOffset.y = mouseY - clickedComponent.y;
          
          // Add visual feedback
          selectedComponents.forEach(componentKey => {
              const [section, id] = componentKey.split('-');
              const element = document.querySelector(\`[data-component-id="\${id}"][data-section="\${section}"]\`);
              if (element) {
                  element.classList.add('dragging');
              }
          });
          
          // Add global mouse handlers
          document.addEventListener('mousemove', (event) => handleMultiDrag(event, clickedComponent));
          document.addEventListener('mouseup', endMultiDrag);
          
          // Hide details panel during drag
          document.getElementById('componentDetails').style.display = 'none';
      }
      
      function handleMultiDrag(e, clickedComponent) {
          if (!isMultiDragging) return;
          
          e.preventDefault();
          
          // Get user selected component to calculate relative movement
          const userSelectedComponentKey = clickedComponent.section + '-' + clickedComponent.n;
          console.log('user selected key: ', userSelectedComponentKey);
          const [section, id] = userSelectedComponentKey.split('-');
          const components = section === 'preproc' ? preprocComponents : postprocComponents;
          
          const canvas = document.getElementById(section + 'Canvas');
          const rect = canvas.getBoundingClientRect();
          
          // Calculate new position for the first component (reference point)
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          let newX = mouseX - multiDragOffset.x;
          let newY = mouseY - multiDragOffset.y;
          
          // Snap to grid
          const snapped = snapToGrid(newX, newY);
          newX = snapped.x;
          newY = snapped.y;
          
          // Calculate movement delta from the first component's start position
          const firstStartPos = multiDragStartPositions.get(userSelectedComponentKey);
          const deltaX = newX - firstStartPos.x;
          const deltaY = newY - firstStartPos.y;
          
          console.log('Multi-drag delta:', deltaX, deltaY);
          
          // Apply movement to all selected components
          selectedComponents.forEach(componentKey => {
              const [compSection, compId] = componentKey.split('-');
              const component = components.find(c => c.n === parseInt(compId));
              const startPosition = multiDragStartPositions.get(componentKey);
              
              if (component && startPosition) {
                  let componentNewX = startPosition.x + deltaX;
                  let componentNewY = startPosition.y + deltaY;
                  
                  // Ensure component stays within canvas bounds
                  const iconSize = 30;
                  const canvasWidth = parseInt(canvas.getAttribute('width'));
                  const canvasHeight = parseInt(canvas.getAttribute('height'));
                  
                  componentNewX = Math.max(0, Math.min(componentNewX, canvasWidth - iconSize));
                  componentNewY = Math.max(0, Math.min(componentNewY, canvasHeight - iconSize));
                  
                  // Update component position in the data
                  component.x = componentNewX;
                  component.y = componentNewY;
                  
                  console.log(\`Updated component \${component.n} to (\${componentNewX}, \${componentNewY})\`);
              }
          });
          
          // Re-render the section to update visuals
          renderComponentSection(components, section + 'Canvas');
          
          // Restore selection states
          selectedComponents.forEach(componentKey => {
              const [compSection, compId] = componentKey.split('-');
              const element = document.querySelector(\`[data-component-id="\${compId}"][data-section="\${compSection}"]\`);
              if (element) {
                  element.classList.add('selected', 'dragging');
              }
          });
      }
      
      function endMultiDrag(e) {
          if (!isMultiDragging) return;
          
          e.preventDefault();
          
          console.log('Ending multi-drag');
          
          // Send updates for all moved components
          selectedComponents.forEach(componentKey => {
              const [section, id] = componentKey.split('-');
              const components = section === 'preproc' ? preprocComponents : postprocComponents;
              const component = components.find(c => c.n === parseInt(id));
              
              if (component) {
                  vscode.postMessage({
                      command: 'updateComponent',
                      component: component
                  });
              }
          });
          
          // Clean up
          document.removeEventListener('mousemove', handleMultiDrag);
          document.removeEventListener('mouseup', endMultiDrag);
          
          // Remove visual feedback but keep selection
          selectedComponents.forEach(componentKey => {
              const [section, id] = componentKey.split('-');
              const element = document.querySelector(\`[data-component-id="\${id}"][data-section="\${section}"]\`);
              if (element) {
                  element.classList.remove('dragging');
                  element.classList.add('selected'); // Ensure it stays selected
              }
          });
          
          isMultiDragging = false;
          multiDragStartPositions.clear();
          multiDragOffset = { x: 0, y: 0 };
      }
      
      function startDrag(e, component, groupElement) {
          e.preventDefault();
          e.stopPropagation();
          
          isDragging = true;
          dragComponent = component;
          
          // Get the SVG canvas for coordinate transformation
          const canvas = document.getElementById(component.section + 'Canvas');
          const rect = canvas.getBoundingClientRect();
          
          // Calculate offset from mouse to component position
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          dragOffset.x = mouseX - component.x;
          dragOffset.y = mouseY - component.y;
          dragStartPos.x = component.x;
          dragStartPos.y = component.y;
          
          // Add visual feedback
          groupElement.classList.add('dragging');
          
          // Add global mouse handlers
          document.addEventListener('mousemove', handleDrag);
          document.addEventListener('mouseup', endDrag);
          
          // Hide details panel during drag
          document.getElementById('componentDetails').style.display = 'none';
      }
      
      function handleDrag(e) {
          if (!isDragging || !dragComponent) return;
          
          e.preventDefault();
          
          const canvas = document.getElementById(dragComponent.section + 'Canvas');
          const rect = canvas.getBoundingClientRect();
          
          // Calculate new position
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          let newX = mouseX - dragOffset.x;
          let newY = mouseY - dragOffset.y;
          
          // Snap to grid with different X and Y spacing
          const snapped = snapToGrid(newX, newY);
          newX = snapped.x;
          newY = snapped.y;
          
          // Ensure component stays within canvas bounds
          const iconSize = 30;
          const canvasWidth = parseInt(canvas.getAttribute('width'));
          const canvasHeight = parseInt(canvas.getAttribute('height'));
          
          newX = Math.max(0, Math.min(newX, canvasWidth - iconSize));
          newY = Math.max(0, Math.min(newY, canvasHeight - iconSize));
          
          // Update component position
          dragComponent.x = newX;
          dragComponent.y = newY;
          
          // Re-render the section to update visuals
          const components = dragComponent.section === 'preproc' ? preprocComponents : postprocComponents;
          renderComponentSection(components, dragComponent.section + 'Canvas');
      }
      
      function endDrag(e) {
          if (!isDragging || !dragComponent) return;
          
          e.preventDefault();
          
          // Check if component actually moved
          const moved = dragComponent.x !== dragStartPos.x || dragComponent.y !== dragStartPos.y;
          
          if (moved) {
              // Send update to extension
              vscode.postMessage({
                  command: 'updateComponent',
                  component: dragComponent
              });
          }
          
          // Clean up
          document.removeEventListener('mousemove', handleDrag);
          document.removeEventListener('mouseup', endDrag);
          
          // Remove visual feedback
          const groupElement = document.querySelector(\`[data-component-id="\${dragComponent.n}"][data-section="\${dragComponent.section}"]\`);
          if (groupElement) {
              groupElement.classList.remove('dragging');
          }
          
          isDragging = false;
          dragComponent = null;
          dragOffset = { x: 0, y: 0 };
          dragStartPos = { x: 0, y: 0 };
      }
      
      function renderConnection(fromComponent, toComponent, isPrimary, canvasId) {
          const canvas = document.getElementById(canvasId);
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          
          const iconSize = 32;
          const handleOffset = 20;
          const verticalBuffer = 15; // Distance for clean vertical entry/exit
          
          // Check for handlebar case (same X axis and close vertically)
          const sameXAxis = fromComponent.x === toComponent.x;
          const verticalDistance = Math.abs(fromComponent.y - toComponent.y);
          const useHandlebars = sameXAxis && verticalDistance <= 30;
          
          let pathData;
          
          if (useHandlebars) {
              // Handlebar routing for vertically aligned close components
              const startX = fromComponent.x;
              const startY = fromComponent.y + iconSize/2;
              const endX = toComponent.x;
              const endY = toComponent.y + iconSize/2;
              const leftOffset = fromComponent.x - handleOffset;
              
              pathData = \`M \${startX} \${startY} L \${leftOffset} \${startY} L \${leftOffset} \${endY} L \${endX} \${endY}\`;
              
          } else {
              // Multi-segment orthogonal routing
              
              // Start and end points (always bottom center to top center)
              const startX = fromComponent.x + iconSize/2;
              const startY = fromComponent.y + iconSize;
              const endX = toComponent.x + iconSize/2;
              const endY = toComponent.y;
              
              // Calculate waypoints for clean orthogonal routing
              const exitY = startY + verticalBuffer;     // Exit point (down from source)
              const entryY = endY - verticalBuffer;      // Entry point (above target)
              const midX = startX + (endX - startX) / 2; // Horizontal midpoint
              
              // Determine routing based on relative positions
              if (startX === endX) {
                  // Same column - simple vertical connection
                  if (endY > startY) {
                      // Target below source - straight down
                      pathData = \`M \${startX} \${startY} L \${startX} \${endY}\`;
                  } else {
                      // Target above source - go around
                      const loopX = startX - 30; // Go left to avoid overlap
                      pathData = \`M \${startX} \${startY} L \${startX} \${exitY} L \${loopX} \${exitY} L \${loopX} \${entryY} L \${endX} \${entryY} L \${endX} \${endY}\`;
                  }
              } else {
                  // Different columns - use waypoints
                  
                  // Check for special case: if component Y distance is 52-56px, use direct horizontal connection
                  const componentVerticalDistance = Math.abs(toComponent.y - fromComponent.y);
                  const isOptimalSpacing = componentVerticalDistance >= 50 && componentVerticalDistance <= 60;
                  
                  
                  if (isOptimalSpacing) {
                      // Direct straight horizontal connection at exit level
                      pathData = \`M \${startX} \${startY} L \${startX} \${exitY} L \${endX} \${exitY} L \${endX} \${endY}\`;
                  } else if (endY > exitY) {
                      // Target is below exit level - standard routing
                      pathData = \`M \${startX} \${startY} L \${startX} \${exitY} L \${midX} \${exitY} L \${midX} \${entryY} L \${endX} \${entryY} L \${endX} \${endY}\`;
                  } else {
                      // Target is above exit level - use horizontal routing at exit level
                      pathData = \`M \${startX} \${startY} L \${startX} \${exitY} L \${midX} \${exitY} L \${midX} \${entryY} L \${endX} \${entryY} L \${endX} \${endY}\`;
                  }
              }
          }
          
          line.setAttribute('d', pathData);
          line.classList.add('connection-line');
          line.classList.add(isPrimary ? 'primary-connection' : 'secondary-connection');
          line.setAttribute('marker-end', 
              isPrimary ? \`url(#arrowhead-\${canvasId})\` : \`url(#arrowhead-secondary-\${canvasId})\`);
          
          canvas.appendChild(line);
      }
      
      function showComponentDetails(component) {
          const detailsPanel = document.getElementById('componentDetails');
          const detailsContent = document.getElementById('detailsContent');
          
          let html = \`
              <div class="detail-row">
                  <span class="detail-label">Section:</span>
                  <span class="detail-value">\${component.section.toUpperCase()}</span>
              </div>
              <div class="detail-row">
                  <span class="detail-label">ID:</span>
                  <span class="detail-value">\${component.n}</span>
              </div>
              <div class="detail-row">
                  <span class="detail-label">Type:</span>
                  <span class="detail-value">\${component.t}</span>
              </div>
              <div class="detail-row">
                  <span class="detail-label">Position:</span>
                  <span class="detail-value">(\${component.x}, \${component.y})</span>
              </div>
              <div class="detail-row">
                  <span class="detail-label">Comment:</span>
                  <span class="detail-value">\${component.c || 'None'}</span>
              </div>
              <div class="detail-row">
                  <span class="detail-label">Watchpoint:</span>
                  <span class="detail-value">\${component.wp ? 'Yes' : 'No'}</span>
              </div>
              <div class="detail-row">
                  <span class="detail-label">Connections:</span>
                  <span class="detail-value">\${component.j.filter(j => j > 0).join(', ') || 'None'}</span>
              </div>
          \`;
          
          if (component.values) {
              html += '<div class="detail-row"><span class="detail-label">Values:</span></div>';
              if (component.values.conditions) {
                  html += \`<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">\${component.values.conditions[0]}</div>\`;
              }
              if (component.values.query) {
                  html += \`<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Query: \${component.values.query.substring(0, 50)}...</div>\`;
              }
              if (component.values.params && component.values.params.length > 0) {
                  html += '<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Parameters:</div>';
                  component.values.params.forEach(param => {
                      html += \`<div style="margin-left: 25px; font-size: 10px; color: var(--vscode-descriptionForeground);">\${param.name} (\${param.type})</div>\`;
                  });
              }
          }
          
          html += '<div style="margin-top: 10px;"><small>Double-click component to edit</small></div>';
          
          detailsContent.innerHTML = html;
          detailsPanel.style.display = 'block';
      }
      
      function showComponentEditor(component) {
          // Create modal editor
          const modal = document.createElement('div');
          modal.className = 'component-editor-modal';
          modal.innerHTML = \`
              <div class="modal-content">
                  <div class="modal-header">
                      <h3>Edit Component #\${component.n} (\${component.t}) - \${component.section.toUpperCase()}</h3>
                      <button class="close-btn" onclick="closeComponentEditor()">&times;</button>
                  </div>
                  <div class="modal-body">
                      <div class="form-group">
                          <label>Comment:</label>
                          <input type="text" id="editComment" value="\${component.c || ''}" />
                      </div>
                      
                      <div class="form-group">
                          <label>Watchpoint:</label>
                          <input type="checkbox" id="editWatchpoint" \${component.wp ? 'checked' : ''} />
                      </div>
                      
                      \${component.values && component.values.conditions ? \`
                          <div class="form-group">
                              <label>Condition:</label>
                              <textarea id="editCondition" rows="3">\${component.values.conditions[0] || ''}</textarea>
                          </div>
                      \` : ''}
                      
                      \${component.values && component.values.query ? \`
                          <div class="form-group">
                              <label>SQL Query:</label>
                              <textarea id="editQuery" rows="5">\${component.values.query || ''}</textarea>
                          </div>
                          
                          <div class="form-group">
                              <label>Parameters:</label>
                              <div id="parametersContainer">
                                  \${component.values.params ? component.values.params.map((param, index) => \`
                                      <div class="parameter-row">
                                          <input type="text" placeholder="Name" value="\${param.name}" data-param-index="\${index}" data-param-field="name" />
                                          <select data-param-index="\${index}" data-param-field="type">
                                              <option value="STRING" \${param.type === 'STRING' ? 'selected' : ''}>STRING</option>
                                              <option value="INTEGER" \${param.type === 'INTEGER' ? 'selected' : ''}>INTEGER</option>
                                              <option value="BOOLEAN" \${param.type === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
                                              <option value="DECIMAL" \${param.type === 'DECIMAL' ? 'selected' : ''}>DECIMAL</option>
                                          </select>
                                          <input type="text" placeholder="Value" value="\${param.value}" data-param-index="\${index}" data-param-field="value" />
                                          <button onclick="removeParameter(\${index})">Remove</button>
                                      </div>
                                  \`).join('') : ''}
                              </div>
                              <button onclick="addParameter()">Add Parameter</button>
                          </div>
                      \` : ''}
                  </div>
                  <div class="modal-footer">
                      <button onclick="saveComponentChanges(\${component.n})">Save Changes</button>
                      <button onclick="closeComponentEditor()">Cancel</button>
                  </div>
              </div>
          \`;
          
          document.body.appendChild(modal);
          
          // Store current component for editing
          window.currentEditingComponent = component;
      }
      
      function closeComponentEditor() {
          const modal = document.querySelector('.component-editor-modal');
          if (modal) {
              modal.remove();
          }
          window.currentEditingComponent = null;
      }
      
      function addParameter() {
          const container = document.getElementById('parametersContainer');
          const paramCount = container.children.length;
          const paramRow = document.createElement('div');
          paramRow.className = 'parameter-row';
          paramRow.innerHTML = \`
              <input type="text" placeholder="Name" data-param-index="\${paramCount}" data-param-field="name" />
              <select data-param-index="\${paramCount}" data-param-field="type">
                  <option value="STRING">STRING</option>
                  <option value="INTEGER">INTEGER</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="DECIMAL">DECIMAL</option>
              </select>
              <input type="text" placeholder="Value" data-param-index="\${paramCount}" data-param-field="value" />
              <button onclick="removeParameter(\${paramCount})">Remove</button>
          \`;
          container.appendChild(paramRow);
      }
      
      function removeParameter(index) {
          const container = document.getElementById('parametersContainer');
          const rows = container.querySelectorAll('.parameter-row');
          if (rows[index]) {
              rows[index].remove();
          }
      }
      
      function saveComponentChanges(componentId) {
          const component = window.currentEditingComponent;
          if (!component) return;
          
          // Gather form data
          const updatedComponent = {
              ...component,
              c: document.getElementById('editComment').value,
              wp: document.getElementById('editWatchpoint').checked
          };
          
          // Update condition if exists
          const conditionInput = document.getElementById('editCondition');
          if (conditionInput && updatedComponent.values) {
              updatedComponent.values.conditions = [conditionInput.value];
          }
          
          // Update query if exists
          const queryInput = document.getElementById('editQuery');
          if (queryInput && updatedComponent.values) {
              updatedComponent.values.query = queryInput.value;
          }
          
          // Update parameters if they exist
          const paramInputs = document.querySelectorAll('#parametersContainer .parameter-row');
          if (paramInputs.length > 0 && updatedComponent.values) {
              updatedComponent.values.params = Array.from(paramInputs).map(row => {
                  const nameInput = row.querySelector('[data-param-field="name"]');
                  const typeSelect = row.querySelector('[data-param-field="type"]');
                  const valueInput = row.querySelector('[data-param-field="value"]');
                  
                  return {
                      name: nameInput.value,
                      type: typeSelect.value,
                      value: valueInput.value
                  };
              });
          }
          
          // Send update to extension
          vscode.postMessage({
              command: 'updateComponent',
              component: updatedComponent
          });
          
          closeComponentEditor();
      }
      
      function zoomIn() {
          currentZoom *= 1.2;
          updateZoom();
      }
      
      function zoomOut() {
          currentZoom /= 1.2;
          updateZoom();
      }
      
      function resetZoom() {
          currentZoom = 1;
          updateZoom();
      }
      
      function updateZoom() {
          const canvases = document.querySelectorAll('.component-canvas');
          canvases.forEach(canvas => {
              canvas.style.transform = \`scale(\${currentZoom})\`;
              canvas.style.transformOrigin = '0 0';
          });
      }
      
      // Prevent default drag behavior on canvas
      document.addEventListener('DOMContentLoaded', function() {
          console.log('DOM Content Loaded - setting up VRM editor');
          
          const canvases = document.querySelectorAll('.component-canvas');
          canvases.forEach(canvas => {
              canvas.addEventListener('dragstart', (e) => e.preventDefault());
              canvas.addEventListener('selectstart', (e) => e.preventDefault());
          });
          
          // Add keyboard shortcuts
          if (!document._vrmKeyboardHandlerAdded) {
              document.addEventListener('keydown', handleKeyDown);
              document._vrmKeyboardHandlerAdded = true;
              console.log('Keyboard handlers attached');
          }
      });
      
      function handleKeyDown(e) {
          console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
          
          // Delete key - delete selected components
          if (e.key === 'Delete' && selectedComponents.size > 0) {
              e.preventDefault();
              // TODO: Implement component deletion
              console.log('Delete selected components:', selectedComponents);
          }
          
          // Escape key - clear selection
          if (e.key === 'Escape') {
              e.preventDefault();
              clearSelection();
              console.log('Selection cleared');
          }
          
          // Ctrl+A - select all components in current tab
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
              e.preventDefault();
              console.log('Ctrl+A pressed, selecting all');
              selectAllComponents();
          }
      }
      
      function selectAllComponents() {
          console.log('Select all components triggered');
          clearSelection();
          const components = activeTab === 'preproc' ? preprocComponents : postprocComponents;
          
          console.log('Components to select:', components.length);
          
          components.forEach(component => {
              const componentKey = \`\${component.section}-\${component.n}\`;
              selectedComponents.add(componentKey);
              
              const element = document.querySelector(\`[data-component-id="\${component.n}"][data-section="\${component.section}"]\`);
              if (element) {
                  element.classList.add('selected');
                  console.log('Selected component:', componentKey);
              }
          });
          
          console.log('Total selected:', selectedComponents.size);
          
          if (selectedComponents.size > 0) {
              showMultiSelectionDetails();
          }
      }
      
      // Close details panel when clicking outside
      document.addEventListener('click', (e) => {
          // Don't clear selection if we just finished a box selection
          if (justFinishedSelecting) {
              return;
          }
          
          if (!e.target.closest('.component-details') && 
              !e.target.closest('.component-node') && 
              !e.target.closest('.selection-rect')) {
              
              // Only clear selection if not currently selecting
              if (!isSelecting) {
                  clearSelection();
              }
          }
      });
  `;
}