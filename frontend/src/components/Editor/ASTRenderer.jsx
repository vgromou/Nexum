/**
 * ASTRenderer - Converts AST nodes to React elements
 *
 * This component renders the AST structure as DOM elements.
 * It handles text nodes, links, inline code, and all mark types.
 */

import React, { memo } from 'react';
import { NODE_TYPES, MARK_TYPES } from './utils/ast-types.js';

/**
 * Apply marks to a React element by wrapping it in formatting elements
 * Marks are applied from inside out (first mark = innermost wrapper)
 *
 * @param {React.ReactElement} element - Base element to wrap
 * @param {import('./utils/ast-types.js').Mark[]} marks - Array of marks to apply
 * @param {string} key - Unique key for React
 * @returns {React.ReactElement}
 */
const applyMarks = (element, marks, key) => {
    if (!marks || marks.length === 0) {
        return element;
    }

    let result = element;

    // Apply marks in order (innermost first)
    for (let i = 0; i < marks.length; i++) {
        const mark = marks[i];
        const markKey = `${key}-mark-${i}`;

        switch (mark.type) {
            case MARK_TYPES.BOLD:
                result = <strong key={markKey}>{result}</strong>;
                break;

            case MARK_TYPES.ITALIC:
                result = <em key={markKey}>{result}</em>;
                break;

            case MARK_TYPES.UNDERLINE:
                result = <u key={markKey}>{result}</u>;
                break;

            case MARK_TYPES.STRIKETHROUGH:
                result = <s key={markKey}>{result}</s>;
                break;

            case MARK_TYPES.CODE:
                result = <code key={markKey}>{result}</code>;
                break;

            case MARK_TYPES.TEXT_COLOR:
                result = (
                    <span
                        key={markKey}
                        className={`text-color-${mark.color}`}
                        data-text-color={mark.color}
                    >
                        {result}
                    </span>
                );
                break;

            case MARK_TYPES.BACKGROUND_COLOR:
                result = (
                    <span
                        key={markKey}
                        className={`highlight-${mark.color}`}
                        data-highlight={mark.color}
                    >
                        {result}
                    </span>
                );
                break;

            default:
                // Unknown mark type - ignore
                break;
        }
    }

    return result;
};

/**
 * Render a single inline node (text, link, or inline-code)
 */
