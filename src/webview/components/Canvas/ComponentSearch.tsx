import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { VrmComponent } from '../../types/vrm';

interface ComponentSearchProps {
	isOpen: boolean;
	onClose: () => void;
	onHighlightComponents?: (uniqueComponentIds: string[]) => void;
	onScrollToComponent?: (componentId: number) => void;
	onSwitchSection?: (section: 'preproc' | 'postproc') => void;
}

interface SearchMatch {
	componentId: number;
	matchType: 'comment' | 'values';
	matchField?: string;
	matchText: string;
	section: 'preproc' | 'postproc';
}

interface GroupedMatch {
	componentId: number;
	matches: SearchMatch[];
	section: 'preproc' | 'postproc';
}

export const ComponentSearch: React.FC<ComponentSearchProps> = ({ 
	isOpen, 
	onClose, 
	onHighlightComponents,
	onScrollToComponent,
	onSwitchSection 
}) => {
	const [query, setQuery] = useState('');
	const [matches, setMatches] = useState<SearchMatch[]>([]);
	const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
	const [isSearching, setIsSearching] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const { document } = useDocumentStore();
	const { activeSection } = useEditorStore();

	// Group matches by component ID and section
	const groupMatchesByComponent = useCallback((matches: SearchMatch[]): GroupedMatch[] => {
		const grouped = matches.reduce((acc, match) => {
			const existing = acc.find((group) => group.componentId === match.componentId && group.section === match.section);
			if (existing) {
				existing.matches.push(match);
			} else {
				acc.push({
					componentId: match.componentId,
					matches: [match],
					section: match.section
				});
			}
			return acc;
		}, [] as GroupedMatch[]);

		// Sort groups by section first, then by component ID
		return grouped.sort((a, b) => {
			if (a.section !== b.section) {
				return a.section === 'preproc' ? -1 : 1;
			}
			return a.componentId - b.componentId;
		});
	}, []);

	// Get grouped matches
	const groupedMatches = groupMatchesByComponent(matches);

	// Focus input when search opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isOpen]);

	// Search function
	const performSearch = useCallback(
		(searchQuery: string) => {
			if (!document || !searchQuery.trim()) {
				setMatches([]);
				setCurrentMatchIndex(0);
				// Clear highlights when no search query
				if (onHighlightComponents) {
					onHighlightComponents([]);
				}
				return;
			}

			setIsSearching(true);
			const searchMatches: SearchMatch[] = [];
			const searchTerm = searchQuery.toLowerCase().trim();

			// Search in both sections
			const searchInSection = (components: VrmComponent[], section: 'preproc' | 'postproc') => {
				components.forEach((component: VrmComponent) => {
					// Search in comment field
					if (component.c && component.c.toLowerCase().includes(searchTerm)) {
						searchMatches.push({
							componentId: component.n,
							matchType: 'comment',
							matchText: component.c,
							section: section
						});
					}

					// Search in values object
					if (component.values) {
						const searchInValues = (obj: any, path: string = ''): void => {
							for (const [key, value] of Object.entries(obj)) {
								if (value && typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
									searchMatches.push({
										componentId: component.n,
										matchType: 'values',
										matchField: path ? `${path}.${key}` : key,
										matchText: value,
										section: section
									});
								} else if (value && typeof value === 'object' && !Array.isArray(value)) {
									searchInValues(value, path ? `${path}.${key}` : key);
								} else if (Array.isArray(value)) {
									value.forEach((item, index) => {
										if (item && typeof item === 'string' && item.toLowerCase().includes(searchTerm)) {
											searchMatches.push({
												componentId: component.n,
												matchType: 'values',
												matchField: `${path ? `${path}.` : ''}${key}[${index}]`,
												matchText: item,
												section: section
											});
										} else if (item && typeof item === 'object') {
											searchInValues(item, `${path ? `${path}.` : ''}${key}[${index}]`);
										}
									});
								}
							}
						};

						searchInValues(component.values);
					}
				});
			};

			// Search both preproc and postproc sections
			searchInSection(document.preproc, 'preproc');
			searchInSection(document.postproc, 'postproc');

			setMatches(searchMatches);
			setCurrentMatchIndex(0);
			setIsSearching(false);

			// Highlight all matching components instead of selecting them using unique IDs (section-componentId)
			const matchingUniqueIds = Array.from(new Set(searchMatches.map((match) => `${match.section}-${match.componentId}`)));
			if (onHighlightComponents) {
				onHighlightComponents(matchingUniqueIds);
			}
		},
		[document, onHighlightComponents]
	);

	// Handle search input change
	const handleSearch = useCallback(
		(searchQuery: string) => {
			setQuery(searchQuery);
			performSearch(searchQuery);
		},
		[performSearch]
	);

	// Navigate to next match
	const nextMatch = useCallback(() => {
		if (matches.length > 0) {
			const nextIndex = (currentMatchIndex + 1) % matches.length;
			setCurrentMatchIndex(nextIndex);
			// Optionally, you could scroll to the component here
		}
	}, [matches, currentMatchIndex]);

	// Navigate to previous match
	const prevMatch = useCallback(() => {
		if (matches.length > 0) {
			const prevIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
			setCurrentMatchIndex(prevIndex);
			// Optionally, you could scroll to the component here
		}
	}, [matches, currentMatchIndex]);

	// Get current match for highlighting
	const getCurrentMatch = useCallback(() => {
		return matches[currentMatchIndex] || null;
	}, [matches, currentMatchIndex]);

	const clearSearch = useCallback(() => {
		setQuery('');
		setMatches([]);
		setCurrentMatchIndex(0);
		// Clear highlights instead of selection
		if (onHighlightComponents) {
			onHighlightComponents([]);
		}
	}, [onHighlightComponents]);

	const handleClose = useCallback(() => {
		clearSearch();
		onClose();
	}, [clearSearch, onClose]);

	// Handle keyboard shortcuts
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			switch (event.key) {
				case 'Escape':
					event.preventDefault();
					handleClose();
					break;
				case 'Enter':
					event.preventDefault();
					if (event.shiftKey) {
						prevMatch();
					} else {
						nextMatch();
					}
					break;
				case 'F3':
					event.preventDefault();
					if (event.shiftKey) {
						prevMatch();
					} else {
						nextMatch();
					}
					break;
			}
		},
		[handleClose, nextMatch, prevMatch]
	);

	// Helper to cap string length
	function capStr(str?: string, max = 40) {
		if (!str) return '';
		return str.length > max ? str.slice(0, max) + '…' : str;
	}

	if (!isOpen) {
		return null;
	}

	const uniqueMatches = groupedMatches.length;
	const currentMatch = getCurrentMatch();

	return (
		<div className='fixed top-10 right-4 z-50 bg-vscode-sideBar-background border border-vscode-border rounded shadow-lg w-80'>
			<div className='flex items-center p-3 border-b border-vscode-border'>
				<div className='flex-1 relative'>
					<input
						ref={inputRef}
						type='text'
						value={query}
						onChange={(e) => handleSearch(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder='Search components...'
						className='w-full px-3 py-1 bg-vscode-input-background border border-vscode-input-border 
                     text-vscode-input-foreground placeholder-vscode-input-placeholderForeground
                     focus:outline-none focus:border-vscode-focusBorder rounded text-sm'
					/>
					{query && (
						<button
							onClick={clearSearch}
							className='absolute right-2 top-1/2 transform -translate-y-1/2 text-vscode-secondary hover:text-vscode-foreground'
							title='Clear search'
						>
							✕
						</button>
					)}
				</div>

				<button
					onClick={handleClose}
					className='ml-2 p-1 text-vscode-secondary hover:text-vscode-foreground hover:bg-vscode-button-hoverBackground rounded'
					title='Close search (Esc)'
				>
					✕
				</button>
			</div>

			{/* Search Results */}
			<div className='p-3'>
				<div className='flex items-center justify-between text-sm mb-2'>
					<div className='text-vscode-secondary'>
						{isSearching ? (
							'Searching...'
						) : query ? (
							matches.length > 0 ? (
								<div>
									<div>{uniqueMatches} component{uniqueMatches !== 1 ? 's' : ''} found</div>
									<div>{matches.length} match{matches.length !== 1 ? 'es' : ''} found</div>
								</div>
							) : (
								'No matches found'
							)
						) : (
							'Enter search terms'
						)}
					</div>

					{matches.length > 0 && (
						<div className='flex items-center space-x-2'>
							<span className='text-vscode-secondary text-xs'>
								{currentMatchIndex + 1} of {matches.length}
							</span>
							<div className='flex space-x-1'>
								<button
									onClick={prevMatch}
									disabled={matches.length === 0}
									className='px-2 py-1 text-xs bg-vscode-button-background border border-vscode-button-border 
                           text-vscode-button-foreground rounded hover:bg-vscode-button-hoverBackground
                           disabled:opacity-50 disabled:cursor-not-allowed'
									title='Previous match (Shift+Enter or Shift+F3)'
								>
									↑
								</button>
								<button
									onClick={nextMatch}
									disabled={matches.length === 0}
									className='px-2 py-1 text-xs bg-vscode-button-background border border-vscode-button-border 
                           text-vscode-button-foreground rounded hover:bg-vscode-button-hoverBackground
                           disabled:opacity-50 disabled:cursor-not-allowed'
									title='Next match (Enter or F3)'
								>
									↓
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Match Details */}
				{matches.length > 0 && (
					<div className='max-h-40 overflow-y-auto border border-vscode-border rounded text-xs'>
						{/* Group by section and display with dividers */}
						{['preproc', 'postproc'].map((section) => {
							const sectionGroups = groupedMatches.filter((group) => group.section === section);
							if (sectionGroups.length === 0) return null;

							return (
								<div key={section}>
									{/* Section Header */}
									<div className='px-2 py-1 bg-vscode-tab-inactiveBackground border-b border-vscode-border text-vscode-foreground font-semibold text-sm'>
										{section === 'preproc' ? 'PreProc' : 'PostProc'} 
										<span className='ml-2 text-xs text-vscode-secondary font-normal'>
											({sectionGroups.length} component{sectionGroups.length !== 1 ? 's' : ''})
										</span>
									</div>

									{/* Components in this section */}
									{sectionGroups.map((group) => (
										<div key={`${section}-${group.componentId}`} className='border-b border-vscode-border last:border-b-0'>
											{/* Component Header */}
											<div 
												className='px-2 py-2 bg-vscode-editor-background border-b border-vscode-border cursor-pointer hover:bg-vscode-list-hoverBackground'
												onClick={() => {
													// Switch to the correct section if different from current
													if (onSwitchSection && section !== activeSection) {
														onSwitchSection(section as 'preproc' | 'postproc');
													}
													if (onScrollToComponent) {
														onScrollToComponent(group.componentId);
													}
												}}
												title={`Click to scroll to Component ${group.componentId} in ${section === 'preproc' ? 'PreProc' : 'PostProc'}`}
											>
												<div className='font-medium text-vscode-foreground text-sm'>
													Component {group.componentId}
													<span className='ml-2 text-xs text-vscode-secondary'>
														({group.matches.length} match{group.matches.length !== 1 ? 'es' : ''})
													</span>
												</div>
											</div>

											{/* Matches for this component */}
											{group.matches.map((match, matchIndex) => {
												const globalIndex = matches.findIndex(
													(m) =>
														m.componentId === match.componentId &&
														m.matchType === match.matchType &&
														m.matchField === match.matchField &&
														m.matchText === match.matchText &&
														m.section === match.section
												);

												return (
													<div
														key={`${match.componentId}-${match.section}-${match.matchType}-${
															match.matchField || 'comment'
														}-${matchIndex}`}
														className={`px-4 py-1 cursor-pointer hover:bg-vscode-list-hoverBackground
														${globalIndex === currentMatchIndex ? 'bg-vscode-list-activeSelectionBackground' : ''}`}
														onClick={() => {
															setCurrentMatchIndex(globalIndex);
															// Switch to the correct section if different from current
															if (onSwitchSection && match.section !== activeSection) {
																onSwitchSection(match.section);
															}
															if (onScrollToComponent) {
																onScrollToComponent(match.componentId);
															}
														}}
														title={`Click to scroll to Component ${match.componentId} in ${match.section === 'preproc' ? 'PreProc' : 'PostProc'}`}
													>
														<div className='text-vscode-secondary text-xs'>
															{match.matchType === 'comment' ? 'Comment' : capStr(match.matchField)}:
															<span className='text-vscode-foreground ml-1'>{capStr(match.matchText)}</span>
														</div>
													</div>
												);
											})}
										</div>
									))}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};
