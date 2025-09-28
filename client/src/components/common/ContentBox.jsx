import { useEffect, useRef } from 'react'

function ContentBox({
    value,
    onChange,
    placeholder,
    onSubmit,
    border = '1px solid var(--border, #ddd)',
    fontSize = 16,
    minHeight = 20,
    maxHeight = 250
}) {
    const ref = useRef(null)

    // Keep DOM in sync when `value` changes programmatically
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const text = el.innerText.replace(/\u00A0/g, ' ')
        if (text !== value) {
            el.textContent = value || ''
        }
    }, [value])

    function emit() {
        const el = ref.current
        if (!el) return
        // normalize line breaks and non-breaking spaces
        const text = el.innerText.replace(/\u00A0/g, ' ')
        onChange?.(text)
    }

    function onInput() {
        emit()
    }

    function onPaste(e) {
        // paste as plain text
        e.preventDefault()
        const text = (e.clipboardData || window.clipboardData).getData('text')
        document.execCommand('insertText', false, text)
    }

    function onKeyDown(e) {
        // optional: Ctrl/Cmd+Enter to submit
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            onSubmit?.()
        }
    }

    return (
        <div
            ref={ref}
            contentEditable
            role="textbox"
            aria-multiline="true"
            onInput={onInput}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            data-placeholder={placeholder || ''}
            // styling: auto-grow until 400px, then scroll
            style={{
                minHeight: minHeight,
                maxHeight: maxHeight,
                overflowY: 'auto',
                padding: '8px 10px',
                border: border,
                borderRadius: 8,
                background: 'var(--card, #fff)',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: fontSize
            }}
            className="ce-input"
            suppressContentEditableWarning
        />
    )
}


export default ContentBox;