const InlineNode = memo(({ node, nodeKey }) => {
    if (!node) return null;

    switch (node.type) {
        case NODE_TYPES.TEXT: {
            // Empty text node - render as empty span for cursor positioning
            if (node.text === '') {
                return <span key={nodeKey} data-empty-text="true" />;
            }

            // Create base text element
            const textElement = <span key={`${nodeKey}-text`}>{node.text}</span>;

            // Apply marks if any
            return applyMarks(textElement, node.marks, nodeKey);
        }

        case NODE_TYPES.LINK: {
            const linkContent = (
                <a
                    key={`${nodeKey}-link`}
                    href={node.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-link-url={node.url}
                >
                    {node.children.map((child, i) => (
                        <InlineNode
                            key={`${nodeKey}-link-child-${i}`}
                            node={child}
                            nodeKey={`${nodeKey}-link-child-${i}`}
                        />
                    ))}
                </a>
            );

            // Links can also have marks (e.g., bold link)
            return applyMarks(linkContent, node.marks, nodeKey);
        }

        case NODE_TYPES.INLINE_CODE: {
            // Inline code is rendered as <code> element
            return (
                <code key={nodeKey} data-inline-code="true">
                    {node.text}
                </code>
            );
        }

        default:
            // Unknown node type - ignore silently
            return null;
    }
});

InlineNode.displayName = 'InlineNode';

/**
 * Render block content (array of inline nodes)
 *
 * @param {Object} props
 * @param {import('./utils/ast-types.js').InlineNode[]} props.children - Array of inline nodes
 * @param {string} [props.blockKey] - Optional key prefix for child elements
 */
const BlockContent = memo(({ children, blockKey = 'block' }) => {
    if (!children || children.length === 0) {
        // Empty block - render placeholder for cursor
        return <span data-empty-block="true" />;
    }

    return (
        <>
            {children.map((node, index) => (
                <InlineNode
                    key={`${blockKey}-node-${index}`}
                    node={node}
                    nodeKey={`${blockKey}-node-${index}`}
                />
            ))}
        </>
    );
});

BlockContent.displayName = 'BlockContent';

/**
 * Render a complete block with its wrapper element
 *
 * @param {Object} props
 * @param {import('./utils/ast-types.js').Block} props.block - The block to render
 * @param {Object} [props.attributes] - Additional attributes for the wrapper element
 * @param {React.Ref} [props.innerRef] - Ref for the content element
 * @param {boolean} [props.editable=false] - Whether the block is editable
 */
const BlockRenderer = memo(({
    block,
    attributes = {},
    innerRef,
    editable = false,
    onInput,
    onKeyDown,
    onFocus,
    onBlur,
    placeholder,
    className = '',
}) => {
    if (!block) return null;

    // Determine the HTML tag based on block type
    const getTagName = (type) => {
        switch (type) {
            case 'h1': return 'h1';
            case 'h2': return 'h2';
            case 'h3': return 'h3';
            case 'h4': return 'h4';
            case 'quote': return 'blockquote';
            case 'bulleted-list':
            case 'numbered-list':
                return 'div'; // Lists use div with special styling
            case 'paragraph':
            default:
                return 'p';
        }
    };

    const Tag = getTagName(block.type);
    const indentLevel = block.metadata?.indentLevel || 0;

    // Build class name
    const blockClassName = [
        'block-content',
        `block-type-${block.type}`,
        indentLevel > 0 ? `indent-level-${indentLevel}` : '',
        className,
    ].filter(Boolean).join(' ');

    // Build data attributes
    const dataAttributes = {
        'data-block-id': block.id,
        'data-block-type': block.type,
        ...(indentLevel > 0 && { 'data-indent-level': indentLevel }),
        ...(placeholder && { 'data-placeholder': placeholder }),
    };

    const elementProps = {
        ref: innerRef,
        className: blockClassName,
        ...dataAttributes,
        ...attributes,
        ...(editable && {
            contentEditable: true,
            suppressContentEditableWarning: true,
            onInput,
            onKeyDown,
            onFocus,
            onBlur,
        }),
    };

    return React.createElement(
        Tag,
        elementProps,
        <BlockContent children={block.children} blockKey={block.id} />
    );
});

BlockRenderer.displayName = 'BlockRenderer';

/**
 * Debug component to visualize AST structure
 */
const ASTDebugView = memo(({ children, expanded = false }) => {
    if (!children) return null;

    const renderNode = (node, depth = 0) => {
        const indent = '  '.repeat(depth);

        if (node.type === NODE_TYPES.TEXT) {
            const marks = node.marks?.map(m => m.type).join(', ') || 'none';
            return `${indent}TEXT: "${node.text}" [marks: ${marks}]`;
        }

        if (node.type === NODE_TYPES.LINK) {
            const childrenStr = node.children
                .map(c => renderNode(c, depth + 1))
                .join('\n');
            return `${indent}LINK: ${node.url}\n${childrenStr}`;
        }

        if (node.type === NODE_TYPES.INLINE_CODE) {
            return `${indent}CODE: "${node.text}"`;
        }

        return `${indent}UNKNOWN: ${JSON.stringify(node)}`;
    };

    const output = children.map((node, i) => renderNode(node, 0)).join('\n');

    if (!expanded) {
        return null;
    }

    return (
        <pre
            style={{
                fontSize: '10px',
                background: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
            }}
        >
            {output}
        </pre>
    );
});

ASTDebugView.displayName = 'ASTDebugView';

// Named exports
export { InlineNode, BlockContent, BlockRenderer, ASTDebugView, applyMarks };

// Default export
export default BlockContent;
