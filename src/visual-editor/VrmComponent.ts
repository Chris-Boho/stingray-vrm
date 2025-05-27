import * as vscode from 'vscode';

export interface VrmComponent {
    n: number;           // Component number/ID
    t: string;           // Component type (IF, SELECTQUERY, etc.)
    values?: any;        // Component-specific values
    j: number[];         // Jump/connection targets
    x: number;           // X coordinate
    y: number;           // Y coordinate
    c: string;           // Comment/description
    wp: boolean;         // Watchpoint flag
    section: 'preproc' | 'postproc'; // New field to track component section
}